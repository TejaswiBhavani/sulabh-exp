package com.sulabh.sulabh_backend.controller;

import com.sulabh.sulabh_backend.dto.ComplaintRequest;
import com.sulabh.sulabh_backend.dto.ComplaintResponse;
import com.sulabh.sulabh_backend.dto.ComplaintUpdateRequest;
import com.sulabh.sulabh_backend.dto.ComplaintUpdateResponse;
import com.sulabh.sulabh_backend.entity.Complaint;
import com.sulabh.sulabh_backend.entity.User;
import com.sulabh.sulabh_backend.service.ComplaintService;
import com.sulabh.sulabh_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}", maxAge = 3600, allowCredentials = "true")
public class ComplaintController {
    
    private final ComplaintService complaintService;
    private final UserService userService;
    
    @PostMapping
    public ResponseEntity<ComplaintResponse> submitComplaint(
            @Valid @RequestBody ComplaintRequest request,
            Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        ComplaintResponse response = complaintService.submitComplaint(request, user);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getComplaint(@PathVariable Long id) {
        ComplaintResponse response = complaintService.getComplaintById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        List<ComplaintResponse> complaints = complaintService.getComplaintsByUser(user);
        return ResponseEntity.ok(complaints);
    }
    
    @GetMapping("/my/paginated")
    public ResponseEntity<Page<ComplaintResponse>> getMyComplaintsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByUser(user, page, size);
        return ResponseEntity.ok(complaints);
    }
    
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints() {
        List<ComplaintResponse> complaints = complaintService.getAllComplaints();
        return ResponseEntity.ok(complaints);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ComplaintResponse>> getComplaintsByStatus(@PathVariable String status) {
        Complaint.ComplaintStatus complaintStatus = Complaint.ComplaintStatus.valueOf(status.toUpperCase());
        List<ComplaintResponse> complaints = complaintService.getComplaintsByStatus(complaintStatus);
        return ResponseEntity.ok(complaints);
    }
    
    @PostMapping("/{id}/updates")
    public ResponseEntity<ComplaintUpdateResponse> addComplaintUpdate(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintUpdateRequest request,
            Authentication authentication) {
        ComplaintUpdateResponse response = complaintService.addComplaintUpdate(id, request, authentication.getName());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}/updates")
    public ResponseEntity<List<ComplaintUpdateResponse>> getComplaintUpdates(@PathVariable Long id) {
        List<ComplaintUpdateResponse> updates = complaintService.getComplaintUpdates(id);
        return ResponseEntity.ok(updates);
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateComplaintStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusRequest,
            Authentication authentication) {
        String status = statusRequest.get("status");
        Complaint.ComplaintStatus complaintStatus = Complaint.ComplaintStatus.valueOf(status.toUpperCase());
        ComplaintResponse response = complaintService.updateComplaintStatus(id, complaintStatus, authentication.getName());
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplaint(@PathVariable Long id, Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        complaintService.deleteComplaint(id, user);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getComplaintStats(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        
        Map<String, Object> stats = Map.of(
            "total", complaintService.getUserComplaintsCount(user),
            "pending", complaintService.getUserComplaintsCountByStatus(user, Complaint.ComplaintStatus.PENDING),
            "inProgress", complaintService.getUserComplaintsCountByStatus(user, Complaint.ComplaintStatus.IN_PROGRESS),
            "resolved", complaintService.getUserComplaintsCountByStatus(user, Complaint.ComplaintStatus.RESOLVED),
            "closed", complaintService.getUserComplaintsCountByStatus(user, Complaint.ComplaintStatus.CLOSED)
        );
        
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/admin/stats")
    public ResponseEntity<Map<String, Object>> getAdminComplaintStats() {
        Map<String, Object> stats = Map.of(
            "total", complaintService.getTotalComplaintsCount(),
            "pending", complaintService.getComplaintsCountByStatus(Complaint.ComplaintStatus.PENDING),
            "inProgress", complaintService.getComplaintsCountByStatus(Complaint.ComplaintStatus.IN_PROGRESS),
            "resolved", complaintService.getComplaintsCountByStatus(Complaint.ComplaintStatus.RESOLVED),
            "closed", complaintService.getComplaintsCountByStatus(Complaint.ComplaintStatus.CLOSED)
        );
        
        return ResponseEntity.ok(stats);
    }
}