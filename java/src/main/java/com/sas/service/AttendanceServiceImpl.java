package com.sas.service;

import com.sas.dao.AttendanceDAOImpl;
import com.sas.exception.AttendanceException;
import com.sas.exception.ValidationException;
import com.sas.interfaces.AttendanceService;
import com.sas.model.Attendance;
import com.sas.model.AuditLog;
import com.sas.task.AuditLogger;
import com.sas.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Attendance service.
 *
 * <p>{@link #markAttendance(long, long, LocalDate, String, String, String)}
 * wraps the upsert in an explicit JDBC transaction ({@code setAutoCommit(false)}
 * ... {@code commit()} ... {@code rollback()}) - this is the required
 * "at least one JDBC transaction" demonstration and also lets us roll the
 * audit-log write back if the upsert fails.</p>
 */
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceDAOImpl dao;
    private final AuditLogger auditLogger;
    private final String actorId;
    private final String ip;
    private final String userAgent;

    public AttendanceServiceImpl(AttendanceDAOImpl dao, AuditLogger auditLogger,
                                 String actorId, String ip, String userAgent) {
        this.dao = dao;
        this.auditLogger = auditLogger;
        this.actorId = actorId;
        this.ip = ip;
        this.userAgent = userAgent;
    }

    @Override
    public Attendance markAttendance(long studentId, long subjectId, LocalDate date,
                                     String status, String markedBy, String markedVia) {
        validateStatus(status);
        if (date == null) date = LocalDate.now();
        if (markedVia == null) markedVia = Attendance.VIA_MANUAL;

        Attendance a = new Attendance(studentId, subjectId, date, status, markedBy, markedVia);

        // --- Explicit JDBC transaction -------------------------------------
        Connection c = null;
        try {
            c = DBConnection.getConnection();
            c.setAutoCommit(false);
            try {
                Attendance saved = upsertOn(c, a);
                // Inline audit INSERT on the same connection - rolls back if upsert fails.
                try (PreparedStatement ps = c.prepareStatement(
                        "INSERT INTO audit_logs (actor_id, actor_role, action, target, ip, user_agent, details) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?)")) {
                    ps.setString(1, markedBy);
                    ps.setString(2, "admin");
                    ps.setString(3, AuditLog.ACTION_ATTENDANCE_MARK);
                    ps.setString(4, "student:" + studentId);
                    ps.setString(5, ip);
                    ps.setString(6, userAgent);
                    ps.setString(7, "subject=" + subjectId + " status=" + status + " via=" + markedVia);
                    ps.executeUpdate();
                }
                c.commit();
                return saved;
            } catch (SQLException ex) {
                if (c != null) c.rollback();
                throw ex;
            }
        } catch (SQLException e) {
            throw new AttendanceException("Failed to mark attendance: " + e.getMessage());
        } finally {
            if (c != null) {
                try { c.setAutoCommit(true); } catch (SQLException ignored) {}
                try { c.close(); } catch (SQLException ignored) {}
            }
        }
    }

    @Override
    public int markBulk(List<Attendance> records) {
        if (records == null || records.isEmpty()) return 0;
        Connection c = null;
        int n = 0;
        try {
            c = DBConnection.getConnection();
            c.setAutoCommit(false);
            String sql = "INSERT INTO attendance (student_id, subject_id, date, status, marked_by, marked_via) " +
                    "VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE " +
                    "status = VALUES(status), marked_by = VALUES(marked_by), marked_via = VALUES(marked_via)";
            try (PreparedStatement ps = c.prepareStatement(sql)) {
                for (Attendance a : records) {
                    validateStatus(a.getStatus());
                    ps.setLong(1, a.getStudentId());
                    ps.setLong(2, a.getSubjectId());
                    ps.setDate(3, java.sql.Date.valueOf(a.getDate()));
                    ps.setString(4, a.getStatus());
                    ps.setString(5, a.getMarkedBy());
                    ps.setString(6, a.getMarkedVia() == null ? Attendance.VIA_MANUAL : a.getMarkedVia());
                    ps.addBatch();
                    n++;
                }
                ps.executeBatch();
            }
            c.commit();
            auditLogger.log(new AuditLog(actorId, "admin", AuditLog.ACTION_ATTENDANCE_MARK,
                    "subject:" + records.get(0).getSubjectId(), ip, userAgent,
                    "bulk-marked " + n + " records"));
            return n;
        } catch (SQLException e) {
            if (c != null) try { c.rollback(); } catch (SQLException ignored) {}
            throw new AttendanceException("Bulk attendance failed: " + e.getMessage());
        } finally {
            if (c != null) {
                try { c.setAutoCommit(true); } catch (SQLException ignored) {}
                try { c.close(); } catch (SQLException ignored) {}
            }
        }
    }

    private Attendance upsertOn(Connection c, Attendance a) throws SQLException {
        String sql = "INSERT INTO attendance (student_id, subject_id, date, status, marked_by, marked_via) " +
                "VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE " +
                "status = VALUES(status), marked_by = VALUES(marked_by), marked_via = VALUES(marked_via), created_at = NOW()";
        try (PreparedStatement ps = c.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, a.getStudentId());
            ps.setLong(2, a.getSubjectId());
            ps.setDate(3, java.sql.Date.valueOf(a.getDate()));
            ps.setString(4, a.getStatus());
            ps.setString(5, a.getMarkedBy());
            ps.setString(6, a.getMarkedVia() == null ? Attendance.VIA_MANUAL : a.getMarkedVia());
            ps.executeUpdate();
            try (java.sql.ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) a.setId(keys.getLong(1));
            }
            return a;
        }
    }

    @Override
    public List<Attendance> forStudent(long studentId, Long subjectId) {
        return dao.findByStudent(studentId, subjectId);
    }

    @Override
    public List<Attendance> forSubjectAndDate(long subjectId, LocalDate date) {
        return dao.findBySubjectAndDate(subjectId, date);
    }

    @Override
    public Map<String, Long> statusCounts(long studentId) {
        Map<String, Long> raw = dao.statusCountsForStudent(studentId);
        Map<String, Long> out = new LinkedHashMap<>();
        out.put(Attendance.STATUS_PRESENT, raw.getOrDefault(Attendance.STATUS_PRESENT, 0L));
        out.put(Attendance.STATUS_ABSENT,  raw.getOrDefault(Attendance.STATUS_ABSENT, 0L));
        out.put(Attendance.STATUS_LATE,   raw.getOrDefault(Attendance.STATUS_LATE, 0L));
        return out;
    }

    @Override
    public double percentage(long studentId) {
        return dao.percentageForStudent(studentId);
    }

    private void validateStatus(String status) {
        if (!Attendance.STATUS_PRESENT.equals(status)
                && !Attendance.STATUS_ABSENT.equals(status)
                && !Attendance.STATUS_LATE.equals(status)) {
            throw new ValidationException("Invalid attendance status: " + status);
        }
    }
}
