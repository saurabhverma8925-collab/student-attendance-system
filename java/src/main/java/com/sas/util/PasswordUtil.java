package com.sas.util;

import org.mindrot.jbcrypt.BCrypt;

/**
 * Password hashing + verification using BCrypt.
 *
 * <p>Wraps {@link BCrypt} so callers do not depend on the third-party API
 * directly and so we can swap the implementation later.</p>
 */
public final class PasswordUtil {

    public static final int COST = 12;

    private PasswordUtil() {
    }

    /** Hash a plain password with cost {@value #COST}. */
    public static String hash(String plain) {
        if (plain == null || plain.isEmpty()) {
            throw new IllegalArgumentException("plain password must not be empty");
        }
        return BCrypt.hashpw(plain, BCrypt.gensalt(COST));
    }

    /** Verify a plain password against a previously computed BCrypt hash. */
    public static boolean verify(String plain, String hash) {
        if (plain == null || hash == null || hash.isEmpty()) {
            return false;
        }
        try {
            return BCrypt.checkpw(plain, hash);
        } catch (IllegalArgumentException ex) {
            // Hash was malformed - treat as a mismatch.
            return false;
        }
    }
}
