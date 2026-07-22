package com.edendale.dao;

import com.edendale.models.Event;
import com.edendale.util.DatabaseUtil;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * EventDAO
 * Handles all database operations for the Event model.
 *
 * Methods:
 *  - getAllEvents()
 *  - getEventsByMonth(int year, int month)
 *  - getEventById(int id)
 *  - createEvent(Event)
 *  - updateEvent(Event)
 *  - deleteEvent(int id)
 */
public class EventDAO {

    // ── READ: All Events ──────────────────────────────────────────────────────

    /**
     * Returns every event in the database, ordered by date ascending.
     */
    public List<Event> getAllEvents() throws SQLException {
        List<Event> events = new ArrayList<>();
        String sql = "SELECT id, title, event_date, event_time, description " +
                     "FROM events ORDER BY event_date ASC";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                events.add(mapRow(rs));
            }
        }
        return events;
    }

    // ── READ: Events by Month ─────────────────────────────────────────────────

    /**
     * Returns events for a specific year/month.
     *
     * @param year  4-digit year (e.g. 2026)
     * @param month 1-indexed month (1 = January)
     */
    public List<Event> getEventsByMonth(int year, int month) throws SQLException {
        List<Event> events = new ArrayList<>();
        String sql = "SELECT id, title, event_date, event_time, description " +
                     "FROM events " +
                     "WHERE YEAR(event_date) = ? AND MONTH(event_date) = ? " +
                     "ORDER BY event_date ASC";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, year);
            stmt.setInt(2, month);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    events.add(mapRow(rs));
                }
            }
        }
        return events;
    }

    // ── READ: Single Event ────────────────────────────────────────────────────

    /**
     * Returns a single event by its ID, or null if not found.
     */
    public Event getEventById(int id) throws SQLException {
        String sql = "SELECT id, title, event_date, event_time, description " +
                     "FROM events WHERE id = ?";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    /**
     * Inserts a new event. Returns the generated ID.
     */
    public int createEvent(Event event) throws SQLException {
        String sql = "INSERT INTO events (title, event_date, event_time, description) " +
                     "VALUES (?, ?, ?, ?)";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, event.getTitle());
            stmt.setString(2, event.getDate());
            stmt.setString(3, event.getTime());
            stmt.setString(4, event.getDescription());
            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) return keys.getInt(1);
            }
        }
        return -1;
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    /**
     * Updates an existing event. Returns true if a row was updated.
     */
    public boolean updateEvent(Event event) throws SQLException {
        String sql = "UPDATE events SET title = ?, event_date = ?, event_time = ?, description = ? " +
                     "WHERE id = ?";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, event.getTitle());
            stmt.setString(2, event.getDate());
            stmt.setString(3, event.getTime());
            stmt.setString(4, event.getDescription());
            stmt.setInt(5, event.getId());

            return stmt.executeUpdate() > 0;
        }
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    /**
     * Deletes an event by ID. Returns true if a row was deleted.
     */
    public boolean deleteEvent(int id) throws SQLException {
        String sql = "DELETE FROM events WHERE id = ?";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;
        }
    }

    // ── HELPER ────────────────────────────────────────────────────────────────

    private Event mapRow(ResultSet rs) throws SQLException {
        return new Event(
            rs.getInt("id"),
            rs.getString("title"),
            rs.getString("event_date"),   // returned as "YYYY-MM-DD" string
            rs.getString("event_time"),
            rs.getString("description")
        );
    }
}
