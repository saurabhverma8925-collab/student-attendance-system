package com.sas.servlet;

import com.sas.exception.ErrorHandler;
import com.sas.util.JsonUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * Shared helpers for servlets - JSON I/O, error translation and request metadata.
 *
 * <p>Keeps the per-servlet {@code doGet}/{@code doPost} methods small: they
 * just delegate here for boilerplate.</p>
 */
public final class ServletHelper {

    private ServletHelper() {
    }

    /** Read the raw request body as a string (used for JSON endpoints). */
    public static String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = req.getReader()) {
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line);
            }
        }
        return sb.toString();
    }

    /** Write {@code obj} as JSON with the given HTTP status. */
    public static void writeJson(HttpServletResponse resp, int status, Object obj) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Cache-Control", "no-store");
        try (PrintWriter w = resp.getWriter()) {
            w.write(JsonUtil.toJson(obj));
        }
    }

    /** Convenience: 200 OK with a body. */
    public static void writeJsonOk(HttpServletResponse resp, Object obj) throws IOException {
        writeJson(resp, HttpServletResponse.SC_OK, obj);
    }

    /** Translate a thrown exception into the right status + JSON error body. */
    public static void writeJsonError(HttpServletResponse resp, Throwable t) throws IOException {
        ErrorHandler.writeJsonError(resp, t);
    }

    /** Best-effort client IP, honouring the X-Forwarded-For header. */
    public static String clientIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            return fwd.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    public static String userAgent(HttpServletRequest req) {
        return req.getHeader("User-Agent");
    }

    /** Send a JSON 400 with a specific message - shortcut for validation errors. */
    public static void badRequest(HttpServletResponse resp, String message) throws IOException {
        writeJson(resp, HttpServletResponse.SC_BAD_REQUEST,
                java.util.Map.of("success", false, "error", message));
    }
}
