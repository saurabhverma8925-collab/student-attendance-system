package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.interfaces.AuditLogDAO;
import com.sas.model.AuditLog;
import com.sas.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

/**
 * JDBC implementation of {@link AuditLogDAO}.
 *
 * <p>Audit writes are usually fire-and-forget from a background thread
 * ({@link com.sas.task.AuditLogger}); each call still opens its own short-lived
 * connection via try-with-resources.</p>
 */
public class AuditLogDAOImpl implements AuditLogDAO {

    @Override
    public AuditLog save(AuditLog a) {
        String sql = "INSERT INTO audit_logs (actor_id, actor_role, action, target, ip, user_agent, details) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, a.getActorId());
            ps.setString(2, a.getActorRole());
            ps.setString(3, a.getAction());
            ps.setString(4, a.getTarget());
            ps.setString(5, a.getIp());
            ps.setString(6, a.getUserAgent());
            ps.setString(7, a.getDetails());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    a.setId(keys.getLong(1));
                }
            }
            return a;
        } catch (SQLException e) {
            // Audit must never break the user's flow - swallow & log.
            throw new DatabaseException("Failed to persist audit log: " + e.getMessage(), e);
        }
    }

    @Override
    public AuditLog findById(Long id) {
        String sql = "SELECT id, actor_id, actor_role, action, target, ip, user_agent, details, created_at FROM audit_logs WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch audit log " + id, e);
        }
    }

    @Override
    public List<AuditLog> findAll() {
        String sql = "SELECT id, actor_id, actor_role, action, target, ip, user_agent, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200";
        List<AuditLog> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list audit logs", e);
        }
    }

    @Override
    public List<AuditLog> findRecent(int limit) {
        String sql = "SELECT id, actor_id, actor_role, action, target, ip, user_agent, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ?";
        List<AuditLog> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setInt(1, Math.max(1, limit));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(map(rs));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch recent audit logs", e);
        }
    }

    @Override
    public long countByAction(String action) {
        String sql = "SELECT COUNT(*) FROM audit_logs WHERE action = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, action);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to count audit logs by action", e);
        }
    }

    @Override
    public AuditLog update(AuditLog a) {
        throw new UnsupportedOperationException("Audit logs are append-only");
    }

    @Override
    public boolean delete(Long id) {
        throw new UnsupportedOperationException("Audit logs are append-only");
    }

    private AuditLog map(ResultSet rs) throws SQLException {
        AuditLog a = new AuditLog();
        a.setId(rs.getLong("id"));
        a.setActorId(rs.getString("actor_id"));
        a.setActorRole(rs.getString("actor_role"));
        a.setAction(rs.getString("action"));
        a.setTarget(rs.getString("target"));
        a.setIp(rs.getString("ip"));
        a.setUserAgent(rs.getString("user_agent"));
        a.setDetails(rs.getString("details"));
        Timestamp t = rs.getTimestamp("created_at");
        a.setCreatedAt(t == null ? null : t.toLocalDateTime());
        return a;
    }
}
