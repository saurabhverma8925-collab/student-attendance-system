package com.sas.exception;

/**
 * Root exception for the SAS application - every other domain exception extends it.
 */
public class DatabaseException extends RuntimeException {

    public DatabaseException(String message) {
        super(message);
    }

    public DatabaseException(String message, Throwable cause) {
        super(message, cause);
    }
}
