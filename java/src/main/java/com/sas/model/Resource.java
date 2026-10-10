package com.sas.model;

import java.time.LocalDateTime;

/**
 * Study material associated with a subject.
 */
public class Resource {

    public static final String TYPE_NOTES  = "notes";
    public static final String TYPE_PDF    = "pdf";
    public static final String TYPE_VIDEO  = "video";
    public static final String TYPE_SLIDES  = "slides";

    private Long id;
    private Long subjectId;
    private String title;
    private String type;
    private String url;
    private String description;
    private boolean free;
    private LocalDateTime createdAt;

    public Resource() {
    }

    public Resource(Long subjectId, String title, String type, String url, String description, boolean free) {
        this.subjectId = subjectId;
        this.title = title;
        this.type = type;
        this.url = url;
        this.description = description;
        this.free = free;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(Long subjectId) {
        this.subjectId = subjectId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isFree() {
        return free;
    }

    public void setFree(boolean free) {
        this.free = free;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
