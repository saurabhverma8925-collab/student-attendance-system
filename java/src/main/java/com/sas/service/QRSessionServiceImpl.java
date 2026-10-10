package com.sas.service;

import com.sas.dao.AttendanceDAOImpl;
import com.sas.dao.QRScanDAOImpl;
import com.sas.dao.QRSessionDAOImpl;
import com.sas.dao.SubjectDAOImpl;
import com.sas.exception.AttendanceException;
import com.sas.exception.ResourceNotFoundException;
import com.sas.exception.ValidationException;
import com.sas.interfaces.QRSessionService;
import com.sas.model.Attendance;
import com.sas.model.AuditLog;
import com.sas.model.QRScan;
import com.sas.model.QRSession;
import com.sas.model.Subject;
import com.sas.task.AuditLogger;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

/**
 * QR session lifecycle service.
 *
 * <p>Generates a 32-byte cryptographic random token, persisted alongside the
 * subject + expiry. {@link #verifyAndMark(String, long, boolean, String, String)}
 * uses a {@code synchronized} block on the session token so two concurrent
 * scans by the same student cannot both pass the "already scanned?" check and
 * trip the unique constraint - the second is rejected with an
 * {@link AttendanceException} instead.</p>
 */
public class QRSessionServiceImpl implements QRSessionService {

    private static final SecureRandom RNG = new SecureRandom();

    private final QRSessionDAOImpl qrSessionDao;
    private final QRScanDAOImpl qrScanDao;
    private final SubjectDAOImpl subjectDao;
    private final AttendanceDAOImpl attendanceDao;
    private final AuditLogger auditLogger;
    private final String actorId;
    private final String ip;
    private final String userAgent;

    public QRSessionServiceImpl(QRSessionDAOImpl qrSessionDao, QRScanDAOImpl qrScanDao,
                                SubjectDAOImpl subjectDao, AttendanceDAOImpl attendanceDao,
                                AuditLogger auditLogger,
                                String actorId, String ip, String userAgent) {
        this.qrSessionDao = qrSessionDao;
        this.qrScanDao = qrScanDao;
        this.subjectDao = subjectDao;
        this.attendanceDao = attendanceDao;
        this.auditLogger = auditLogger;
        this.actorId = actorId;
        this.ip = ip;
        this.userAgent = userAgent;
    }

    @Override
    public QRSession generate(long subjectId, String createdBy, int ttlMinutes) {
        Subject s = subjectDao.findById(subjectId);
        if (s == null) {
            throw new ResourceNotFoundException("Subject " + subjectId + " not found");
        }
        if (ttlMinutes <= 0 || ttlMinutes > 60) {
            throw new ValidationException("TTL must be between 1 and 60 minutes");
        }
        String token = randomToken();
        QRSession session = new QRSession(
                token, subjectId, LocalDate.now(), createdBy,
                LocalDateTime.now().plusMinutes(ttlMinutes));
        QRSession saved = qrSessionDao.save(session);
        auditLogger.log(new AuditLog(actorId, "admin", AuditLog.ACTION_QR_GENERATE,
                String.valueOf(saved.getId()), ip, userAgent,
                "subject=" + subjectId + " ttl=" + ttlMinutes + "m"));
        return saved;
    }

    @Override
    public List<QRSession> active() {
        return qrSessionDao.findActive();
    }

    /**
     * Verify a student scan + mark present.
     *
     * <p>The {@code synchronized} block on the interned token string prevents
     * a double-scan race: thread A and thread B both pass the
     * {@code !existsBySessionAndStudent} check at the same instant, both then
     * attempt to INSERT into qr_scans, and one trips the unique constraint.
     * The block forces them to be serialised per session so the second is
     * rejected cleanly with an {@link AttendanceException}.</p>
     */
    @Override
    public QRScan verifyAndMark(String token, long studentId, boolean faceVerified,
                                String capturedPhotoHash, String adminActor) {
        if (token == null || token.isBlank()) {
            throw new ValidationException("QR token required");
        }
        QRSession session = qrSessionDao.findByToken(token);
        if (session == null) {
            throw new ResourceNotFoundException("Unknown QR session");
        }
        if (!session.isActive()) {
            throw new AttendanceException("QR session is no longer active");
        }
        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AttendanceException("QR session has expired");
        }
        // Intern the token so the monitor is shared across threads for the same session.
        synchronized (session.getToken().intern()) {
            if (qrScanDao.existsBySessionAndStudent(session.getId(), studentId)) {
                throw new AttendanceException("You have already scanned this session");
            }
            QRScan scan = new QRScan(session.getId(), studentId, session.getSubjectId(),
                    session.getDate(), faceVerified, capturedPhotoHash);
            QRScan saved = qrScanDao.save(scan);

            // Side effect: write a "present" attendance record (idempotent upsert).
            Attendance a = new Attendance(studentId, session.getSubjectId(), session.getDate(),
                    Attendance.STATUS_PRESENT, adminActor == null ? "qr" : adminActor,
                    Attendance.VIA_QR);
            attendanceDao.upsert(a);

            auditLogger.log(new AuditLog(String.valueOf(studentId), "student",
                    AuditLog.ACTION_QR_SCAN, String.valueOf(session.getId()),
                    ip, userAgent, "face=" + faceVerified));
            return saved;
        }
    }

    private String randomToken() {
        byte[] buf = new byte[32];
        RNG.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}
