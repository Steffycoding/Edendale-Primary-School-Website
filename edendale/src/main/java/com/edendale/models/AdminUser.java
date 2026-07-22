package com.edendale.models;

/**
 * AdminUser
 * Represents an admin user who can log in and edit site content.
 *
 * Maps to the `admin_users` table in the database.
 * Password is stored as a BCrypt hash — NEVER store plain text.
 */
public class AdminUser {

    private int    id;
    private String username;
    private String passwordHash;  // BCrypt hash

    // ── Constructors ──────────────────────────────────────────────────────────

    public AdminUser() {}

    public AdminUser(int id, String username, String passwordHash) {
        this.id           = id;
        this.username     = username;
        this.passwordHash = passwordHash;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public int getId()                              { return id; }
    public void setId(int id)                       { this.id = id; }

    public String getUsername()                     { return username; }
    public void setUsername(String username)        { this.username = username; }

    public String getPasswordHash()                 { return passwordHash; }
    public void setPasswordHash(String hash)        { this.passwordHash = hash; }

    @Override
    public String toString() {
        return "AdminUser{id=" + id + ", username='" + username + "'}";
    }
}
