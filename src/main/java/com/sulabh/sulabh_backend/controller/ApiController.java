package com.sulabh.sulabh_backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> getStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "ok");
        status.put("message", "SULABH Banking API is running");
        status.put("version", "1.0.0");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/user/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile() {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", 1);
        profile.put("name", "Demo User");
        profile.put("email", "demo@sulabh.com");
        profile.put("role", "user");
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/demo/complaints")
    public ResponseEntity<List<Map<String, Object>>> getComplaints() {
        List<Map<String, Object>> complaints = new ArrayList<>();
        Map<String, Object> complaint = new HashMap<>();
        complaint.put("id", 1);
        complaint.put("title", "Sample Banking Issue");
        complaint.put("description", "This is a demo complaint for the SULABH Banking system");
        complaint.put("status", "open");
        complaint.put("createdAt", new Date());
        complaints.add(complaint);
        return ResponseEntity.ok(complaints);
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<Map<String, Object>>> getSuggestions() {
        List<Map<String, Object>> suggestions = new ArrayList<>();
        Map<String, Object> suggestion = new HashMap<>();
        suggestion.put("id", 1);
        suggestion.put("title", "Improve Mobile Banking");
        suggestion.put("description", "Add more features to the mobile banking app");
        suggestion.put("status", "pending");
        suggestion.put("createdAt", new Date());
        suggestions.add(suggestion);
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalComplaints", 5);
        stats.put("resolvedComplaints", 3);
        stats.put("pendingComplaints", 2);
        stats.put("totalSuggestions", 8);
        stats.put("totalUsers", 150);
        return ResponseEntity.ok(stats);
    }
}