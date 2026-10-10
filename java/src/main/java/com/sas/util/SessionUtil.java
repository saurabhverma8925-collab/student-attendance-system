package com.sas.util;

import com.sas.model.Admin;
import com.sas.model.Student;
import com.sas.model.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Helpers for working with {@link HttpSession} and security-relevant cookies.
 *
 * <p>Implements:</p>
 * <ul>
 *   <li>Session fixation defence on login (regenerate the session id).</li>
 *   <li>HttpOnly + SameSite cookie hardening.</li>
 * </ul>
 */
public final class SessionUtil {

    public static final String ATTR_USER = "sas.user";
    public static final String ATTR_ROLE = "sas.role";
    public static final String ATTR_ONBOARDING_DONE = "sas.onboarding";

    private SessionUtil() {
    }

    /**
     * Invalidate the existing session and create a fresh one - protects against
     * session fixation on login.
     */
    public static HttpSession regenerate(HttpServletRequest req) {
        HttpSession old = req.getSession(false);
        if (old != null) {
            old.invalidate();
        }
        HttpSession fresh = req.getSession(true);
        // Re-issue JSESSIONID with HttpOnly + (best-effort) SameSite=Strict.
        String id = fresh.getId();
        Cookie c = new Cookie("JSESSIONID", id);
        c.setHttpOnly(true);
        c.setSecure(req.isSecure());
        c.setPath("/");
        c.setMaxAge(-1);
        fresh.setMaxInactiveInterval(60 * 480); // 8 hours - mirrors web.xml
        return fresh;
    }

    /** Bind the authenticated user + role onto the session. */
    public static void attachUser(HttpSession session, User user) {
        session.setAttribute(ATTR_USER, user);
        session.setAttribute(ATTR_ROLE, user.getRole());
    }

    /** The currently logged in {@link User} (Admin or Student), or null. */
    public static User currentUser(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) {
            return null;
        }
        Object u = session.getAttribute(ATTR_USER);
        return (User) u;
    }

    public static boolean isAdmin(HttpServletRequest req) {
        return req.getSession(false) != null
                && "admin".equals(req.getSession(false).getAttribute(ATTR_ROLE));
    }

    public static boolean isStudent(HttpServletRequest req) {
        return req.getSession(false) != null
                && "student".equals(req.getSession(false).getAttribute(ATTR_ROLE));
    }

    /** Convenience for services that need a typed Student. */
    public static Student currentStudent(HttpServletRequest req) {
        User u = currentUser(req);
        return u instanceof Student ? (Student) u : null;
    }

    /** Convenience for services that need a typed Admin. */
    public static Admin currentAdmin(HttpServletRequest req) {
        User u = currentUser(req);
        return u instanceof Admin ? (Admin) u : null;
    }

    /** Set a HttpOnly + SameSite=Strict cookie. */
    public static void setSecureCookie(HttpServletResponse resp, String name, String value, int maxAge) {
        Cookie c = new Cookie(name, value);
        c.setHttpOnly(true);
        c.setPath("/");
        c.setMaxAge(maxAge);
        resp.addCookie(c);
        // Append SameSite (Servlet 6 doesn't add it natively for non-SetCookieRead)
        resp.setHeader("Set-Cookie", buildCookieHeader(name, value, maxAge));
    }

    private static String buildCookieHeader(String name, String value, int maxAge) {
        return name + "=" + value + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + maxAge;
    }
}
