package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.interfaces.QRSessionDAO;
import com.sas.model.QRSession;
import com.sas.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JDBC implementation of {@link QRSessionDAO}.
 */
public class QRSessionDAOImpl implements QRSessionDAO {

    @Override
    public QRSession save(QRSession s) {
        String sql = "INSERT INTO qr_sessions (token, subject_id, date, created_by, expires_at, is_active) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, s.getToken());
            ps.setLong(2, s.getSubjectId());
            ps.setDate(3, java.sql.Date.valueOf(s.getDate()));
            ps.setString(4, s.getCreatedBy());
            ps.setTimestamp(5, Timestamp.valueOf(s.getExpiresAt()));
            ps.setBoolean(6, s.isActive());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    s.setId(keys.getLong(1));
                }
            }
            return s;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save QR session: " + e.getMessage(), e);
        }
    }

    @Override
    public QRSession findById(Long id) {
        String sql = "SELECT id, token, subject_id, date, created_by, expires_at, is_active, created_at FROM qr_sessions WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch QR session " + id, e);
        }
    }

    @Override
    public QRSession findByToken(String token) {
        String sql = "SELECT id, token, subject_id, date, created_by, expires_at, is_active, created_at FROM qr_sessions WHERE token = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, token);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch QR session by token", e);
        }
    }

    @Override
    public List<QRSession> findAll() {
        String sql = "SELECT id, token, subject_id, date, created_by, expires_at, is_active, created_at FROM qr_sessions ORDER BY created_at DESC";
        List<QRSession> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list QR sessions", e);
        }
    }

    @Override
    public List<QRSession> findActive() {
        String sql = "SELECT id, token, subject_id, date, created_by, expires_at, is_active, created_at " +
                "FROM qr_sessions WHERE is_active = TRUE AND expires_at > NOW() ORDER BY created_at DESC";
        List<QRSession> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list active QR sessions", e);
        }
    }

    @Override
    public QRSession update(QRSession s) {
        String sql = "UPDATE qr_sessions SET subject_id=?, date=?, expires_at=?, is_active=? WHERE id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, s.getSubjectId());
            ps.setDate(2, java.sql.Date.valueOf(s.getDate()));
            ps.setTimestamp(3, Timestamp.valueOf(s.getExpiresAt()));
            ps.setBoolean(4, s.isActive());
            ps.setLong(5, s.getId());
            return ps.executeUpdate() > 0 ? s : null;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update QR session " + s.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM qr_sessions WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete QR session " + id, e);
        }
    }

    @Override
    public int deactivateExpired() {
        String sql = "UPDATE qr_sessions SET is_active = FALSE WHERE is_active = TRUE AND expires_at < NOW()";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            return ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to deactivate expired QR sessions", e);
        }
    }

    private QRSession map(ResultSet rs) throws SQLException {
        QRSession s = new QRSession();
        s.setId(rs.getLong("id"));
        s.setToken(rs.getString("token"));
        s.setSubjectId(rs.getLong("subject_id"));
        java.sql.Date d = rs.getDate("date");
        s.setDate(d == null ? null : d.toLocalDate());
        s.setCreatedBy(rs.getString("created_by"));
        Timestamp exp = rs.getTimestamp("expires_at");
        s.setExpiresAt(exp == null ? null : exp.toLocalDateTime());
        s.setActive(rs.getBoolean("is_active"));
        Timestamp c = rs.getTimestamp("created_at");
        s.setCreatedAt(c == null ? null : c.toLocalDateTime());
        return s;
    }
}
