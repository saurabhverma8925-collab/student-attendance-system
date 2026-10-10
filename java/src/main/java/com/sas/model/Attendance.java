package com.sas.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A single attendance record for a (student, subject, date) triple.
 */
public class Attendance {

    public static final String STATUS_PRESENT = "present";
    public static final String STATUS_ABSENT  = "absent";
    public static final String STATUS_LATE   = "late";

    public static final String VIA_MANUAL = "manual";
    public static final String VIA_QR     = "qr";

    private Long id;
    private Long studentId;
    private Long subjectId;
    private LocalDate date;
    private String status;
    private String markedBy;
    private String markedVia;
    private LocalDateTime createdAt;

    public Attendance() {
    }

    public Attendance(Long studentId, Long subjectId, LocalDate date, String status, String markedBy, String markedVia) {
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.date = date;
        this.status = status;
        this.markedBy = markedBy;
        this.markedVia = markedVia;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMarkedBy() {
        return markedBy;
    }

    public void setMarkedBy(String markedBy) {
        this.markedBy = markedBy;
    }

    public String getMarkedVia() {
        return markedVia;
    }

    public void setMarkedVia(String markedVia) {
        this.markedVia = markedVia;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
