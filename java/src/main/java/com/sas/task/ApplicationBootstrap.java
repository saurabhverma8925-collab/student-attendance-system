package com.sas.task;

import com.sas.dao.AdminDAOImpl;
import com.sas.dao.AuditLogDAOImpl;
import com.sas.dao.FailedLoginAttemptDAOImpl;
import com.sas.dao.QRSessionDAOImpl;
import com.sas.interfaces.UserDAO;
import com.sas.interfaces.AuditLogDAO;
import com.sas.interfaces.FailedLoginAttemptDAO;
import com.sas.interfaces.QRSessionDAO;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Application lifecycle hook.
 *
 * <p>Starts the audit-log writer, the login-attempt tracker and the QR
 * session cleaner on application startup, and shuts them all down again on
 * application shutdown - so no background thread is ever leaked across a
 * redeploy.</p>
 */
@WebListener
public class ApplicationBootstrap implements ServletContextListener {

    public static final String CTX_AUDIT_LOGGER   = "sas.auditLogger";
    public static final String CTX_LOGIN_TRACKER  = "sas.loginTracker";
    public static final String CTX_QR_CLEANER     = "sas.qrCleaner";
    public static final String CTX_USER_DAO       = "sas.userDao";
    public static final String CTX_AUDIT_DAO      = "sas.auditDao";
    public static final String CTX_FAILED_LOGIN   = "sas.failedLoginDao";
    public static final String CTX_QR_SESSION_DAO = "sas.qrSessionDao";

    private QRSessionCleanerTask cleaner;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        System.out.println("[Bootstrap] SAS starting up...");

        // --- DAO singletons shared with services / servlets ---
        UserDAO userDao = new AdminDAOImpl();
        AuditLogDAO auditDao = new AuditLogDAOImpl();
        FailedLoginAttemptDAO failedLoginDao = new FailedLoginAttemptDAOImpl();
        QRSessionDAO qrSessionDAO = new QRSessionDAOImpl();

        sce.getServletContext().setAttribute(CTX_USER_DAO, userDao);
        sce.getServletContext().setAttribute(CTX_AUDIT_DAO, auditDao);
        sce.getServletContext().setAttribute(CTX_FAILED_LOGIN, failedLoginDao);
        sce.getServletContext().setAttribute(CTX_QR_SESSION_DAO, qrSessionDAO);

        // --- Background executors ---
        AuditLogger auditLogger = AuditLogger.getInstance();
        LoginAttemptTracker tracker = new LoginAttemptTracker(failedLoginDao);
        cleaner = new QRSessionCleanerTask(qrSessionDAO, failedLoginDao,
                Executors.newSingleThreadScheduledExecutor(r -> {
                    Thread t = new Thread(r, "sas-cleaner");
                    t.setDaemon(true);
                    return t;
                }));
        cleaner.start();

        sce.getServletContext().setAttribute(CTX_AUDIT_LOGGER, auditLogger);
        sce.getServletContext().setAttribute(CTX_LOGIN_TRACKER, tracker);
        sce.getServletContext().setAttribute(CTX_QR_CLEANER, cleaner);

        System.out.println("[Bootstrap] SAS ready - DAOs and background tasks started");
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        System.out.println("[Bootstrap] SAS shutting down...");
        try {
            if (cleaner != null) {
                cleaner.shutdown();
            }
            AuditLogger.getInstance().shutdown();
        } catch (Exception e) {
            System.err.println("[Bootstrap] shutdown error: " + e.getMessage());
        }
    }
}
