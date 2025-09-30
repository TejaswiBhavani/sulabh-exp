package com.sulabh.sulabh_backend.util;

import com.sulabh.sulabh_backend.dto.TransactionResponse;
import com.sulabh.sulabh_backend.dto.UserResponse;
import com.sulabh.sulabh_backend.entity.Transaction;
import com.sulabh.sulabh_backend.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ResponseMapper {

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .build();
    }

    public TransactionResponse toTransactionResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .transactionId(transaction.getTransactionId())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .paymentMethod(transaction.getPaymentMethod())
                .createdAt(transaction.getCreatedAt().toString())
                .userEmail(transaction.getUser().getEmail())
                .build();
    }

    public List<TransactionResponse> toTransactionResponseList(List<Transaction> transactions) {
        return transactions.stream()
                .map(this::toTransactionResponse)
                .collect(Collectors.toList());
    }
}
