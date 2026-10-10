package com.sas.service;

import com.sas.dao.AdminDAOImpl;
import com.sas.dao.StudentDAOImpl;
import com.sas.exception.AuthenticationException;
import com.sas.interfaces.AuthenticationService;
import com.sas.interfaces.UserDAO;
import com.sas.model.Admin;
import com.sas.model.AuditLog;
import com.sas.model.Student;
import com.sas.model.User;
import com.sas.task.AuditLogger;
import com.sas.task.LoginAttemptTracker;
import com.sas.util.PasswordUtil;

/**
 * Authentication service - the single chokepoint that knows both
 * {@link Admin} and {@link Student} identities.
 *
 * <p>Flow:</p>
 * <ol>
 *   <li>Rate-limit check via {@link LoginAttemptTracker}.</li>
 *   <li>DAO lookup by {@code (username, role)}.</li>
 *   <li>BCrypt verify via {@link PasswordUtil#verify(String, String)}.</li>
 *   <li>On success: reset tracker + audit LOGIN_SUCCESS, return polymorphic
 *       {@link User}.</li>
 *   <li>On failure: record the failure + audit LOGIN_FAILED, throw
 *       {@link AuthenticationException}.</li>
 * </ol>
 */
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserDAO userDao;
    private final StudentDAOImpl studentDao;
    private final LoginAttemptTracker tracker;
    private final AuditLogger auditLogger;

    public AuthenticationServiceImpl(UserDAO userDao, StudentDAOImpl studentDao,
                                     LoginAttemptTracker tracker, AuditLogger auditLogger) {
        this.userDao = userDao;
        this.studentDao = studentDao;
        this.tracker = tracker;
        this.auditLogger = auditLogger;
    }

    @Override
    public User login(String username, String password, String role, String ip, String userAgent) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new AuthenticationException("Username and password are required");
        }

        // --- Rate-limit -----------------------------------------------------
        if (!tracker.isAllowed(username, ip)) {
            auditLogger.log(new AuditLog(username, role, AuditLog.ACTION_LOGIN_FAILED,
                    null, ip, userAgent, "rate-limited"));
            throw new AuthenticationException(
                    "Too many failed attempts. Try again in a few minutes.");
        }

        // --- Lookup ---------------------------------------------------------
        User user;
        if ("admin".equalsIgnoreCase(role)) {
            user = userDao.findByUsernameAndRole(username, "admin");
        } else if ("student".equalsIgnoreCase(role)) {
            user = studentDao.findByStudentId(username.toUpperCase());
        } else {
            throw new AuthenticationException("Unknown role: " + role);
        }

        if (user == null) {
            tracker.recordFailure(username, ip);
            auditLogger.log(new AuditLog(username, role, AuditLog.ACTION_LOGIN_FAILED,
                    null, ip, userAgent, "no such user"));
            throw new AuthenticationException("Invalid username or password");
        }

        // --- BCrypt verify --------------------------------------------------
        if (!PasswordUtil.verify(password, user.getPasswordHash())) {
            tracker.recordFailure(username, ip);
            auditLogger.log(new AuditLog(username, role, AuditLog.ACTION_LOGIN_FAILED,
                    null, ip, userAgent, "bad password"));
            throw new AuthenticationException("Invalid username or password");
        }

        // --- Success --------------------------------------------------------
        tracker.reset(username, ip);
        auditLogger.log(new AuditLog(
                String.valueOf(user.getId()), user.getRole(),
                AuditLog.ACTION_LOGIN_SUCCESS, null, ip, userAgent, "login ok"));
        return user;
    }

    @Override
    public void onSuccessfulLogin(String username, String ip) {
        tracker.reset(username, ip);
    }
}
