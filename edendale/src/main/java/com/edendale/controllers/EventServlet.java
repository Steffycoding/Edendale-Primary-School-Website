package com.edendale.controllers;

import com.edendale.dao.EventDAO;
import com.edendale.models.Event;
import com.edendale.util.JsonUtil;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * EventServlet
 *
 * Endpoints:
 *   GET    /api/events?year=2026&month=4   — List events for a month
 *   GET    /api/events                     — List ALL events
 *   POST   /api/events                     — Create event (admin only)
 *   PUT    /api/events/{id}                — Update event (admin only)
 *   DELETE /api/events/{id}                — Delete event (admin only)
 *   OPTIONS (CORS preflight)
 */
@WebServlet(urlPatterns = {"/api/events", "/api/events/*"})
public class EventServlet extends HttpServlet {

    private final EventDAO eventDAO = new EventDAO();

    // ── CORS Preflight ─────────────────────────────────────────────────────────
    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        setCorsHeaders(res);
        res.setStatus(HttpServletResponse.SC_OK);
    }

    // ── GET: List events ───────────────────────────────────────────────────────
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(res);

        try {
            String yearParam  = req.getParameter("year");
            String monthParam = req.getParameter("month");

            List<Event> events;

            if (yearParam != null && monthParam != null) {
                int year  = Integer.parseInt(yearParam);
                int month = Integer.parseInt(monthParam);
                events = eventDAO.getEventsByMonth(year, month);
            } else {
                events = eventDAO.getAllEvents();
            }

            JsonUtil.writeJson(res, 200, events);

        } catch (NumberFormatException e) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Invalid year/month parameters."));
        } catch (SQLException e) {
            e.printStackTrace();
            JsonUtil.writeJson(res, 500, Map.of("error", "Database error fetching events."));
        }
    }

    // ── POST: Create event (admin only) ────────────────────────────────────────
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(res);
        if (!isAdminSession(req)) {
            JsonUtil.writeJson(res, 401, Map.of("error", "Unauthorised."));
            return;
        }

        Event event = parseEventBody(req, res);
        if (event == null) return;

        try {
            int newId = eventDAO.createEvent(event);
            event.setId(newId);
            JsonUtil.writeJson(res, 201, event);
        } catch (SQLException e) {
            e.printStackTrace();
            JsonUtil.writeJson(res, 500, Map.of("error", "Database error creating event."));
        }
    }

    // ── PUT: Update event (admin only) ─────────────────────────────────────────
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(res);
        if (!isAdminSession(req)) {
            JsonUtil.writeJson(res, 401, Map.of("error", "Unauthorised."));
            return;
        }

        int id = extractId(req);
        if (id < 0) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Missing event ID in path."));
            return;
        }

        Event event = parseEventBody(req, res);
        if (event == null) return;
        event.setId(id);

        try {
            boolean updated = eventDAO.updateEvent(event);
            if (updated) {
                JsonUtil.writeJson(res, 200, event);
            } else {
                JsonUtil.writeJson(res, 404, Map.of("error", "Event not found."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            JsonUtil.writeJson(res, 500, Map.of("error", "Database error updating event."));
        }
    }

    // ── DELETE: Remove event (admin only) ──────────────────────────────────────
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(res);
        if (!isAdminSession(req)) {
            JsonUtil.writeJson(res, 401, Map.of("error", "Unauthorised."));
            return;
        }

        int id = extractId(req);
        if (id < 0) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Missing event ID in path."));
            return;
        }

        try {
            boolean deleted = eventDAO.deleteEvent(id);
            if (deleted) {
                JsonUtil.writeJson(res, 200, Map.of("success", true));
            } else {
                JsonUtil.writeJson(res, 404, Map.of("error", "Event not found."));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            JsonUtil.writeJson(res, 500, Map.of("error", "Database error deleting event."));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** Extracts /api/events/{id} → id as int, or -1 on failure. */
    private int extractId(HttpServletRequest req) {
        String pathInfo = req.getPathInfo(); // e.g. "/5"
        if (pathInfo == null || pathInfo.equals("/")) return -1;
        try {
            return Integer.parseInt(pathInfo.substring(1));
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    /** Parses the request body JSON into an Event object. Returns null and writes error on failure. */
    private Event parseEventBody(HttpServletRequest req, HttpServletResponse res) throws IOException {
        JsonObject body;
        try {
            body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
        } catch (Exception e) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Invalid JSON body."));
            return null;
        }

        String title = body.has("title") ? body.get("title").getAsString().trim() : "";
        String date  = body.has("date")  ? body.get("date").getAsString().trim()  : "";

        if (title.isEmpty() || date.isEmpty()) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Title and date are required."));
            return null;
        }

        Event ev = new Event();
        ev.setTitle(title);
        ev.setDate(date);
        ev.setTime(body.has("time")        ? body.get("time").getAsString()        : null);
        ev.setDescription(body.has("description") ? body.get("description").getAsString() : null);
        return ev;
    }

    /** Check if the current request has a valid admin session. */
    private boolean isAdminSession(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        return session != null && session.getAttribute("adminUserId") != null;
    }

    private void setCorsHeaders(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin",  "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
}
