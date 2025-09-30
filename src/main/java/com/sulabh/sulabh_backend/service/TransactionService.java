package com.sulabh.sulabh_backend.service;

import com.sulabh.sulabh_backend.entity.Transaction;
import com.sulabh.sulabh_backend.entity.User;
import com.sulabh.sulabh_backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserService userService;

    @Transactional
    public Transaction createTransaction(Transaction transaction, String userEmail) {
        User user = userService.getCurrentUser(userEmail);
        transaction.setUser(user);
        transaction.setTransactionId(generateTransactionId());
        return transactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getUserTransactions(String userEmail) {
        User user = userService.getCurrentUser(userEmail);
        return transactionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public Transaction getTransaction(String transactionId) {
        return transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));
    }

    private String generateTransactionId() {
        return UUID.randomUUID().toString();
    }
}
