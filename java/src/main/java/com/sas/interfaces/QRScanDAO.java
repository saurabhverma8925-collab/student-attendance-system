package com.sas.interfaces;

import com.sas.model.QRScan;

import java.util.List;

/**
 * QR scan persistence contract.
 */
public interface QRScanDAO extends GenericDAO<QRScan, Long> {

    /** Scans belonging to one session (used to show "who already scanned"). */
    List<QRScan> findBySession(long qrSessionId);

    /** Whether a student has already scanned a session (double-scan check). */
    boolean existsBySessionAndStudent(long qrSessionId, long studentId);
}
