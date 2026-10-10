package com.sas.task;

import com.sas.dao.AuditLogDAOImpl;
import com.sas.interfaces.AuditLogDAO;
import com.sas.model.AuditLog;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * Asynchronous audit-log writer.
 *
 * <p>Audit records are produced on the request thread but persisted on a
 * background thread so the user's flow is never blocked by an INSERT into
 * {@code audit_logs}. The executor is a single-thread pool with a bounded
 * queue - if the queue saturates we drop the record rather than stalling the
 * request thread (audit is best-effort, never a hard dependency).</p>
 */
public final class AuditLogger {

    private static final int QUEUE_CAPACITY = 500;

    private static AuditLogger INSTANCE;

    private final AuditLogDAO dao;
    private final ExecutorService executor;

    private AuditLogger() {
        this.dao = new AuditLogDAOImpl();
        // Single consumer thread + bounded queue + caller-runs is replaced by
        // discard so a flood of audit events never blocks request threads.
        this.executor = new ThreadPoolExecutor(
                1, 1,
                0L, TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<>(QUEUE_CAPACITY),
                Executors.defaultThreadFactory(),
                new ThreadPoolExecutor.DiscardPolicy());
    }

    /** Singleton accessor - initialised lazily on first use. */
    public static synchronized AuditLogger getInstance() {
        if (INSTANCE == null) {
            INSTANCE = new AuditLogger();
        }
        return INSTANCE;
    }

    /**
     * Fire-and-forget audit write. Never throws - any persistence failure is
     * logged to stderr and swallowed.
     */
    public void log(AuditLog entry) {
        executor.submit(() -> {
            try {
                dao.save(entry);
            } catch (Exception e) {
                System.err.println("[AuditLogger] dropped audit entry: " + e.getMessage());
            }
        });
    }

    /** Drain the queue and shut down - called from {@link ApplicationBootstrap}. */
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
