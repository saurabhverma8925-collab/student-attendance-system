package com.sas.exception;

/**
 * Raised for client-side input validation failures.
 */
public class ValidationException extends RuntimeException {

    public ValidationException(String message) {
        super(message);
    }
}
