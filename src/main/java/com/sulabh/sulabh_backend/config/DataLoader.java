package com.sulabh.sulabh_backend.config;

import com.sulabh.sulabh_backend.entity.User;
import com.sulabh.sulabh_backend.repository.UserRepository;
import com.sulabh.sulabh_backend.service.AccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountService accountService;

    @EventListener(ApplicationReadyEvent.class)
    public void loadInitialData() {
        if (userRepository.count() == 0) {
            log.info("Creating default users...");
            
            // Create admin user
            User admin = User.builder()
                    .email("admin@sulabh.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("SULABH Administrator")
                    .phoneNumber("+91-9876543210")
                    .enabled(true)
                    .build();
            admin = userRepository.save(admin);
            
            // Create demo user
            User demoUser = User.builder()
                    .email("user@sulabh.com")
                    .password(passwordEncoder.encode("user123"))
                    .fullName("Demo User")
                    .phoneNumber("+91-9876543211")
                    .enabled(true)
                    .build();
            demoUser = userRepository.save(demoUser);
            
            // Create accounts for users
            try {
                accountService.createAccountForUser(admin);
                accountService.createAccountForUser(demoUser);
                log.info("Default users and accounts created successfully");
            } catch (Exception e) {
                log.error("Error creating accounts for default users", e);
            }
        }
    }
}