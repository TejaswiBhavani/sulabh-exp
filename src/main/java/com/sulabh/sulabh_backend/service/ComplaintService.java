package com.sulabh.sulabh_backend.service;

import com.sulabh.sulabh_backend.dto.ComplaintRequest;
import com.sulabh.sulabh_backend.dto.ComplaintResponse;
import com.sulabh.sulabh_backend.dto.ComplaintUpdateRequest;
import com.sulabh.sulabh_backend.dto.ComplaintUpdateResponse;
import com.sulabh.sulabh_backend.entity.Complaint;
import com.sulabh.sulabh_backend.entity.ComplaintUpdate;
import com.sulabh.sulabh_backend.entity.User;
import com.sulabh.sulabh_backend.repository.ComplaintRepository;
import com.sulabh.sulabh_backend.repository.ComplaintUpdateRepository;
import com.sulabh.sulabh_backend.util.ResponseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ComplaintService {
    
    private final ComplaintRepository complaintRepository;
    private final ComplaintUpdateRepository complaintUpdateRepository;
    private final ResponseMapper responseMapper;
    
    public ComplaintResponse submitComplaint(ComplaintRequest request, User user) {
        Complaint complaint = Complaint.builder()
                .user(user)
                .category(request.getCategory())
                .subject(request.getSubject())
                .description(request.getDescription())
                .location(request.getLocation())
                .priority(request.getPriority())
                .status(Complaint.ComplaintStatus.PENDING)
                .attachments(request.getAttachments())
                .submittedAt(new Date())
                .updatedAt(new Date())
                .build();
        
        complaint = complaintRepository.save(complaint);
        
        // Create initial update
        ComplaintUpdate initialUpdate = ComplaintUpdate.builder()
                .complaint(complaint)
                .message("Complaint submitted successfully")
                .status(Complaint.ComplaintStatus.PENDING)
                .updatedBy(user.getEmail())
                .updatedAt(new Date())
                .build();
        
        complaintUpdateRepository.save(initialUpdate);
        
        return responseMapper.toComplaintResponse(complaint);
    }
    
    public ComplaintResponse getComplaintById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
        return responseMapper.toComplaintResponse(complaint);
    }
    
    public List<ComplaintResponse> getComplaintsByUser(User user) {
        List<Complaint> complaints = complaintRepository.findByUserOrderBySubmittedAtDesc(user);
        return complaints.stream()
                .map(responseMapper::toComplaintResponse)
                .collect(Collectors.toList());
    }
    
    public Page<ComplaintResponse> getComplaintsByUser(User user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Complaint> complaints = complaintRepository.findByUserOrderBySubmittedAtDesc(user, pageable);
        return complaints.map(responseMapper::toComplaintResponse);
    }
    
    public List<ComplaintResponse> getAllComplaints() {
        List<Complaint> complaints = complaintRepository.findAll();
        return complaints.stream()
                .map(responseMapper::toComplaintResponse)
                .collect(Collectors.toList());
    }
    
    public List<ComplaintResponse> getComplaintsByStatus(Complaint.ComplaintStatus status) {
        List<Complaint> complaints = complaintRepository.findByStatusOrderBySubmittedAtDesc(status);
        return complaints.stream()
                .map(responseMapper::toComplaintResponse)
                .collect(Collectors.toList());
    }
    
    public ComplaintUpdateResponse addComplaintUpdate(Long complaintId, ComplaintUpdateRequest request, String updatedBy) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + complaintId));
        
        ComplaintUpdate update = ComplaintUpdate.builder()
                .complaint(complaint)
                .message(request.getMessage())
                .status(request.getStatus())
                .updatedBy(updatedBy)
                .attachments(request.getAttachments())
                .updatedAt(new Date())
                .build();
        
        update = complaintUpdateRepository.save(update);
        
        // Update complaint status if provided
        if (request.getStatus() != null) {
            complaint.setStatus(request.getStatus());
            complaint.setUpdatedAt(new Date());
            if (request.getStatus() == Complaint.ComplaintStatus.RESOLVED) {
                complaint.setResolvedAt(new Date());
            }
            complaintRepository.save(complaint);
        }
        
        return responseMapper.toComplaintUpdateResponse(update);
    }
    
    public List<ComplaintUpdateResponse> getComplaintUpdates(Long complaintId) {
        List<ComplaintUpdate> updates = complaintUpdateRepository.findByComplaintIdOrderByUpdatedAtDesc(complaintId);
        return updates.stream()
                .map(responseMapper::toComplaintUpdateResponse)
                .collect(Collectors.toList());
    }
    
    public ComplaintResponse updateComplaintStatus(Long complaintId, Complaint.ComplaintStatus status, String updatedBy) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + complaintId));
        
        complaint.setStatus(status);
        complaint.setUpdatedAt(new Date());
        
        if (status == Complaint.ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(new Date());
        }
        
        complaint = complaintRepository.save(complaint);
        
        // Add status update
        ComplaintUpdate update = ComplaintUpdate.builder()
                .complaint(complaint)
                .message("Status updated to " + status.name())
                .status(status)
                .updatedBy(updatedBy)
                .updatedAt(new Date())
                .build();
        
        complaintUpdateRepository.save(update);
        
        return responseMapper.toComplaintResponse(complaint);
    }
    
    public void deleteComplaint(Long complaintId, User user) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + complaintId));
        
        // Only allow user to delete their own complaints and only if it's pending
        if (!complaint.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own complaints");
        }
        
        if (complaint.getStatus() != Complaint.ComplaintStatus.PENDING) {
            throw new RuntimeException("You can only delete pending complaints");
        }
        
        complaintRepository.delete(complaint);
    }
    
    // Statistics methods
    public Long getTotalComplaintsCount() {
        return complaintRepository.count();
    }
    
    public Long getComplaintsCountByStatus(Complaint.ComplaintStatus status) {
        return complaintRepository.countByStatus(status);
    }
    
    public Long getUserComplaintsCount(User user) {
        return complaintRepository.countByUser(user);
    }
    
    public Long getUserComplaintsCountByStatus(User user, Complaint.ComplaintStatus status) {
        return complaintRepository.countByUserAndStatus(user, status);
    }
}