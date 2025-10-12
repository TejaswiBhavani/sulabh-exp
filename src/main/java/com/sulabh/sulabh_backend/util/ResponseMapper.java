package com.sulabh.sulabh_backend.util;

import com.sulabh.sulabh_backend.dto.ComplaintResponse;
import com.sulabh.sulabh_backend.dto.ComplaintUpdateResponse;
import com.sulabh.sulabh_backend.dto.TransactionResponse;
import com.sulabh.sulabh_backend.dto.UserResponse;
import com.sulabh.sulabh_backend.entity.Complaint;
import com.sulabh.sulabh_backend.entity.ComplaintUpdate;
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

    public ComplaintResponse toComplaintResponse(Complaint complaint) {
        return ComplaintResponse.builder()
                .id(complaint.getId())
                .category(complaint.getCategory().name())
                .subject(complaint.getSubject())
                .description(complaint.getDescription())
                .location(complaint.getLocation())
                .priority(complaint.getPriority().name())
                .status(complaint.getStatus().name())
                .assignedTo(complaint.getAssignedTo())
                .attachments(complaint.getAttachments())
                .submittedAt(complaint.getSubmittedAt())
                .updatedAt(complaint.getUpdatedAt())
                .resolvedAt(complaint.getResolvedAt())
                .user(toUserResponse(complaint.getUser()))
                .updates(complaint.getUpdates().stream()
                        .map(this::toComplaintUpdateResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    public ComplaintUpdateResponse toComplaintUpdateResponse(ComplaintUpdate update) {
        return ComplaintUpdateResponse.builder()
                .id(update.getId())
                .message(update.getMessage())
                .status(update.getStatus() != null ? update.getStatus().name() : null)
                .updatedBy(update.getUpdatedBy())
                .attachments(update.getAttachments())
                .updatedAt(update.getUpdatedAt())
                .build();
    }
}
