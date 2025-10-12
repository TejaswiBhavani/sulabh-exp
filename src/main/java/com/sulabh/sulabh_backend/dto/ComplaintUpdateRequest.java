package com.sulabh.sulabh_backend.dto;

import com.sulabh.sulabh_backend.entity.Complaint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ComplaintUpdateRequest {
    
    @NotBlank(message = "Message is required")
    @Size(min = 10, max = 1000, message = "Message must be between 10 and 1000 characters")
    private String message;
    
    private Complaint.ComplaintStatus status;
    
    private List<String> attachments;
}