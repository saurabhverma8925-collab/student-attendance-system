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

/**
 * Auth filter - enforces "logged in" for every application path except:
 *   /login, /logout, /css/*, /js/*, /error/* and the root.
 *
 * <p>On rejection we redirect to /login (HTML) or send 401 JSON (API).</p>
 */
@WebFilter(urlPatterns = "/*")
public class AuthFilter extends HttpFilter {

    @Override
    public void init(FilterConfig config) {
        // No init params required - kept for logging.
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpReq = (HttpServletRequest) req;
        HttpServletResponse httpResp = (HttpServletResponse) res;

        String path = httpReq.getRequestURI().substring(httpReq.getContextPath().length());

        if (isPublic(path)) {
            chain.doFilter(req, res);
            return;
        }

        User user = SessionUtil.currentUser(httpReq);
        if (user == null) {
            if (path.startsWith("/api/") || path.startsWith("/qr-attendance")) {
                httpResp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResp.setContentType("application/json");
                httpResp.setCharacterEncoding("UTF-8");
                httpResp.getWriter().write("{\"success\":false,\"error\":\"Authentication required\"}");
            } else {
                httpResp.sendRedirect(httpReq.getContextPath() + "/login");
            }
            return;
        }

        // Refresh session activity timestamp by touching it.
        chain.doFilter(req, res);
    }

    private boolean isPublic(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) return true;
        if (path.startsWith("/login") || path.startsWith("/logout")) return true;
        if (path.startsWith("/css/") || path.startsWith("/js/") || path.startsWith("/fonts/")) return true;
        if (path.startsWith("/error/") || path.startsWith("/jsp/error/")) return true;
        return false;
    }
}
