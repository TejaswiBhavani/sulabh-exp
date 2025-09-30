package com.sulabh.sulabh_backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class WebController {

    // Forward all unmatched routes to React Router
    @RequestMapping(value = {"/", "/login", "/signup", "/register", "/dashboard", "/transactions", "/settings", 
                           "/track", "/complaints", "/suggestions", "/forgot-password", "/reset-password"})
    public String forward() {
        return "forward:/index.html";
    }
    
    @RequestMapping(value = "/admin/**")
    public String forwardAdmin() {
        return "forward:/index.html";
    }
    
    @RequestMapping(value = "/user/**")
    public String forwardUser() {
        return "forward:/index.html";
    }
    
    @RequestMapping(value = "/auth/**")
    public String forwardAuth() {
        return "forward:/index.html";
    }
    
    @RequestMapping(value = "/complaint/**")
    public String forwardComplaint() {
        return "forward:/index.html";
    }
    
    @RequestMapping(value = "/suggestion/**")
    public String forwardSuggestion() {
        return "forward:/index.html";
    }
}