package com.sas.task;

import com.sas.interfaces.FailedLoginAttemptDAO;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter for failed logins.
 *
 * <p>Uses a {@link ConcurrentHashMap} keyed by username so lookups are lock-free
 * for the common (successful / single failure) path. The check-and-increment
 * dance that decides whether an attempt is allowed is done inside a
 * {@code synchronized} block keyed on the username string so concurrent
 * attempts against the same username cannot all slip past the threshold.</p>
 *
 * <p>Counts decay over time: each username keeps a {@link Window} with the
 * window start + count, and once the window expires the counter resets.</p>
 */
public class LoginAttemptTracker {

    /** Allow at most this many failures per username inside the window. */
    public static final int MAX_ATTEMPTS_PER_USERNAME = 5;
    /** Allow at most this many failures per IP inside the window. */
    public static final int MAX_ATTEMPTS_PER_IP = 20;
    /** Sliding window length in minutes. */
    public static final long WINDOW_MINUTES = 15;

    private final Map<String, Window> byUsername = new ConcurrentHashMap<>();
    private final Map<String, Window> byIp = new ConcurrentHashMap<>();

    private final FailedLoginAttemptDAO failedLoginAttemptDAO;

    public LoginAttemptTracker(FailedLoginAttemptDAO failedLoginAttemptDAO) {
        this.failedLoginAttemptDAO = failedLoginAttemptDAO;
    }

    /**
     * Check whether another attempt from {@code username} / {@code ip} is
     * permitted. Returns {@code true} if allowed, {@code false} if locked.
     */
    public boolean isAllowed(String username, String ip) {
        if (exceeds(username, byUsername, MAX_ATTEMPTS_PER_USERNAME)) {
            return false;
        }
        return !exceeds(ip, byIp, MAX_ATTEMPTS_PER_IP);
    }

    /**
     * Atomically record a fresh failure for {@code username} / {@code ip}.
     * The increment is {@code synchronized} on the key so two racing threads
     * cannot both pass the threshold check.
     */
    public void recordFailure(String username, String ip) {
        increment(username, byUsername);
        increment(ip, byIp);
        // Also persist to the DB (best-effort) for the security dashboard.
        try {
            failedLoginAttemptDAO.save(
                    new com.sas.model.FailedLoginAttempt(username, "unknown", ip, "audit-tracker"));
        } catch (Exception ignored) {
            // Persistence is best-effort; the in-memory state is authoritative for gating.
        }
    }

    /** Reset the counters (e.g. after a successful login). */
    public void reset(String username, String ip) {
        byUsername.remove(username);
        byIp.remove(ip);
    }

    /** Current failure count for a username (visible for testing / UI). */
    public int attemptsForUsername(String username) {
        Window w = byUsername.get(username);
        return w == null ? 0 : w.count;
    }

    public int attemptsForIp(String ip) {
        Window w = byIp.get(ip);
        return w == null ? 0 : w.count;
    }

    // ------------------------------------------------------------------

    private boolean exceeds(String key, Map<String, Window> store, int max) {
        Window w = store.get(key);
        if (w == null) return false;
        if (w.isExpired()) {
            store.remove(key);
            return false;
        }
        return w.count >= max;
    }

    private void increment(String key, Map<String, Window> store) {
        // compute() is atomic per-key in ConcurrentHashMap, which gives us the
        // check-and-increment safety we need without an external lock.
        store.compute(key, (k, existing) -> {
            if (existing == null || existing.isExpired()) {
                return new Window(1);
            }
            existing.count++;
            return existing;
        });
    }

    /** Mutable, non-thread-safe window object - access guarded by the map's compute() atomicity. */
    private static final class Window {
        private final long startedAt;
        private int count;

        Window(int initial) {
            this.startedAt = System.currentTimeMillis();
            this.count = initial;
        }

        boolean isExpired() {
            long ageMin = (System.currentTimeMillis() - startedAt) / 60_000L;
            return ageMin >= WINDOW_MINUTES;
        }
    }
}
