package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.interfaces.AttendanceDAO;
import com.sas.model.Attendance;
import com.sas.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * JDBC implementation of {@link AttendanceDAO}.
 *
 * <p>{@link #upsert(Attendance)} relies on the unique constraint
 * {@code uq_attendance (student_id, subject_id, date)} + {@code ON DUPLICATE KEY UPDATE}
 * so the same (student, subject, date) is never inserted twice.</p>
 */
public class AttendanceDAOImpl implements AttendanceDAO {

    @Override
    public Attendance save(Attendance a) {
        String sql = "INSERT INTO attendance (student_id, subject_id, date, status, marked_by, marked_via) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            bind(ps, a);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    a.setId(keys.getLong(1));
                }
            }
            return a;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save attendance: " + e.getMessage(), e);
        }
    }

    @Override
    public Attendance upsert(Attendance a) {
        String sql = "INSERT INTO attendance (student_id, subject_id, date, status, marked_by, marked_via) " +
                "VALUES (?, ?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by), " +
                "marked_via = VALUES(marked_via), created_at = NOW()";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            bind(ps, a);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    a.setId(keys.getLong(1));
                }
            }
            return a;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to upsert attendance: " + e.getMessage(), e);
        }
    }

    private void bind(PreparedStatement ps, Attendance a) throws SQLException {
        ps.setLong(1, a.getStudentId());
        ps.setLong(2, a.getSubjectId());
        ps.setDate(3, java.sql.Date.valueOf(a.getDate()));
        ps.setString(4, a.getStatus());
        ps.setString(5, a.getMarkedBy());
        ps.setString(6, a.getMarkedVia() == null ? Attendance.VIA_MANUAL : a.getMarkedVia());
    }

    @Override
    public Attendance findById(Long id) {
        String sql = "SELECT id, student_id, subject_id, date, status, marked_by, marked_via, created_at FROM attendance WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch attendance " + id, e);
        }
    }

    @Override
    public List<Attendance> findAll() {
        String sql = "SELECT id, student_id, subject_id, date, status, marked_by, marked_via, created_at FROM attendance ORDER BY date DESC LIMIT 500";
        List<Attendance> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list attendance", e);
        }
    }

    @Override
    public List<Attendance> findByStudent(long studentId, Long subjectId) {
        String sql = subjectId == null
                ? "SELECT id, student_id, subject_id, date, status, marked_by, marked_via, created_at FROM attendance WHERE student_id = ? ORDER BY date DESC"
                : "SELECT id, student_id, subject_id, date, status, marked_by, marked_via, created_at FROM attendance WHERE student_id = ? AND subject_id = ? ORDER BY date DESC";
        List<Attendance> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, studentId);
            if (subjectId != null) {
                ps.setLong(2, subjectId);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(map(rs));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list attendance for student " + studentId, e);
        }
    }

    @Override
    public List<Attendance> findBySubjectAndDate(long subjectId, LocalDate date) {
        String sql = "SELECT id, student_id, subject_id, date, status, marked_by, marked_via, created_at FROM attendance WHERE subject_id = ? AND date = ? ORDER BY student_id";
        List<Attendance> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, subjectId);
            ps.setDate(2, java.sql.Date.valueOf(date));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(map(rs));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list attendance for subject " + subjectId, e);
        }
    }

    @Override
    public Map<String, Long> statusCountsForStudent(long studentId) {
        String sql = "SELECT status, COUNT(*) n FROM attendance WHERE student_id = ? GROUP BY status";
        Map<String, Long> out = new LinkedHashMap<>();
        out.put(Attendance.STATUS_PRESENT, 0L);
        out.put(Attendance.STATUS_ABSENT, 0L);
        out.put(Attendance.STATUS_LATE, 0L);
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.put(rs.getString("status"), rs.getLong("n"));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to count statuses for " + studentId, e);
        }
    }

    @Override
    public List<Map<String, Object>> subjectWiseSummary(long studentId) {
        String sql = """
                SELECT s.id            AS subject_id,
                       s.code          AS code,
                       s.name          AS subject_name,
                       s.total_classes AS total_classes,
                       COALESCE(SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END), 0) AS present,
                       COALESCE(SUM(CASE WHEN a.status='late'   THEN 1 ELSE 0 END), 0) AS late,
                       COALESCE(SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END), 0) AS absent,
                       COUNT(a.id) AS marked
                  FROM subjects s
                  LEFT JOIN attendance a ON a.subject_id = s.id AND a.student_id = ?
                 WHERE s.branch = (SELECT branch FROM students WHERE id = ?)
                 GROUP BY s.id, s.code, s.name, s.total_classes
                 ORDER BY s.code
                """;
        List<Map<String, Object>> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, studentId);
            ps.setLong(2, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("subjectId", rs.getLong("subject_id"));
                    row.put("code", rs.getString("code"));
                    row.put("subjectName", rs.getString("subject_name"));
                    row.put("totalClasses", rs.getInt("total_classes"));
                    row.put("present", rs.getLong("present"));
                    row.put("late", rs.getLong("late"));
                    row.put("absent", rs.getLong("absent"));
                    row.put("marked", rs.getLong("marked"));
                    out.add(row);
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to build subject-wise summary for " + studentId, e);
        }
    }

    @Override
    public double percentageForStudent(long studentId) {
        String sql = """
                SELECT COALESCE(SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END), 0) * 1.0 / NULLIF(COUNT(*), 0) AS pct
                  FROM attendance
                 WHERE student_id = ?
                """;
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    double d = rs.getDouble("pct");
                    return rs.wasNull() ? 0.0 : Math.round(d * 10000.0) / 100.0;
                }
                return 0.0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to compute percentage for " + studentId, e);
        }
    }

    @Override
    public List<Map<String, Object>> lowAttendanceReport(double thresholdPct) {
        String sql = """
                SELECT st.id, st.student_id, st.name, st.branch, st.section,
                       COUNT(a.id) AS marked,
                       COALESCE(SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END),0) AS present,
                       ROUND(COALESCE(SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END),0) * 100.0 / NULLIF(COUNT(a.id),0), 2) AS pct
                  FROM students st
                  LEFT JOIN attendance a ON a.student_id = st.id
                 GROUP BY st.id, st.student_id, st.name, st.branch, st.section
                HAVING pct IS NOT NULL AND pct < ?
                 ORDER BY pct ASC
                """;
        List<Map<String, Object>> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setDouble(1, thresholdPct);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("studentId", rs.getLong("id"));
                    row.put("rollNo", rs.getString("student_id"));
                    row.put("name", rs.getString("name"));
                    row.put("branch", rs.getString("branch"));
                    row.put("section", rs.getString("section"));
                    row.put("marked", rs.getLong("marked"));
                    row.put("present", rs.getLong("present"));
                    row.put("pct", rs.getDouble("pct"));
                    out.add(row);
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to build low-attendance report", e);
        }
    }

    @Override
    public List<Map<String, Object>> subjectReport(long subjectId) {
        String sql = """
                SELECT st.id, st.student_id, st.name, st.branch, st.section,
                       COUNT(a.id) AS marked,
                       COALESCE(SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END),0) AS present,
                       COALESCE(SUM(CASE WHEN a.status='late'   THEN 1 ELSE 0 END),0) AS late,
                       COALESCE(SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END),0) AS absent
                  FROM students st
                  LEFT JOIN attendance a ON a.student_id = st.id AND a.subject_id = ?
                 GROUP BY st.id, st.student_id, st.name, st.branch, st.section
                 ORDER BY st.student_id
                """;
        List<Map<String, Object>> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, subjectId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("studentId", rs.getLong("id"));
                    row.put("rollNo", rs.getString("student_id"));
                    row.put("name", rs.getString("name"));
                    row.put("branch", rs.getString("branch"));
                    row.put("section", rs.getString("section"));
                    row.put("marked", rs.getLong("marked"));
                    row.put("present", rs.getLong("present"));
                    row.put("late", rs.getLong("late"));
                    row.put("absent", rs.getLong("absent"));
                    out.add(row);
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to build subject report for " + subjectId, e);
        }
    }

    @Override
    public Attendance update(Attendance a) {
        String sql = "UPDATE attendance SET status=?, marked_by=?, marked_via=? WHERE id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, a.getStatus());
            ps.setString(2, a.getMarkedBy());
            ps.setString(3, a.getMarkedVia());
            ps.setLong(4, a.getId());
            return ps.executeUpdate() > 0 ? a : null;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update attendance " + a.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM attendance WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete attendance " + id, e);
        }
    }

    private Attendance map(ResultSet rs) throws SQLException {
        Attendance a = new Attendance();
        a.setId(rs.getLong("id"));
        a.setStudentId(rs.getLong("student_id"));
        a.setSubjectId(rs.getLong("subject_id"));
        a.setDate(rs.getDate("date").toLocalDate());
        a.setStatus(rs.getString("status"));
        a.setMarkedBy(rs.getString("marked_by"));
        a.setMarkedVia(rs.getString("marked_via"));
        Timestamp t = rs.getTimestamp("created_at");
        a.setCreatedAt(t == null ? null : t.toLocalDateTime());
        return a;
    }
}
