package com.sas.dao;

import com.sas.exception.DatabaseException;
import com.sas.interfaces.ResourceDAO;
import com.sas.model.Resource;
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
 * JDBC implementation of {@link ResourceDAO}.
 */
public class ResourceDAOImpl implements ResourceDAO {

    @Override
    public Resource save(Resource r) {
        String sql = "INSERT INTO resources (subject_id, title, type, url, description, is_free) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, r.getSubjectId());
            ps.setString(2, r.getTitle());
            ps.setString(3, r.getType());
            ps.setString(4, r.getUrl());
            ps.setString(5, r.getDescription());
            ps.setBoolean(6, r.isFree());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    r.setId(keys.getLong(1));
                }
            }
            return r;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to save resource: " + e.getMessage(), e);
        }
    }

    @Override
    public Resource findById(Long id) {
        String sql = "SELECT id, subject_id, title, type, url, description, is_free, created_at FROM resources WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? map(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch resource " + id, e);
        }
    }

    @Override
    public List<Resource> findAll() {
        String sql = "SELECT id, subject_id, title, type, url, description, is_free, created_at FROM resources ORDER BY created_at DESC";
        List<Resource> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.add(map(rs));
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list resources", e);
        }
    }

    @Override
    public List<Resource> findBySubject(long subjectId) {
        String sql = "SELECT id, subject_id, title, type, url, description, is_free, created_at FROM resources WHERE subject_id = ? ORDER BY created_at DESC";
        List<Resource> out = new ArrayList<>();
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, subjectId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    out.add(map(rs));
                }
            }
            return out;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to list resources for subject " + subjectId, e);
        }
    }

    @Override
    public Resource update(Resource r) {
        String sql = "UPDATE resources SET subject_id=?, title=?, type=?, url=?, description=?, is_free=? WHERE id=?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, r.getSubjectId());
            ps.setString(2, r.getTitle());
            ps.setString(3, r.getType());
            ps.setString(4, r.getUrl());
            ps.setString(5, r.getDescription());
            ps.setBoolean(6, r.isFree());
            ps.setLong(7, r.getId());
            return ps.executeUpdate() > 0 ? r : null;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update resource " + r.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM resources WHERE id = ?";
        try (Connection c = DBConnection.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to delete resource " + id, e);
        }
    }

    private Resource map(ResultSet rs) throws SQLException {
        Resource r = new Resource();
        r.setId(rs.getLong("id"));
        r.setSubjectId(rs.getLong("subject_id"));
        r.setTitle(rs.getString("title"));
        r.setType(rs.getString("type"));
        r.setUrl(rs.getString("url"));
        r.setDescription(rs.getString("description"));
        r.setFree(rs.getBoolean("is_free"));
        Timestamp t = rs.getTimestamp("created_at");
        r.setCreatedAt(t == null ? null : t.toLocalDateTime());
        return r;
    }
}
