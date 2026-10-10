package com.sas.model;

import java.time.LocalDateTime;

/**
 * A taught subject (e.g. CS301 - Data Structures).
 */
public class Subject {

    private Long id;
    private String code;
    private String name;
    private String branch;
    private int semester;
    private int totalClasses;
    private LocalDateTime createdAt;

    public Subject() {
    }

    public Subject(Long id, String code, String name, String branch, int semester, int totalClasses) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.branch = branch;
        this.semester = semester;
        this.totalClasses = totalClasses;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public int getSemester() {
        return semester;
    }

    public void setSemester(int semester) {
        this.semester = semester;
    }

    public int getTotalClasses() {
        return totalClasses;
    }

    public void setTotalClasses(int totalClasses) {
        this.totalClasses = totalClasses;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
