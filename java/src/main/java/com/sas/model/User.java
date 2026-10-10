package com.sas.model;

/**
 * Abstract base type for all application users (Admin, Student).
 *
 * Demonstrates:
 *   - Abstraction: defines the common contract for any user of the system.
 *   - Inheritance: concrete subtypes extend this class and provide role /
 *     navigation specific behaviour through polymorphic methods.
 */
public abstract class User {

    private Long id;
    private String username;
    private String name;
    private String passwordHash;

    protected User() {
        // Required for frameworks / DAO reconstruction.
    }

    protected User(Long id, String username, String name, String passwordHash) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.passwordHash = passwordHash;
    }

    /** Polymorphic role identifier used by filters and services ("admin"/"student"). */
    public abstract String getRole();

    /** Dashboard JSP path dispatched to after login - resolved polymorphically. */
    public abstract String getDashboardPath();

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
}
