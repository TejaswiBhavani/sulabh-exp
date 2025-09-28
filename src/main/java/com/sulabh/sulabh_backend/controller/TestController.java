package com.sulabh.sulabh_backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
public class TestController {

    @GetMapping("/health")
    public String healthCheck() {
        return "Application is running!";
    }
}
