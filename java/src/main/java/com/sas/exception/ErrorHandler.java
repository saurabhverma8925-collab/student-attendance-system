package com.sas.exception;

import com.sas.model.ApiResponse;
import com.sas.util.JsonUtil;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Central exception-to-HTTP translator. Convert a domain exception into the
 * right status code and a JSON {@link ApiResponse} body.
 *
 * <p>Servlets delegate here so error handling is consistent across endpoints
 * and we never leak stack traces to the client.</p>
 */
public final class ErrorHandler {

    private ErrorHandler() {
    }

    /** Map an exception to an HTTP status code. */
    public static int statusFor(Throwable t) {
        if (t instanceof ValidationException)        return HttpServletResponse.SC_BAD_REQUEST;
        if (t instanceof AuthenticationException)   return HttpServletResponse.SC_UNAUTHORIZED;
        if (t instanceof DuplicateRecordException)  return HttpServletResponse.SC_CONFLICT;
        if (t instanceof ResourceNotFoundException) return HttpServletResponse.SC_NOT_FOUND;
        if (t instanceof AttendanceException)       return HttpServletResponse.SC_CONFLICT;
        if (t instanceof DatabaseException)         return HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
        return HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
    }

    /** Write a JSON error body derived from {@code t} into {@code resp}. */
    public static void writeJsonError(HttpServletResponse resp, Throwable t) throws IOException {
        int status = statusFor(t);
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("error", t.getMessage() == null ? t.getClass().getSimpleName() : t.getMessage());
        resp.getWriter().write(JsonUtil.toJson(body));
    }

    /**
     * Convenience overload used when a servlet already has a custom message
     * (for example a 404 from a missing route parameter).
     */
    public static void writeJsonError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        ApiResponse<Object> body = ApiResponse.fail(message);
        resp.getWriter().write(JsonUtil.toJson(body));
    }
}
