package com.edendale.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * DatabaseUtil
 * Provides a single shared method to obtain a JDBC connection.
 *
 * TODO: Update DB_URL, DB_USER, DB_PASSWORD with your actual values.
 *       Consider using a connection pool (e.g. HikariCP) for production.
 */
public class DatabaseUtil {

    // ── Configuration ─────────────────────────────────────────────────────────
    private static final String DB_URL      = "jdbc:mysql://localhost:3306/edendale_db"
                                             + "?useSSL=false&serverTimezone=UTC";
    private static final String DB_USER     = "root";       // TODO: change
    private static final String DB_PASSWORD = "password";   // TODO: change

    static {
        try {
            // Explicitly load the MySQL driver (required for some environments)
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("MySQL JDBC driver not found on classpath.", e);
        }
    }

    /**
     * Returns a new JDBC Connection.
     * The caller is responsible for closing it (use try-with-resources).
     *
     * @return Connection
     * @throws SQLException if a database access error occurs
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }

    // Private constructor — utility class, not instantiable
    private DatabaseUtil() {}
}
