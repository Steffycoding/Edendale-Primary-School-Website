package com.edendale.controllers;

import com.edendale.dao.AdminUserDAO;
import com.edendale.models.AdminUser;
import com.edendale.util.JsonUtil;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import at.favre.lib.crypto.bcrypt.BCrypt;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * AdminLoginServlet
 *
 * Endpoints:
 *   POST /api/admin/login  — Authenticate admin, create session
 *   POST /api/admin/logout — Invalidate session
 *   OPTIONS (CORS preflight)
 */
@WebServlet("/api/admin/login")
public class AdminLoginServlet extends HttpServlet {

    private final AdminUserDAO adminUserDAO = new AdminUserDAO();

    // ── CORS Preflight ─────────────────────────────────────────────────────────
    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        setCorsHeaders(res);
        res.setStatus(HttpServletResponse.SC_OK);
    }

    // ── POST: Login ────────────────────────────────────────────────────────────
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {

        setCorsHeaders(res);

        // Parse request body JSON
        JsonObject body;
        try {
            body = JsonParser.parseReader(req.getReader()).getAsJsonObject();
        } catch (Exception e) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Invalid JSON body."));
            return;
        }

        String username = body.has("username") ? body.get("username").getAsString().trim() : "";
        String password = body.has("password") ? body.get("password").getAsString()        : "";

        if (username.isEmpty() || password.isEmpty()) {
            JsonUtil.writeJson(res, 400, Map.of("error", "Username and password are required."));
            return;
        }

        try {
            AdminUser user = adminUserDAO.findByUsername(username);

            if (user == null) {
                // Generic message — don't reveal which field is wrong
                JsonUtil.writeJson(res, 401, Map.of("error", "Invalid credentials."));
                return;
            }

            // Verify BCrypt password
            BCrypt.Result result = BCrypt.verifyer().verify(
                    password.toCharArray(), user.getPasswordHash());

            if (!result.verified) {
                JsonUtil.writeJson(res, 401, Map.of("error", "Invalid credentials."));
                return;
            }

            // Create session
            HttpSession session = req.getSession(true);
            session.setAttribute("adminUserId", user.getId());
            session.setAttribute("adminUsername", user.getUsername());
            session.setMaxInactiveInterval(3600); // 1 hour

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", true);
            responseBody.put("username", user.getUsername());
            JsonUtil.writeJson(res, 200, responseBody);

        } catch (SQLException e) {
            e.printStackTrace();
            JsonUtil.writeJson(res, 500, Map.of("error", "Database error during login."));
        }
    }

    // ── Helper ─────────────────────────────────────────────────────────────────
    private void setCorsHeaders(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin",  "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
}
