package com.sas.interfaces;

import com.sas.model.User;

/**
 * User authentication + lookup contract. Admins and Students both implement
 * {@link User}, so callers can hold the polymorphic {@code User} reference.
 */
public interface UserDAO {

    /** Locate a user by username within a role ("admin"/"student"). */
    User findByUsernameAndRole(String username, String role);
}
