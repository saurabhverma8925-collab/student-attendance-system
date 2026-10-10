package com.sas.model;

import java.time.LocalDateTime;

/**
 * Tracks a single failed authentication attempt for rate-limiting / reporting.
 */
public class FailedLoginAttempt {

    private Long id;
    private String username;
    private String role;
    private String ip;
    private String userAgent;
    private LocalDateTime createdAt;

    public FailedLoginAttempt() {
    }

    public FailedLoginAttempt(String username, String role, String ip, String userAgent) {
        this.username = username;
        this.role = role;
        this.ip = ip;
        this.userAgent = userAgent;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
