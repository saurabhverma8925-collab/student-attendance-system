package com.sas.interfaces;

import com.sas.model.User;

/**
 * Authentication contract - the only entry point that knows about both
 * admin and student identities. Returns the polymorphic {@link User} so the
 * caller can dispatch on {@link User#getDashboardPath()} without an
 * instanceof cascade.
 */
public interface AuthenticationService {

    /**
     * Authenticate {@code username} / {@code password} for the given role.
     *
     * @param role "admin" or "student"
     * @return the authenticated user, never null
     * @throws com.sas.exception.AuthenticationException on bad credentials or lockout
     */
    User login(String username, String password, String role, String ip, String userAgent);

    /** Release rate-limit counters for {@code username} / {@code ip}. */
    void onSuccessfulLogin(String username, String ip);
}
