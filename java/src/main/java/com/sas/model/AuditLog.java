package com.sas.model;

import java.time.LocalDateTime;

/**
 * Append-only security / audit event record.
 */
public class AuditLog {

    public static final String ACTION_LOGIN_SUCCESS   = "LOGIN_SUCCESS";
    public static final String ACTION_LOGIN_FAILED    = "LOGIN_FAILED";
    public static final String ACTION_LOGOUT          = "LOGOUT";
    public static final String ACTION_STUDENT_CREATE  = "STUDENT_CREATE";
    public static final String ACTION_STUDENT_UPDATE  = "STUDENT_UPDATE";
    public static final String ACTION_STUDENT_DELETE  = "STUDENT_DELETE";
    public static final String ACTION_QR_GENERATE     = "QR_GENERATE";
    public static final String ACTION_QR_SCAN         = "QR_SCAN";
    public static final String ACTION_DEVICE_BIND    = "DEVICE_BIND";
    public static final String ACTION_DEVICE_UNBIND   = "DEVICE_UNBIND";
    public static final String ACTION_ATTENDANCE_MARK = "ATTENDANCE_MARK";

    private Long id;
    private String actorId;
    private String actorRole;
    private String action;
    private String target;
    private String ip;
    private String userAgent;
    private String details;
    private LocalDateTime createdAt;

    public AuditLog() {
    }

    public AuditLog(String actorId, String actorRole, String action, String target, String ip, String userAgent, String details) {
        this.actorId = actorId;
        this.actorRole = actorRole;
        this.action = action;
        this.target = target;
        this.ip = ip;
        this.userAgent = userAgent;
        this.details = details;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getActorId() {
        return actorId;
    }

    public void setActorId(String actorId) {
        this.actorId = actorId;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
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

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
