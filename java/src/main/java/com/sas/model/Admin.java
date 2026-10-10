package com.sas.model;

/**
 * Administrator user - manages students, subjects, attendance and security.
 */
public class Admin extends User {

    public Admin() {
        super();
    }

    public Admin(Long id, String username, String name, String passwordHash) {
        super(id, username, name, passwordHash);
    }

    @Override
    public String getRole() {
        return "admin";
    }

    @Override
    public String getDashboardPath() {
        return "/jsp/admin/dashboard.jsp";
    }
}
