package com.edendale.dao;

import com.edendale.models.Content;
import com.edendale.util.DatabaseUtil;

import java.sql.*;
import java.util.*;

/**
 * ContentDAO
 * Handles reading and writing of all editable content fields.
 *
 * Methods:
 *  - getContentByPage(String page)  → Map<fieldName, value>
 *  - upsertField(String page, String field, String value, String type)
 *  - upsertBatch(String page, Map<String, String> changes)
 */
public class ContentDAO {

    // ── READ: All fields for a page ───────────────────────────────────────────

    /**
     * Returns a map of { fieldName → value } for the given page.
     * Used by the frontend to populate editable content on load.
     *
     * @param page Page identifier (e.g. "home", "grades")
     */
    public Map<String, String> getContentByPage(String page) throws SQLException {
        Map<String, String> contentMap = new LinkedHashMap<>();
        String sql = "SELECT field_name, value FROM content WHERE page = ?";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, page);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    contentMap.put(rs.getString("field_name"), rs.getString("value"));
                }
            }
        }
        return contentMap;
    }

    // ── UPSERT: Single field ──────────────────────────────────────────────────

    /**
     * Inserts or updates a single content field.
     * Uses MySQL's INSERT … ON DUPLICATE KEY UPDATE pattern.
     *
     * @param page      Page identifier
     * @param fieldName The data-field attribute value in HTML
     * @param value     New content value
     * @param type      "text" or "image"
     */
    public void upsertField(String page, String fieldName, String value, String type)
            throws SQLException {

        String sql = "INSERT INTO content (page, field_name, value, type) VALUES (?, ?, ?, ?) " +
                     "ON DUPLICATE KEY UPDATE value = VALUES(value), type = VALUES(type)";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, page);
            stmt.setString(2, fieldName);
            stmt.setString(3, value);
            stmt.setString(4, type != null ? type : "text");
            stmt.executeUpdate();
        }
    }

    // ── UPSERT: Batch (all changes from one Save click) ───────────────────────

    /**
     * Saves multiple field changes in a single transaction.
     *
     * @param page    Page identifier
     * @param changes Map of { fieldName → newValue }
     */
    public void upsertBatch(String page, Map<String, String> changes) throws SQLException {
        if (changes == null || changes.isEmpty()) return;

        String sql = "INSERT INTO content (page, field_name, value, type) VALUES (?, ?, ?, 'text') " +
                     "ON DUPLICATE KEY UPDATE value = VALUES(value)";

        try (Connection conn = DatabaseUtil.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                for (Map.Entry<String, String> entry : changes.entrySet()) {
                    stmt.setString(1, page);
                    stmt.setString(2, entry.getKey());
                    stmt.setString(3, entry.getValue());
                    stmt.addBatch();
                }
                stmt.executeBatch();
                conn.commit();
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }
}
