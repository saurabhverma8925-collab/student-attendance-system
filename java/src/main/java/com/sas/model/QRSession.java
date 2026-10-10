package com.sas.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A live QR attendance session created by an admin for a subject on a given date.
 */
public class QRSession {

    private Long id;
    private String token;
    private Long subjectId;
    private LocalDate date;
    private String createdBy;
    private LocalDateTime expiresAt;
    private boolean active;
    private LocalDateTime createdAt;

    public QRSession() {
    }

    public QRSession(String token, Long subjectId, LocalDate date, String createdBy, LocalDateTime expiresAt) {
        this.token = token;
        this.subjectId = subjectId;
        this.date = date;
        this.createdBy = createdBy;
        this.expiresAt = expiresAt;
        this.active = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
