package com.sulabh.sulabh_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "complaint_updates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintUpdate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private Complaint complaint;
    
    @Column(nullable = false, length = 1000)
    private String message;
    
    @Enumerated(EnumType.STRING)
    private Complaint.ComplaintStatus status;
    
    @Column(name = "updated_by", nullable = false)
    private String updatedBy;
    
    @ElementCollection
    @CollectionTable(name = "complaint_update_attachments", joinColumns = @JoinColumn(name = "update_id"))
    @Column(name = "file_path")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();
    
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Date updatedAt = new Date();
}