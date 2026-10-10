package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.exception.DuplicateRecordException;
import com.sas.interfaces.StudentDAO;
import com.sas.model.Student;
import com.sas.model.User;
import com.sas.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * JDBC implementation of {@link StudentDAO}. Every query uses a
 * {@link PreparedStatement} (no string concatenation) and every ResultSet /
 * Statement / Connection is closed via try-with-resources.
 */
public class StudentDAOImpl implements StudentDAO {

    @Override
    public Student save(Student s) {
        String sql = """
                INSERT INTO students
                  (student_id, name, branch, section, semester, password_hash, email, phone, has_seen_onboarding)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, s.getRollNo());
            ps.setString(2, s.getName());
            ps.setString(3, s.getBranch());
            ps.setString(4, s.getSection());
            ps.setInt(5, s.getSemester());
            ps.setString(6, s.getPasswordHash());
            ps.setString(7, s.getEmail());
            ps.setString(8, s.getPhone());
            ps.setBoolean(9, s.isHasSeenOnboarding());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    s.setId(keys.getLong(1));
                }
            }
            return s;
        } catch (SQLException e) {
            if (isDuplicateKey(e)) {
                throw new DuplicateRecordException(
                        "Student ID " + s.getRollNo() + " already exists");
            }
            throw new DatabaseException("Failed to save student: " + e.getMessage(), e);
        }
    }

    @Override
    public Student findById(Long id) {
        String sql = """
                SELECT id, student_id, name, branch, section, semester, password_hash, email, phone,
                       device_fingerprint, device_registered_at, has_seen_onboarding, created_at, updated_at
                  FROM students
                 WHERE id = ?
                """;
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch student " + id, e);
        }
    }

    @Override
    public List<Student> findAll() {
        String sql = "SELECT id, student_id, name, branch, section, semester, password_hash, email, phone, " +
                "device_fingerprint, device_registered_at, has_seen_onboarding, created_at, updated_at " +
                "FROM students ORDER BY student_id";
        List<Student> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list students", e);
        }
    }

    @Override
    public Student update(Student s) {
        String sql = """
                UPDATE students
                   SET name = ?, branch = ?, section = ?, semester = ?, email = ?, phone = ?, updated_at = NOW()
                 WHERE id = ?
                """;
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, s.getName());
            ps.setString(2, s.getBranch());
            ps.setString(3, s.getSection());
            ps.setInt(4, s.getSemester());
            ps.setString(5, s.getEmail());
            ps.setString(6, s.getPhone());
            ps.setLong(7, s.getId());
            if (ps.executeUpdate() == 0) {
                return null;
            }
            return s;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update student " + s.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM students WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete student " + id, e);
        }
    }

    @Override
    public User findByStudentId(String studentId) {
        String sql = "SELECT id, student_id, name, branch, section, semester, password_hash, email, phone, " +
                "device_fingerprint, device_registered_at, has_seen_onboarding, created_at, updated_at " +
                "FROM students WHERE student_id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch student " + studentId, e);
        }
    }

    @Override
    public List<Student> search(String query) {
        String q = "%" + query + "%";
        String sql = "SELECT id, student_id, name, branch, section, semester, password_hash, email, phone, " +
                "device_fingerprint, device_registered_at, has_seen_onboarding, created_at, updated_at " +
                "FROM students " +
                "WHERE student_id LIKE ? OR name LIKE ? OR branch LIKE ? OR section LIKE ? " +
                "ORDER BY student_id";
        List<Student> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, q);
            ps.setString(2, q);
            ps.setString(3, q);
            ps.setString(4, q);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(map(rs));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to search students", e);
        }
    }

    @Override
    public boolean bindDevice(Long studentId, String fingerprint, String userAgent) {
        String sql = """
                UPDATE students
                   SET device_fingerprint = ?, device_registered_at = NOW(), updated_at = NOW()
                 WHERE id = ?
                """;
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, fingerprint);
            ps.setLong(2, studentId);
            boolean updated = ps.executeUpdate() > 0;
            if (updated) {
                // Mirror into the device_registrations table (single-row-per-student).
                upsertDeviceRegistration(studentId, fingerprint, userAgent);
            }
            return updated;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to bind device for " + studentId, e);
        }
    }

    private void upsertDeviceRegistration(Long studentId, String fingerprint, String userAgent) throws SQLException {
        String sql = """
                INSERT INTO device_registrations (student_id, device_fingerprint, user_agent, registered_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                  device_fingerprint = VALUES(device_fingerprint),
                  user_agent = VALUES(user_agent),
                  registered_at = NOW()
                """;
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, studentId);
            ps.setString(2, fingerprint);
            ps.setString(3, userAgent);
            ps.executeUpdate();
        }
    }

    @Override
    public boolean unbindDevice(Long studentId) {
        String sql = "UPDATE students SET device_fingerprint = NULL, device_registered_at = NULL, updated_at = NOW() WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, studentId);
            boolean ok = ps.executeUpdate() > 0;
            try (PreparedStatement del = c.prepareStatement("DELETE FROM device_registrations WHERE student_id = ?")) {
                del.setLong(1, studentId);
                del.executeUpdate();
            }
            return ok;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to unbind device for " + studentId, e);
        }
    }

    @Override
    public boolean markOnboardingSeen(Long studentId) {
        String sql = "UPDATE students SET has_seen_onboarding = TRUE, updated_at = NOW() WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, studentId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to mark onboarding for " + studentId, e);
        }
    }

    @Override
    public Map<String, Object> findDeviceBinding(Long studentId) {
        String sql = "SELECT device_fingerprint, device_registered_at FROM students WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                Map<String, Object> m = new HashMap<>();
                if (rs.next()) {
                    m.put("deviceFingerprint", rs.getString("device_fingerprint"));
                    Timestamp t = rs.getTimestamp("device_registered_at");
                    m.put("deviceRegisteredAt", t == null ? null : t.toLocalDateTime());
                }
                return m;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to read device binding for " + studentId, e);
        }
    }

    @Override
    public Map<String, Long> countByBranch() {
        String sql = "SELECT branch, COUNT(*) AS n FROM students GROUP BY branch";
        Map<String, Long> out = new LinkedHashMap<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.put(rs.getString("branch"), rs.getLong("n"));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to count students by branch", e);
        }
    }

    private Student map(ResultSet rs) throws SQLException {
        Student s = new Student();
        s.setId(rs.getLong("id"));
        s.setRollNo(rs.getString("student_id"));
        s.setName(rs.getString("name"));
        s.setBranch(rs.getString("branch"));
        s.setSection(rs.getString("section"));
        s.setSemester(rs.getInt("semester"));
        s.setPasswordHash(rs.getString("password_hash"));
        s.setEmail(rs.getString("email"));
        s.setPhone(rs.getString("phone"));
        s.setDeviceFingerprint(rs.getString("device_fingerprint"));
        Timestamp dr = rs.getTimestamp("device_registered_at");
        s.setDeviceRegisteredAt(dr == null ? null : dr.toLocalDateTime());
        s.setHasSeenOnboarding(rs.getBoolean("has_seen_onboarding"));
        Timestamp c = rs.getTimestamp("created_at");
        s.setCreatedAt(c == null ? null : c.toLocalDateTime());
        Timestamp u = rs.getTimestamp("updated_at");
        s.setUpdatedAt(u == null ? null : u.toLocalDateTime());
        return s;
    }

    private boolean isDuplicateKey(SQLException e) {
        return e.getErrorCode() == 1062;
    }
}
