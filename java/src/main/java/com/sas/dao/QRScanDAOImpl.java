package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.exception.DuplicateRecordException;
import com.sas.interfaces.QRScanDAO;
import com.sas.model.QRScan;
import com.sas.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * JDBC implementation of {@link QRScanDAO}.
 */
public class QRScanDAOImpl implements QRScanDAO {

    @Override
    public QRScan save(QRScan s) {
        String sql = "INSERT INTO qr_scans (qr_session_id, student_id, subject_id, date, face_verified, captured_photo_hash) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, s.getQrSessionId());
            ps.setLong(2, s.getStudentId());
            ps.setLong(3, s.getSubjectId());
            ps.setDate(4, java.sql.Date.valueOf(s.getDate()));
            ps.setBoolean(5, s.isFaceVerified());
            ps.setString(6, s.getCapturedPhotoHash());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    s.setId(keys.getLong(1));
                }
            }
            return s;
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) {
                throw new DuplicateRecordException("Student already scanned this QR session");
            }
            throw new DatabaseException("Failed to save QR scan: " + e.getMessage(), e);
        }
    }

    @Override
    public QRScan findById(Long id) {
        String sql = "SELECT id, qr_session_id, student_id, subject_id, date, face_verified, captured_photo_hash, created_at FROM qr_scans WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch QR scan " + id, e);
        }
    }

    @Override
    public List<QRScan> findAll() {
        String sql = "SELECT id, qr_session_id, student_id, subject_id, date, face_verified, captured_photo_hash, created_at FROM qr_scans ORDER BY created_at DESC";
        List<QRScan> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list QR scans", e);
        }
    }

    @Override
    public List<QRScan> findBySession(long qrSessionId) {
        String sql = "SELECT id, qr_session_id, student_id, subject_id, date, face_verified, captured_photo_hash, created_at " +
                "FROM qr_scans WHERE qr_session_id = ? ORDER BY created_at";
        List<QRScan> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, qrSessionId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(map(rs));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list QR scans for session " + qrSessionId, e);
        }
    }

    @Override
    public boolean existsBySessionAndStudent(long qrSessionId, long studentId) {
        String sql = "SELECT 1 FROM qr_scans WHERE qr_session_id = ? AND student_id = ? LIMIT 1";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, qrSessionId);
            ps.setLong(2, studentId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to check QR scan existence", e);
        }
    }

    @Override
    public QRScan update(QRScan s) {
        String sql = "UPDATE qr_scans SET face_verified=?, captured_photo_hash=? WHERE id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setBoolean(1, s.isFaceVerified());
            ps.setString(2, s.getCapturedPhotoHash());
            ps.setLong(3, s.getId());
            return ps.executeUpdate() > 0 ? s : null;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update QR scan " + s.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM qr_scans WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete QR scan " + id, e);
        }
    }

    private QRScan map(ResultSet rs) throws SQLException {
        QRScan s = new QRScan();
        s.setId(rs.getLong("id"));
        s.setQrSessionId(rs.getLong("qr_session_id"));
        s.setStudentId(rs.getLong("student_id"));
        s.setSubjectId(rs.getLong("subject_id"));
        java.sql.Date d = rs.getDate("date");
        s.setDate(d == null ? null : d.toLocalDate());
        s.setFaceVerified(rs.getBoolean("face_verified"));
        s.setCapturedPhotoHash(rs.getString("captured_photo_hash"));
        Timestamp t = rs.getTimestamp("created_at");
        s.setCreatedAt(t == null ? null : t.toLocalDateTime());
        return s;
    }
}
