package com.sas.model;

import java.time.LocalDateTime;

/**
 * Student user - attends classes, scans QR codes, views attendance reports.
 */
public class Student extends User {

    private String rollNo;          // e.g. CSE21001
    private String branch;          // CSE / ECE
    private String section;         // A / B
    private int semester;
    private String email;
    private String phone;
    private String deviceFingerprint;
    private boolean hasSeenOnboarding;
    private LocalDateTime deviceRegisteredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Student() {
        super();
    }

    @Override
    public String getRole() {
        return "student";
    }

    @Override
    public String getDashboardPath() {
        return "/jsp/student/dashboard.jsp";
    }

    /**
     * Students log in using their roll number as the username.
     * We expose it through setUsername as well to keep the User contract intact.
     */
    @Override
    public void setUsername(String username) {
        super.setUsername(username);
        this.rollNo = username;
    }

    public String getRollNo() {
        return rollNo;
    }

    public void setRollNo(String rollNo) {
        this.rollNo = rollNo;
        super.setUsername(rollNo);
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public int getSemester() {
        return semester;
    }

    public void setSemester(int semester) {
        this.semester = semester;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDeviceFingerprint() {
        return deviceFingerprint;
    }

    public void setDeviceFingerprint(String deviceFingerprint) {
        this.deviceFingerprint = deviceFingerprint;
    }

    public boolean isHasSeenOnboarding() {
        return hasSeenOnboarding;
    }

    public void setHasSeenOnboarding(boolean hasSeenOnboarding) {
        this.hasSeenOnboarding = hasSeenOnboarding;
    }

    public LocalDateTime getDeviceRegisteredAt() {
        return deviceRegisteredAt;
    }

    public void setDeviceRegisteredAt(LocalDateTime deviceRegisteredAt) {
        this.deviceRegisteredAt = deviceRegisteredAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
