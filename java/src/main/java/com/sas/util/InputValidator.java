package com.sas.util;

import com.sas.exception.ValidationException;

import java.util.regex.Pattern;

/**
 * Centralised, side-effect-free input validation helpers.
 *
 * <p>Every method either returns the sanitised value or throws
 * {@link ValidationException} with a human-readable message that the UI can
 * surface directly.</p>
 */
public final class InputValidator {

    private static final Pattern EMAIL =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final Pattern PHONE =
            Pattern.compile("^\\+?[0-9][0-9\\- ]{6,19}$");

    private static final Pattern STUDENT_ID =
            Pattern.compile("^[A-Z]{2,4}[0-9]{5,6}$");

    private static final Pattern SAFE_TEXT =
            Pattern.compile("^[\\p{L}\\p{N}\\p{Zs}._'\\-,@/+()]+$");

    private InputValidator() {
    }

    /**
     * Strip HTML-significant characters and trim.
     */
    public static String sanitize(String raw) {
        if (raw == null) {
            return "";
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        if (!SAFE_TEXT.matcher(trimmed).matches() && trimmed.length() <= 200) {
            // Allow free-form long text (e.g. descriptions) - only enforce HTML escaping.
            return trimmed
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#39;");
        }
        return trimmed
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    public static String requireNonBlank(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException(fieldName + " is required");
        }
        return value.trim();
    }

    public static String validateEmail(String email) {
        String v = requireNonBlank(email, "Email");
        if (!EMAIL.matcher(v).matches()) {
            throw new ValidationException("Invalid email format: " + v);
        }
        return v;
    }

    public static String validatePhone(String phone) {
        String v = requireNonBlank(phone, "Phone");
        if (!PHONE.matcher(v).matches()) {
            throw new ValidationException("Invalid phone number: " + v);
        }
        return v;
    }

    public static String validateStudentId(String studentId) {
        String v = requireNonBlank(studentId, "Student ID");
        if (!STUDENT_ID.matcher(v).matches()) {
            throw new ValidationException(
                    "Student ID must look like CSE21001 (2-4 letters + 5-6 digits)");
        }
        return v.toUpperCase();
    }

    /**
     * Enforce a minimum password policy: 8+ chars, at least one letter and
     * one digit. Avoids leaking specifics to the caller's attacker.
     */
    public static String validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new ValidationException("Password must be at least 8 characters");
        }
        if (!password.matches(".*[A-Za-z].*") || !password.matches(".*[0-9].*")) {
            throw new ValidationException("Password must contain letters and numbers");
        }
        return password;
    }

    /** Validate that {@code value} parses to a positive long. */
    public static long requirePositiveLong(String value, String fieldName) {
        String v = requireNonBlank(value, fieldName);
        try {
            long parsed = Long.parseLong(v);
            if (parsed <= 0) {
                throw new ValidationException(fieldName + " must be positive");
            }
            return parsed;
        } catch (NumberFormatException e) {
            throw new ValidationException(fieldName + " must be a number");
        }
    }
}
