package com.sas.task;

import com.sas.dao.FailedLoginAttemptDAOImpl;
import com.sas.dao.QRSessionDAOImpl;
import com.sas.interfaces.FailedLoginAttemptDAO;
import com.sas.interfaces.QRSessionDAO;

import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Background maintenance task.
 *
 * <p>Runs every minute on a single-thread {@link ScheduledExecutorService} to:</p>
 * <ol>
 *   <li>Deactivate QR sessions whose {@code expires_at} has passed - so they
 *       disappear from the student's active-session list.</li>
 *   <li>Purge failed-login rows older than 24 hours so the security table does
 *       not grow unbounded.</li>
 * </ol>
 */
public class QRSessionCleanerTask {

    private static final long INITIAL_DELAY_SECONDS = 30;
    private static final long PERIOD_SECONDS        = 60;
    private static final long FAILED_LOGIN_TTL_HOURS = 24;

    private final QRSessionDAO qrSessionDAO;
    private final FailedLoginAttemptDAO failedLoginAttemptDAO;
    private final ScheduledExecutorService scheduler;

    public QRSessionCleanerTask() {
        this(new QRSessionDAOImpl(), new FailedLoginAttemptDAOImpl(),
                Executors.newSingleThreadScheduledExecutor(r -> {
                    Thread t = new Thread(r, "sas-cleaner");
                    t.setDaemon(true);
                    return t;
                }));
    }

    // Test-friendly constructor.
    QRSessionCleanerTask(QRSessionDAO qrSessionDAO,
                         FailedLoginAttemptDAO failedLoginAttemptDAO,
                         ScheduledExecutorService scheduler) {
        this.qrSessionDAO = qrSessionDAO;
        this.failedLoginAttemptDAO = failedLoginAttemptDAO;
        this.scheduler = scheduler;
    }

    /** Schedule the recurring cleanup job. */
    public void start() {
        scheduler.scheduleAtFixedRate(this::runOnce,
                INITIAL_DELAY_SECONDS, PERIOD_SECONDS, TimeUnit.SECONDS);
    }

    /** One cleanup iteration - exposed package-private for unit testing. */
    void runOnce() {
        try {
            int deactivated = qrSessionDAO.deactivateExpired();
            if (deactivated > 0) {
                System.out.println("[Cleaner] deactivated " + deactivated + " expired QR sessions");
            }
        } catch (Exception e) {
            System.err.println("[Cleaner] QR cleanup failed: " + e.getMessage());
        }
        try {
            int purged = failedLoginAttemptDAO.purgeOlderThan(LocalDateTime.now().minusHours(FAILED_LOGIN_TTL_HOURS));
            if (purged > 0) {
                System.out.println("[Cleaner] purged " + purged + " old failed-login rows");
            }
        } catch (Exception e) {
            System.err.println("[Cleaner] failed-login purge failed: " + e.getMessage());
        }
    }

    public void shutdown() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(3, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
