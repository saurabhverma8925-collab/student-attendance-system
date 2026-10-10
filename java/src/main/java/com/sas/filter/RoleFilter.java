package com.sas.filter;

import com.sas.model.User;
import com.sas.util.SessionUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Set;

/**
 * Role filter - protects admin-only and student-only URL prefixes.
 *
 * <p>Two guarded path prefixes:</p>
 * <ul>
 *   <li>{@code /admin/*} - only users whose role == "admin" may pass.</li>
 *   <li>{@code /student/*} - only users whose role == "student" may pass.</li>
 * </ul>
 *
 * <p>Unmatched paths pass through (the {@link AuthFilter} already enforces
 * "any logged in user").</p>
 */
@WebFilter(urlPatterns = "/*")
public class RoleFilter extends HttpFilter {

    private static final Set<String> ADMIN_PREFIXES = Set.of("/admin", "/students", "/subjects", "/attendance", "/reports", "/security", "/resources");
    private static final Set<String> STUDENT_PREFIXES = Set.of("/student", "/device", "/qr-attendance");

    @Override
    public void init(FilterConfig config) {
        // No init params.
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        HttpServletResponse httpResp = (HttpServletResponse) res;

        String path = httpReq.getRequestURI().substring(httpReq.getContextPath().length());
        if (path.startsWith("/")) path = path.substring(1);
        String first = path.contains("/") ? path.substring(0, path.indexOf('/')) : path;
        String prefix = "/" + first;

        User user = SessionUtil.currentUser(httpReq);
        // AuthFilter already guarantees a user exists for non-public paths.
        if (user == null) {
            chain.doFilter(req, res);
            return;
        }

        boolean adminOnly = ADMIN_PREFIXES.contains(prefix);
        boolean studentOnly = STUDENT_PREFIXES.contains(prefix);

        if (adminOnly && !"admin".equals(user.getRole())) {
            deny(httpResp, httpReq, "Admin access required");
            return;
        }
        if (studentOnly && !"student".equals(user.getRole())) {
            deny(httpResp, httpReq, "Student access required");
            return;
        }
        chain.doFilter(req, res);
    }

    private void deny(HttpServletResponse resp, HttpServletRequest req, String message) throws IOException {
        String accept = req.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");
            resp.getWriter().write("{\"success\":false,\"error\":\"" + message + "\"}");
        } else {
            resp.sendRedirect(req.getContextPath() + "/login");
        }
    }
}
