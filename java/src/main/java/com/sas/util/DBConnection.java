package com.sas.util;

import com.sas.exception.DatabaseException;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

/**
 * Thin JDBC connection factory backed by {@code DriverManager}.
 *
 * <p>Configuration is read in this priority order (first non-empty wins):</p>
 * <ol>
 *   <li>Environment variables / system properties: {@code DB_URL},
 *       {@code DB_USER}, {@code DB_PASSWORD}</li>
 *   <li>{@code db.properties} on the classpath (fall back)</li>
 * </ol>
 *
 * <p>Connections are expected to be auto-managed by the caller via
 * try-with-resources; this class only hands out fresh connections.</p>
 */
public final class DBConnection {

    private static final Properties PROPS = new Properties();
    private static String URL;
    private static String USER;
    private static String PASSWORD;

    static {
        // 1. Try environment variables (also honour -D system properties).
        String envUrl  = System.getProperty("DB_URL",  System.getenv("DB_URL"));
        String envUser = System.getProperty("DB_USER", System.getenv("DB_USER"));
        String envPwd  = System.getProperty("DB_PASSWORD", System.getenv("DB_PASSWORD"));

        // 2. Fall back to db.properties on the classpath.
        try (InputStream in = DBConnection.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (in != null) {
                PROPS.load(in);
            }
        } catch (Exception e) {
            // No properties file - environment variables must be set.
        }

        URL      = firstNonBlank(envUrl,  PROPS.getProperty("db.url"));
        USER     = firstNonBlank(envUser, PROPS.getProperty("db.user"));
        PASSWORD = firstNonBlank(envPwd,  PROPS.getProperty("db.password"));

        if (URL == null) {
            // Default to a local MySQL instance so dev still works out of the box.
            URL = "jdbc:mysql://localhost:3306/sas?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
        }

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            throw new DatabaseException("MySQL JDBC driver not on classpath", e);
        }
    }

    private DBConnection() {
    }

    /** Hand out a fresh, auto-commit enabled connection. */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER == null ? "root" : USER, PASSWORD == null ? "" : PASSWORD);
    }

    public static String getUrl() {
        return URL;
    }

    public static String getUser() {
        return USER == null ? "root" : USER;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }
}
