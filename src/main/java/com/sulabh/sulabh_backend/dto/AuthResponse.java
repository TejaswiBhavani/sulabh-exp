package com.sulabh.sulabh_backend.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String email;
    private String fullName;
    private String phoneNumber;
    private UserResponse user;
}
