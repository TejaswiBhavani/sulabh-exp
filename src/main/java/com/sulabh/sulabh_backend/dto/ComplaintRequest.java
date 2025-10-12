package com.sulabh.sulabh_backend.dto;

import com.sulabh.sulabh_backend.entity.Complaint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ComplaintRequest {
    
    @NotNull(message = "Category is required")
    private Complaint.ComplaintCategory category;
    
    @NotBlank(message = "Subject is required")
    @Size(min = 10, max = 500, message = "Subject must be between 10 and 500 characters")
    private String subject;
    
    @NotBlank(message = "Description is required")
    @Size(min = 50, max = 2000, message = "Description must be between 50 and 2000 characters")
    private String description;
    
    @NotBlank(message = "Location is required")
    @Size(min = 5, max = 500, message = "Location must be between 5 and 500 characters")
    private String location;
    
    private Complaint.Priority priority = Complaint.Priority.MEDIUM;
    
    private List<String> attachments;
}