package com.sulabh.sulabh_backend.dto;

import com.sulabh.sulabh_backend.entity.Complaint;
import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
@Builder
public class ComplaintResponse {
    
    private Long id;
    private String category;
    private String subject;
    private String description;
    private String location;
    private String priority;
    private String status;
    private String assignedTo;
    private List<String> attachments;
    private Date submittedAt;
    private Date updatedAt;
    private Date resolvedAt;
    private UserResponse user;
    private List<ComplaintUpdateResponse> updates;
}