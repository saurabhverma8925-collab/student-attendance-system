package com.sas.interfaces;

import com.sas.model.AuditLog;

import java.util.List;

/**
 * Audit log persistence contract.
 */
public interface AuditLogDAO extends GenericDAO<AuditLog, Long> {

    List<AuditLog> findRecent(int limit);

    long countByAction(String action);
}
