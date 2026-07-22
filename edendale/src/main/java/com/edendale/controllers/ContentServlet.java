package com.edendale.controllers;

import com.edendale.dao.ContentDAO;
import com.edendale.util.JsonUtil;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * ContentServlet
 *
 * Endpoints:
 *   GET   /api/content?page=home      — Returns all content fields for a page
 *   PATCH /api/content                — Saves batch of changed fields (admin only)
 *   OPTIONS (CORS preflight)
 */
@WebServlet("/api/content")
public class ContentServlet extends HttpServlet {

    private final ContentDAO contentDAO = new ContentDAO();

    // ── CORS Preflight ─────────────────────────────────────────────────────────
    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        setCorsHeaders(res);
        res.setStatus(HttpServletResponse.SC_OK);
    }

    // ── GET: Fetch content for a page ──────────────────────────────────────────
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(res);

        String page = req.getParameter("page");
        if (page == null || page.isBlank()) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Missing 'page' query parameter."));
            return;
        }

        try {
            Map<String, String> content = contentDAO.getContentByPage(page.trim().toLowerCase());
            JsonUtil.writeJson(res, 200, content);
        } catch (SQLException e) {
            e.printStackTrace();
            JsonUtil.writeJson(res, 500, Map.of("error", "Database error fetching content."));
        }
    }

    // ── PATCH: Save batch of content changes (admin only) ─────────────────────
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        // Jakarta Servlet doesn't natively route PATCH — override service()
        if ("PATCH".equalsIgnoreCase(req.getMethod())) {
            doPatch(req, res);
        } else {
            super.service(req, res);
        }
    }

    protected void doPatch(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(res);

        // Check admin session
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("adminUserId") == null) {
            JsonUtil.writeJson(res, 401, Map.of("error", "Unauthorised. Please log in as admin."));
            return;
        }

        // Parse body
        JsonObject body;
        try {
            body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
        } catch (Exception e) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Invalid JSON body."));
            return;
        }

        String page = body.has("page") ? body.get("page").getAsString().trim().toLowerCase() : "";
        if (page.isEmpty()) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Missing 'page' in body."));
            return;
        }

        JsonObject changesJson = body.has("changes") ? body.getAsJsonObject("changes") : null;
        if (changesJson == null || changesJson.size() == 0) {
            JsonUtil.writeJson(res, 400, Map.of("error", "No changes provided."));
            return;
        }

        // Convert JsonObject to Map<String, String>
        Map<String, String> changes = new HashMap<>();
        for (Map.Entry<String, JsonElement> entry : changesJson.entrySet()) {
            changes.put(entry.getKey(), entry.getValue().getAsString());
        }

        try {
            contentDAO.upsertBatch(page, changes);
            JsonUtil.writeJson(res, 200, Map.of("success", true, "saved", changes.size()));
        } catch (SQLException e) {
            e.printStackTrace();
            JsonUtil.writeJson(res, 500, Map.of("error", "Database error saving content."));
        }
    }

    // ── Helper ─────────────────────────────────────────────────────────────────
    private void setCorsHeaders(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin",  "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
}
