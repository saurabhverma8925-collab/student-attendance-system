package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.interfaces.FailedLoginAttemptDAO;
import com.sas.model.FailedLoginAttempt;
import com.sas.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JDBC implementation of {@link FailedLoginAttemptDAO}.
 */
public class FailedLoginAttemptDAOImpl implements FailedLoginAttemptDAO {

    @Override
    public FailedLoginAttempt save(FailedLoginAttempt f) {
        String sql = "INSERT INTO failed_login_attempts (username, role, ip, user_agent) VALUES (?, ?, ?, ?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, f.getUsername());
            ps.setString(2, f.getRole());
            ps.setString(3, f.getIp());
            ps.setString(4, f.getUserAgent());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    f.setId(keys.getLong(1));
                }
            }
            return f;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to persist failed-login attempt: " + e.getMessage(), e);
        }
    }

    @Override
    public FailedLoginAttempt findById(Long id) {
        String sql = "SELECT id, username, role, ip, user_agent, created_at FROM failed_login_attempts WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch failed-login attempt " + id, e);
        }
    }

    @Override
    public List<FailedLoginAttempt> findAll() {
        String sql = "SELECT id, username, role, ip, user_agent, created_at FROM failed_login_attempts ORDER BY created_at DESC LIMIT 200";
        List<FailedLoginAttempt> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list failed-login attempts", e);
        }
    }

    @Override
    public long countByUsernameSince(String username, LocalDateTime since) {
        String sql = "SELECT COUNT(*) FROM failed_login_attempts WHERE username = ? AND created_at >= ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setTimestamp(2, Timestamp.valueOf(since));
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to count failed-logins by username", e);
        }
    }

    @Override
    public long countByIpSince(String ip, LocalDateTime since) {
        String sql = "SELECT COUNT(*) FROM failed_login_attempts WHERE ip = ? AND created_at >= ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, ip);
            ps.setTimestamp(2, Timestamp.valueOf(since));
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to count failed-logins by ip", e);
        }
    }

    @Override
    public List<FailedLoginAttempt> findRecent(int limit) {
        String sql = "SELECT id, username, role, ip, user_agent, created_at FROM failed_login_attempts ORDER BY created_at DESC LIMIT ?";
        List<FailedLoginAttempt> out = new ArrayList<>();
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
            throw new DatabaseException("Failed to fetch recent failed-logins", e);
        }
    }

    @Override
    public int purgeOlderThan(LocalDateTime cutoff) {
        String sql = "DELETE FROM failed_login_attempts WHERE created_at < ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setTimestamp(1, Timestamp.valueOf(cutoff));
            return ps.executeUpdate();
        } catch (SQLException e) {
            throw new DatabaseException("Failed to purge failed-login attempts", e);
        }
    }

    @Override
    public FailedLoginAttempt update(FailedLoginAttempt f) {
        throw new UnsupportedOperationException("Failed-login attempts are append-only");
    }

    @Override
    public boolean delete(Long id) {
        throw new UnsupportedOperationException("Failed-login attempts are append-only");
    }

    private FailedLoginAttempt map(ResultSet rs) throws SQLException {
        FailedLoginAttempt f = new FailedLoginAttempt();
        f.setId(rs.getLong("id"));
        f.setUsername(rs.getString("username"));
        f.setRole(rs.getString("role"));
        f.setIp(rs.getString("ip"));
        f.setUserAgent(rs.getString("user_agent"));
        Timestamp t = rs.getTimestamp("created_at");
        f.setCreatedAt(t == null ? null : t.toLocalDateTime());
        return f;
    }
}
