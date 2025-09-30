package com.sulabh.sulabh_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private String transactionId;
    private BigDecimal amount;
    private String status;
    private String paymentMethod;
    private String createdAt;  // Changed from LocalDateTime to String
    private String userEmail;
    private String description;
}
