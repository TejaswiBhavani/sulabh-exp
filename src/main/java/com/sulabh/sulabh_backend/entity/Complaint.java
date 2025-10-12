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
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintCategory category;
    
    @Column(nullable = false, length = 500)
    private String subject;
    
    @Column(nullable = false, length = 2000)
    private String description;
    
    @Column(nullable = false, length = 500)
    private String location;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.PENDING;
    
    @Column(name = "assigned_to")
    private String assignedTo;
    
    @ElementCollection
    @CollectionTable(name = "complaint_attachments", joinColumns = @JoinColumn(name = "complaint_id"))
    @Column(name = "file_path")
    @Builder.Default
    private List<String> attachments = new ArrayList<>();
    
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "submitted_at", nullable = false)
    @Builder.Default
    private Date submittedAt = new Date();
    
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Date updatedAt = new Date();
    
    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "resolved_at")
    private Date resolvedAt;
    
    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ComplaintUpdate> updates = new ArrayList<>();
    
    public enum ComplaintCategory {
        SANITATION,
        INFRASTRUCTURE,
        PUBLIC_SERVICES,
        UTILITIES,
        TRANSPORTATION,
        OTHER
    }
    
    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }
    
    public enum ComplaintStatus {
        PENDING,
        IN_PROGRESS,
        RESOLVED,
        ESCALATED,
        CLOSED
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = new Date();
        if (this.status == ComplaintStatus.RESOLVED && this.resolvedAt == null) {
            this.resolvedAt = new Date();
        }
    }
}