package com.sulabh.sulabh_backend.service;

import com.sulabh.sulabh_backend.dto.AccountResponse;
import com.sulabh.sulabh_backend.dto.TransferRequest;
import com.sulabh.sulabh_backend.entity.Account;
import com.sulabh.sulabh_backend.entity.Transaction;
import com.sulabh.sulabh_backend.entity.User;
import com.sulabh.sulabh_backend.repository.AccountRepository;
import com.sulabh.sulabh_backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public AccountResponse getAccountByUser(String userEmail) {
        User user = userService.getCurrentUser(userEmail);
        Account account = accountRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Account not found for user: " + userEmail));

        return mapToAccountResponse(account);
    }

    @Transactional(readOnly = true)
    public BigDecimal getAccountBalance(String userEmail) {
        User user = userService.getCurrentUser(userEmail);
        Account account = accountRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Account not found for user: " + userEmail));

        return account.getBalance();
    }

    @Transactional
    public Account createAccountForUser(User user) {
        // Check if user already has an account
        if (accountRepository.findByUser(user).isPresent()) {
            throw new RuntimeException("User already has an account");
        }

        Account account = Account.builder()
                .accountNumber(generateAccountNumber())
                .balance(BigDecimal.ZERO)
                .accountType("SAVINGS")
                .user(user)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return accountRepository.save(account);
    }

    @Transactional
    public Transaction transfer(String fromUserEmail, TransferRequest transferRequest) {
        // Get sender's account
        User fromUser = userService.getCurrentUser(fromUserEmail);
        Account fromAccount = accountRepository.findByUser(fromUser)
                .orElseThrow(() -> new RuntimeException("Sender account not found"));

        // Get receiver's account
        Account toAccount = accountRepository.findByAccountNumber(transferRequest.getToAccountNumber())
                .orElseThrow(() -> new RuntimeException("Receiver account not found"));

        // Validate sufficient balance
        if (fromAccount.getBalance().compareTo(transferRequest.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        // Validate not transferring to same account
        if (fromAccount.getId().equals(toAccount.getId())) {
            throw new RuntimeException("Cannot transfer to the same account");
        }

        // Perform transfer
        fromAccount.setBalance(fromAccount.getBalance().subtract(transferRequest.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(transferRequest.getAmount()));

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        // Create transaction record
        Transaction transaction = new Transaction();
        transaction.setTransactionId(generateTransactionId());
        transaction.setAmount(transferRequest.getAmount());
        transaction.setStatus("COMPLETED");
        transaction.setPaymentMethod("TRANSFER");
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUser(fromUser);

        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction deposit(String userEmail, BigDecimal amount, String description) {
        User user = userService.getCurrentUser(userEmail);
        Account account = accountRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // Update balance
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);

        // Create transaction record
        Transaction transaction = new Transaction();
        transaction.setTransactionId(generateTransactionId());
        transaction.setAmount(amount);
        transaction.setStatus("COMPLETED");
        transaction.setPaymentMethod("DEPOSIT");
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setUser(user);

        return transactionRepository.save(transaction);
    }

    private String generateAccountNumber() {
        String accountNumber;
        do {
            accountNumber = String.format("%010d", new Random().nextInt(1000000000));
        } while (accountRepository.existsByAccountNumber(accountNumber));

        return accountNumber;
    }

    private String generateTransactionId() {
        return "TXN" + System.currentTimeMillis() + new Random().nextInt(1000);
    }

    private AccountResponse mapToAccountResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .balance(account.getBalance())
                .accountType(account.getAccountType())
                .userId(account.getUser().getId())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
