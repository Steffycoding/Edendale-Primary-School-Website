package com.edendale.dao;

import com.edendale.models.AdminUser;
import com.edendale.util.DatabaseUtil;

import java.sql.*;

/**
 * AdminUserDAO
 * Handles authentication-related database operations.
 *
 * Methods:
 *  - findByUsername(String username) → AdminUser or null
 */
public class AdminUserDAO {

    /**
     * Finds an admin user by username.
     * Returns null if no user with that username exists.
     *
     * @param username The username to look up
     */
    public AdminUser findByUsername(String username) throws SQLException {
        String sql = "SELECT id, username, password_hash FROM admin_users WHERE username = ?";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, username);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return new AdminUser(
                        rs.getInt("id"),
                        rs.getString("username"),
                        rs.getString("password_hash")
                    );
                }
            }
        }
        return null;
    }

    /**
     * Updates the password hash for an existing admin user.
     * Useful for password resets.
     *
     * @param userId      Admin user ID
     * @param newHash     New BCrypt password hash
     */
    public boolean updatePasswordHash(int userId, String newHash) throws SQLException {
        String sql = "UPDATE admin_users SET password_hash = ? WHERE id = ?";

        try (Connection conn = DatabaseUtil.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, newHash);
            stmt.setInt(2, userId);
            return stmt.executeUpdate() > 0;
        }
    }
}
