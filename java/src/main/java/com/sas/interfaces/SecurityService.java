package com.sas.interfaces;

import com.sas.model.AuditLog;
import com.sas.model.FailedLoginAttempt;

import java.util.List;
import java.util.Map;

public interface SecurityService {

    /** Record an audit event asynchronously (fire-and-forget). */
    void audit(String actorId, String actorRole, String action,
               String target, String ip, String userAgent, String details);

    List<AuditLog> recentAudits(int limit);

    List<FailedLoginAttempt> recentFailures(int limit);

    /** Overview row for the security page. */
    Map<String, Object> overview();
}
