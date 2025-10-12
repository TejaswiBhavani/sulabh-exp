package com.sulabh.sulabh_backend.dto;

import lombok.Data;

@Data
public class SessionRequest {
    private boolean rememberMe = false;
}