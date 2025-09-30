package com.sulabh.sulabh_backend.controller;

import com.sulabh.sulabh_backend.dto.TransactionRequest;
import com.sulabh.sulabh_backend.dto.TransactionResponse;
import com.sulabh.sulabh_backend.entity.Transaction;
import com.sulabh.sulabh_backend.service.TransactionService;
import com.sulabh.sulabh_backend.util.ResponseMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}")
public class TransactionController {

    private final TransactionService transactionService;
    private final ResponseMapper responseMapper;

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionRequest request,
            Authentication authentication) {
        Transaction transaction = new Transaction();
        transaction.setAmount(request.getAmount());
        transaction.setPaymentMethod(request.getPaymentMethod());
        transaction.setStatus("PENDING"); // Initial status

        Transaction saved = transactionService.createTransaction(transaction, authentication.getName());
        return ResponseEntity.ok(responseMapper.toTransactionResponse(saved));
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getUserTransactions(Authentication authentication) {
        List<Transaction> transactions = transactionService.getUserTransactions(authentication.getName());
        return ResponseEntity.ok(responseMapper.toTransactionResponseList(transactions));
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransaction(@PathVariable String transactionId) {
        Transaction transaction = transactionService.getTransaction(transactionId);
        return ResponseEntity.ok(responseMapper.toTransactionResponse(transaction));
    }
}
