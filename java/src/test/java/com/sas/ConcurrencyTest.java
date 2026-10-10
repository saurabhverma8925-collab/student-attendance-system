package com.sas;

import com.sas.dao.FailedLoginAttemptDAOImpl;
import com.sas.interfaces.FailedLoginAttemptDAO;
import com.sas.model.FailedLoginAttempt;
import com.sas.task.LoginAttemptTracker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Concurrency test for {@link LoginAttemptTracker}.
 *
 * <p>Spawns N threads that all call {@code recordFailure("alice", ip)} at the same
 * instant. The tracker's {@code synchronized}/compute-based check-and-increment
 * must keep the per-username count exactly equal to N - never more, never less.
 * Without the synchronisation the counter would lose updates (typical
 * read-modify-write race).</p>
 */
class ConcurrencyTest {

    private static final String USERNAME = "alice";
    private static final String IP = "10.0.0.1";
    private static final int THREADS = 50;

    private LoginAttemptTracker tracker;
    private StubDao dao;

    @BeforeEach
    void setUp() {
        dao = new StubDao();
        tracker = new LoginAttemptTracker(dao);
    }

    @Test
    void recordFailure_concurrentCalls_atomicallyCounts() throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(THREADS);
        ExecutorService pool = Executors.newFixedThreadPool(THREADS);

        for (int i = 0; i < THREADS; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    tracker.recordFailure(USERNAME, IP);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }

        start.countDown();              // release all threads simultaneously
        assertTrue(done.await(10, TimeUnit.SECONDS), "All workers should finish");
        pool.shutdown();

        // The per-username counter must be exactly THREADS - no lost updates.
        assertEquals(THREADS, tracker.attemptsForUsername(USERNAME),
                "LoginAttemptTracker must not lose concurrent increments");
        assertEquals(THREADS, tracker.attemptsForIp(IP));

        // After threshold attempts, the next attempt must be rejected.
        assertFalse(tracker.isAllowed(USERNAME, IP),
                "After MAX attempts the username should be locked");
    }

    @Test
    void isAllowed_resetsAfterSuccess() {
        tracker.recordFailure(USERNAME, IP);
        tracker.recordFailure(USERNAME, IP);
        tracker.reset(USERNAME, IP);
        assertTrue(tracker.isAllowed(USERNAME, IP));
        assertEquals(0, tracker.attemptsForUsername(USERNAME));
    }

    @Test
    void recordFailure_persistsBestEffort() {
        tracker.recordFailure(USERNAME, IP);
        assertEquals(1, dao.saved.get(), "Each failure should be persisted");
    }

    /** Stub DAO that counts saves without touching a real database. */
    static final class StubDao implements FailedLoginAttemptDAO {
        final AtomicInteger saved = new AtomicInteger();

        @Override public FailedLoginAttempt save(FailedLoginAttempt f) { saved.incrementAndGet(); return f; }
        @Override public FailedLoginAttempt findById(Long id) { return null; }
        @Override public List<FailedLoginAttempt> findAll() { return new ArrayList<>(); }
        @Override public long countByUsernameSince(String u, LocalDateTime s) { return 0; }
        @Override public long countByIpSince(String ip, LocalDateTime s) { return 0; }
        @Override public List<FailedLoginAttempt> findRecent(int limit) { return new ArrayList<>(); }
        @Override public int purgeOlderThan(LocalDateTime c) { return 0; }
        @Override public FailedLoginAttempt update(FailedLoginAttempt f) { throw new UnsupportedOperationException(); }
        @Override public boolean delete(Long id) { throw new UnsupportedOperationException(); }
    }
}
