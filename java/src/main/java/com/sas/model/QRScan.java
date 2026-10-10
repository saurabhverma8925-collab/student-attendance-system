package com.sas.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A student's scan of a QR session, optionally validated by face capture.
 */
public class QRScan {

    private Long id;
    private Long qrSessionId;
    private Long studentId;
    private Long subjectId;
    private LocalDate date;
    private boolean faceVerified;
    private String capturedPhotoHash;
    private LocalDateTime createdAt;

    public QRScan() {
    }

    public QRScan(Long qrSessionId, Long studentId, Long subjectId, LocalDate date, boolean faceVerified, String capturedPhotoHash) {
        this.qrSessionId = qrSessionId;
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.date = date;
        this.faceVerified = faceVerified;
        this.capturedPhotoHash = capturedPhotoHash;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getQrSessionId() {
        return qrSessionId;
    }

    public void setQrSessionId(Long qrSessionId) {
        this.qrSessionId = qrSessionId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
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

    public boolean isFaceVerified() {
        return faceVerified;
    }

    public void setFaceVerified(boolean faceVerified) {
        this.faceVerified = faceVerified;
    }

    public String getCapturedPhotoHash() {
        return capturedPhotoHash;
    }

    public void setCapturedPhotoHash(String capturedPhotoHash) {
        this.capturedPhotoHash = capturedPhotoHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
