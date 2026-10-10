package com.sas.exception;

/**
 * Raised when a save/insert would violate a unique constraint
 * (e.g. duplicate student id or subject code).
 */
public class DuplicateRecordException extends RuntimeException {

    public DuplicateRecordException(String message) {
        super(message);
    }
}
