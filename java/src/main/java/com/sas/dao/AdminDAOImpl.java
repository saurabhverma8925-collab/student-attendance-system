package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.exception.DuplicateRecordException;
import com.sas.model.Admin;
import com.sas.model.User;
import com.sas.interfaces.UserDAO;
import com.sas.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/**
 * Read-only DAO for the {@code admins} table.
 *
 * <p>Admins are seeded, not created from the UI, so this class only implements
 * {@link UserDAO#findByUsernameAndRole(String, String)} - that is the only
 * operation the authentication service needs.</p>
 */
public class AdminDAOImpl implements UserDAO {

    @Override
    public User findByUsernameAndRole(String username, String role) {
        if (!"admin".equalsIgnoreCase(role)) {
            return null;
        }
        String sql = "SELECT id, username, password_hash, name FROM admins WHERE username = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new Admin(
                            rs.getLong("id"),
                            rs.getString("username"),
                            rs.getString("name"),
                            rs.getString("password_hash"));
                }
                return null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch admin: " + e.getMessage(), e);
        }
    }

    /** Helper used by the dashboard: count all admins (for security stats). */
    public long count() {
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement("SELECT COUNT(*) FROM admins");
             ResultSet rs = ps.executeQuery()) {
            return rs.next() ? rs.getLong(1) : 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to count admins", e);
        }
    }
}
