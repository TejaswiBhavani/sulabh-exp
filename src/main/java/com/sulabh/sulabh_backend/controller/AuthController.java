package com.sulabh.sulabh_backend.controller;

import com.sulabh.sulabh_backend.dto.AuthRequest;
import com.sulabh.sulabh_backend.dto.AuthResponse;
import com.sulabh.sulabh_backend.dto.RegisterRequest;
import com.sulabh.sulabh_backend.dto.UserResponse;
import com.sulabh.sulabh_backend.entity.User;
import com.sulabh.sulabh_backend.service.AuthService;
import com.sulabh.sulabh_backend.service.UserService;
import com.sulabh.sulabh_backend.util.ResponseMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}", maxAge = 3600)
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final ResponseMapper responseMapper;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(responseMapper.toUserResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // JWT tokens are stateless, so logout is handled client-side
        // This endpoint is mainly for frontend compatibility
        return ResponseEntity.ok().build();
    }
}
