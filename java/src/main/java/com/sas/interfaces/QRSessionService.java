package com.sas.interfaces;

import com.sas.model.QRScan;
import com.sas.model.QRSession;

import java.util.List;

public interface QRSessionService {

    QRSession generate(long subjectId, String createdBy, int ttlMinutes);

    List<QRSession> active();

    /**
     * Verify a student's scan of a QR session and mark them present.
     * Thread-safe: concurrent scans by the same student are serialised by a
     * {@code synchronized} block so the unique constraint is honoured even
     * under a duplicate-submit race.
     */
    QRScan verifyAndMark(String token, long studentId, boolean faceVerified,
                         String capturedPhotoHash, String adminActor);
}
