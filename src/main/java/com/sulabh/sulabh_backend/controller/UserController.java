package com.sulabh.sulabh_backend.controller;

import com.sulabh.sulabh_backend.dto.UserResponse;
import com.sulabh.sulabh_backend.entity.User;
import com.sulabh.sulabh_backend.service.UserService;
import com.sulabh.sulabh_backend.util.ResponseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class UserController {

    private final UserService userService;
    private final ResponseMapper responseMapper;

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(responseMapper.toUserResponse(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestBody Map<String, String> updateRequest,
            Authentication authentication) {

        User user = userService.getCurrentUser(authentication.getName());

        if (updateRequest.containsKey("fullName")) {
            user.setFullName(updateRequest.get("fullName"));
        }
        if (updateRequest.containsKey("phoneNumber")) {
            user.setPhoneNumber(updateRequest.get("phoneNumber"));
        }

        User updatedUser = userService.updateUser(user);
        return ResponseEntity.ok(responseMapper.toUserResponse(updatedUser));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody Map<String, String> passwordRequest,
            Authentication authentication) {

        String currentPassword = passwordRequest.get("currentPassword");
        String newPassword = passwordRequest.get("newPassword");

        userService.changePassword(authentication.getName(), currentPassword, newPassword);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
