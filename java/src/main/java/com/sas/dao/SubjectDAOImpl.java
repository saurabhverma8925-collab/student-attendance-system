package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.exception.DuplicateRecordException;
import com.sas.interfaces.SubjectDAO;
import com.sas.model.Subject;
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
 * JDBC implementation of {@link SubjectDAO}.
 */
public class SubjectDAOImpl implements SubjectDAO {

    @Override
    public Subject save(Subject s) {
        String sql = "INSERT INTO subjects (code, name, branch, semester, total_classes) VALUES (?, ?, ?, ?, ?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, s.getCode());
            ps.setString(2, s.getName());
            ps.setString(3, s.getBranch());
            ps.setInt(4, s.getSemester());
            ps.setInt(5, s.getTotalClasses());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    s.setId(keys.getLong(1));
                }
            }
            return s;
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) {
                throw new DuplicateRecordException("Subject code " + s.getCode() + " already exists");
            }
            throw new DatabaseException("Failed to save subject: " + e.getMessage(), e);
        }
    }

    @Override
    public Subject findById(Long id) {
        String sql = "SELECT id, code, name, branch, semester, total_classes, created_at FROM subjects WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch subject " + id, e);
        }
    }

    @Override
    public List<Subject> findAll() {
        String sql = "SELECT id, code, name, branch, semester, total_classes, created_at FROM subjects ORDER BY code";
        List<Subject> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list subjects", e);
        }
    }

    @Override
    public Subject update(Subject s) {
        String sql = "UPDATE subjects SET code=?, name=?, branch=?, semester=?, total_classes=? WHERE id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, s.getCode());
            ps.setString(2, s.getName());
            ps.setString(3, s.getBranch());
            ps.setInt(4, s.getSemester());
            ps.setInt(5, s.getTotalClasses());
            ps.setLong(6, s.getId());
            return ps.executeUpdate() > 0 ? s : null;
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) {
                throw new DuplicateRecordException("Subject code " + s.getCode() + " already exists");
            }
            throw new DatabaseException("Failed to update subject " + s.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM subjects WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete subject " + id, e);
        }
    }

    @Override
    public Subject findByCode(String code) {
        String sql = "SELECT id, code, name, branch, semester, total_classes, created_at FROM subjects WHERE code = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, code);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch subject " + code, e);
        }
    }

    @Override
    public List<Subject> findByBranchAndSemester(String branch, int semester) {
        String sql = "SELECT id, code, name, branch, semester, total_classes, created_at FROM subjects WHERE branch = ? AND semester = ? ORDER BY code";
        List<Subject> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, branch);
            ps.setInt(2, semester);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(map(rs));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list subjects", e);
        }
    }

    @Override
    public List<Subject> findByBranch(String branch) {
        String sql = "SELECT id, code, name, branch, semester, total_classes, created_at FROM subjects WHERE branch = ? ORDER BY code";
        List<Subject> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, branch);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(map(rs));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list subjects", e);
        }
    }

    private Subject map(ResultSet rs) throws SQLException {
        Subject s = new Subject();
        s.setId(rs.getLong("id"));
        s.setCode(rs.getString("code"));
        s.setName(rs.getString("name"));
        s.setBranch(rs.getString("branch"));
        s.setSemester(rs.getInt("semester"));
        s.setTotalClasses(rs.getInt("total_classes"));
        Timestamp t = rs.getTimestamp("created_at");
        s.setCreatedAt(t == null ? null : t.toLocalDateTime());
        return s;
    }
}
