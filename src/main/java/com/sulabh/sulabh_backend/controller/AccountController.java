package com.sulabh.sulabh_backend.controller;

import com.sulabh.sulabh_backend.dto.AccountResponse;
import com.sulabh.sulabh_backend.dto.TransactionResponse;
import com.sulabh.sulabh_backend.dto.TransferRequest;
import com.sulabh.sulabh_backend.entity.Transaction;
import com.sulabh.sulabh_backend.service.AccountService;
import com.sulabh.sulabh_backend.util.ResponseMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class AccountController {

    private final AccountService accountService;
    private final ResponseMapper responseMapper;

    @GetMapping
    public ResponseEntity<AccountResponse> getAccountInfo(Authentication authentication) {
        AccountResponse account = accountService.getAccountByUser(authentication.getName());
        return ResponseEntity.ok(account);
    }

    @GetMapping("/balance")
    public ResponseEntity<Map<String, BigDecimal>> getBalance(Authentication authentication) {
        BigDecimal balance = accountService.getAccountBalance(authentication.getName());
        return ResponseEntity.ok(Map.of("balance", balance));
    }

    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(
            @Valid @RequestBody TransferRequest transferRequest,
            Authentication authentication) {
        Transaction transaction = accountService.transfer(authentication.getName(), transferRequest);
        return ResponseEntity.ok(responseMapper.toTransactionResponse(transaction));
    }

    @PostMapping("/deposit")
    public ResponseEntity<TransactionResponse> deposit(
            @RequestBody Map<String, Object> depositRequest,
            Authentication authentication) {
        BigDecimal amount = new BigDecimal(depositRequest.get("amount").toString());
        String description = (String) depositRequest.get("description");

        Transaction transaction = accountService.deposit(authentication.getName(), amount, description);
        return ResponseEntity.ok(responseMapper.toTransactionResponse(transaction));
    }
}
