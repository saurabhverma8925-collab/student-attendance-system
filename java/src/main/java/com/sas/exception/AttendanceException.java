package com.sas.exception;

/**
 * Raised when an attendance operation cannot be performed
 * (e.g. duplicate mark, expired QR, out-of-range status).
 */
public class AttendanceException extends RuntimeException {

    public AttendanceException(String message) {
        super(message);
    }
}
