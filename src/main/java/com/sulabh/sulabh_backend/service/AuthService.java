package com.sulabh.sulabh_backend.service;

import com.sulabh.sulabh_backend.dto.AuthRequest;
import com.sulabh.sulabh_backend.dto.AuthResponse;
import com.sulabh.sulabh_backend.dto.RegisterRequest;
import com.sulabh.sulabh_backend.dto.UserResponse;
import com.sulabh.sulabh_backend.entity.User;
import com.sulabh.sulabh_backend.repository.UserRepository;
import com.sulabh.sulabh_backend.security.JwtTokenProvider;
import com.sulabh.sulabh_backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final AccountService accountService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .enabled(true)
                .build();

        user = userRepository.save(user);

        // Automatically create a bank account for the new user
        try {
            accountService.createAccountForUser(user);
        } catch (Exception e) {
            // Log the error but don't fail registration
            System.err.println("Failed to create account for user: " + user.getEmail() + ", Error: " + e.getMessage());
        }

        String token = jwtTokenProvider.generateToken(new UserPrincipal(user));

        return createAuthResponse(user, token);
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generateToken(new UserPrincipal(user));

        return createAuthResponse(user, token);
    }

    private AuthResponse createAuthResponse(User user, String token) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhoneNumber(user.getPhoneNumber());
        // Add user object for frontend compatibility
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .build();
        response.setUser(userResponse);
        return response;
    }
}
