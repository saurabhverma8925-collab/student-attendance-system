package com.sas.exception;

/**
 * Raised when a requested resource cannot be located by its id.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
