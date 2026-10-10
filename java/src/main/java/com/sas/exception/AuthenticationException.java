package com.sas.exception;

/**
 * Raised when authentication fails (bad credentials, locked out, etc.).
 */
public class AuthenticationException extends RuntimeException {

    public AuthenticationException(String message) {
        super(message);
    }
}
