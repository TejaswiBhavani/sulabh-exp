package com.sulabh.sulabh_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
@Builder
public class ComplaintUpdateResponse {
    
    private Long id;
    private String message;
    private String status;
    private String updatedBy;
    private List<String> attachments;
    private Date updatedAt;
}