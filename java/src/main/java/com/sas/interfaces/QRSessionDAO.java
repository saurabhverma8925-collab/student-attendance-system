package com.sas.interfaces;

import com.sas.model.QRSession;

import java.util.List;

/**
 * QR attendance session persistence contract.
 */
public interface QRSessionDAO extends GenericDAO<QRSession, Long> {

    QRSession findByToken(String token);

    /** Currently active sessions for the daily grid. */
    List<QRSession> findActive();

    /** Deactivate every expired-but-still-active session. Returns affected count. */
    int deactivateExpired();
}
