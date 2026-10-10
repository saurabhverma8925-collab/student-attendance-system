package com.sas.service;

import com.sas.dao.AuditLogDAOImpl;
import com.sas.dao.AdminDAOImpl;
import com.sas.dao.FailedLoginAttemptDAOImpl;
import com.sas.interfaces.SecurityService;
import com.sas.model.AuditLog;
import com.sas.model.FailedLoginAttempt;
import com.sas.task.AuditLogger;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Security service - audit logging (async) + read-only aggregation for the
 * security overview page.
 */
public class SecurityServiceImpl implements SecurityService {

    private final AuditLogger auditLogger;
    private final AuditLogDAOImpl auditDao;
    private final FailedLoginAttemptDAOImpl failedDao;
    private final AdminDAOImpl adminDao;

    public SecurityServiceImpl(AuditLogger auditLogger, AuditLogDAOImpl auditDao,
                               FailedLoginAttemptDAOImpl failedDao, AdminDAOImpl adminDao) {
        this.auditLogger = auditLogger;
        this.auditDao = auditDao;
        this.failedDao = failedDao;
        this.adminDao = adminDao;
    }

    @Override
    public void audit(String actorId, String actorRole, String action,
                      String target, String ip, String userAgent, String details) {
        auditLogger.log(new AuditLog(actorId, actorRole, action, target, ip, userAgent, details));
    }

    @Override
    public List<AuditLog> recentAudits(int limit) {
        return auditDao.findRecent(limit);
    }

    @Override
    public List<FailedLoginAttempt> recentFailures(int limit) {
        return failedDao.findRecent(limit);
    }

    @Override
    public Map<String, Object> overview() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("adminCount", adminDao.count());
        out.put("loginSuccesses", auditDao.countByAction(AuditLog.ACTION_LOGIN_SUCCESS));
        out.put("loginFailures", auditDao.countByAction(AuditLog.ACTION_LOGIN_FAILED));
        out.put("qrScans", auditDao.countByAction(AuditLog.ACTION_QR_SCAN));
        out.put("deviceBindings", auditDao.countByAction(AuditLog.ACTION_DEVICE_BIND));
        out.put("recentAudits", auditDao.findRecent(20));
        out.put("recentFailures", failedDao.findRecent(20));
        return out;
    }
}
