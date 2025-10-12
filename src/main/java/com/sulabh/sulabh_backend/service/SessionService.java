package com.sulabh.sulabh_backend.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class SessionService {
    
    // In-memory session store for tracking active sessions
    private final ConcurrentHashMap<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();
    
    public static class SessionInfo {
        private final String userId;
        private final Date createdAt;
        private Date lastActivity;
        private final boolean rememberMe;
        private final long maxInactiveInterval;
        private final long absoluteTimeout;
        
        public SessionInfo(String userId, boolean rememberMe) {
            this.userId = userId;
            this.createdAt = new Date();
            this.lastActivity = new Date();
            this.rememberMe = rememberMe;
            this.maxInactiveInterval = rememberMe ? 7 * 24 * 60 * 60 * 1000L : 15 * 60 * 1000L; // 7 days or 15 minutes
            this.absoluteTimeout = 24 * 60 * 60 * 1000L; // 24 hours absolute maximum
        }
        
        public boolean isExpired() {
            long now = System.currentTimeMillis();
            long inactiveTime = now - lastActivity.getTime();
            long totalTime = now - createdAt.getTime();
            
            return inactiveTime > maxInactiveInterval || (!rememberMe && totalTime > absoluteTimeout);
        }
        
        public void updateActivity() {
            this.lastActivity = new Date();
        }
        
        // Getters
        public String getUserId() { return userId; }
        public Date getCreatedAt() { return createdAt; }
        public Date getLastActivity() { return lastActivity; }
        public boolean isRememberMe() { return rememberMe; }
        public long getMaxInactiveInterval() { return maxInactiveInterval; }
        public long getAbsoluteTimeout() { return absoluteTimeout; }
    }
    
    public void createSession(HttpServletRequest request, HttpServletResponse response, String userId, boolean rememberMe) {
        HttpSession session = request.getSession(true);
        
        // Configure session timeout based on rememberMe
        if (rememberMe) {
            session.setMaxInactiveInterval(7 * 24 * 60 * 60); // 7 days in seconds
        } else {
            session.setMaxInactiveInterval(15 * 60); // 15 minutes in seconds
        }
        
        // Store session info
        SessionInfo sessionInfo = new SessionInfo(userId, rememberMe);
        activeSessions.put(session.getId(), sessionInfo);
        
        // Set user info in session
        session.setAttribute("userId", userId);
        session.setAttribute("rememberMe", rememberMe);
        session.setAttribute("createdAt", sessionInfo.getCreatedAt());
    }
    
    public boolean isValidSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return false;
        }
        
        SessionInfo sessionInfo = activeSessions.get(session.getId());
        if (sessionInfo == null || sessionInfo.isExpired()) {
            invalidateSession(request);
            return false;
        }
        
        // Update activity timestamp
        sessionInfo.updateActivity();
        return true;
    }
    
    public void updateSessionActivity(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            SessionInfo sessionInfo = activeSessions.get(session.getId());
            if (sessionInfo != null) {
                sessionInfo.updateActivity();
            }
        }
    }
    
    public void invalidateSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            activeSessions.remove(session.getId());
            session.invalidate();
        }
    }
    
    public SessionInfo getSessionInfo(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            return activeSessions.get(session.getId());
        }
        return null;
    }
    
    public String getUserIdFromSession(HttpServletRequest request) {
        SessionInfo sessionInfo = getSessionInfo(request);
        return sessionInfo != null ? sessionInfo.getUserId() : null;
    }
    
    // Cleanup expired sessions periodically
    public void cleanupExpiredSessions() {
        activeSessions.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }
}