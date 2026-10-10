package com.sas.servlet;

import com.sas.dao.AdminDAOImpl;
import com.sas.dao.StudentDAOImpl;
import com.sas.exception.AuthenticationException;
import com.sas.exception.ErrorHandler;
import com.sas.interfaces.AuthenticationService;
import com.sas.model.ApiResponse;
import com.sas.model.User;
import com.sas.service.AuthenticationServiceImpl;
import com.sas.task.AuditLogger;
import com.sas.task.LoginAttemptTracker;
import com.sas.util.SessionUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.Map;

/**
 * Login endpoint - handles both admin and student logins.
 *
 * <p>POST /login  (form or JSON) with {@code username}, {@code password}, {@code role}.
 * On success attaches the polymorphic {@link User} to the session and redirects
 * to {@link User#getDashboardPath()} - which is resolved polymorphically on the
 * Admin / Student subclass.</p>
 */
@WebServlet("/login")
public class LoginServlet extends HttpServlet {

    private AuthenticationService authService;

    @Override
    public void init() throws ServletException {
        AuditLogger auditLogger = AuditLogger.getInstance();
        LoginAttemptTracker tracker = (LoginAttemptTracker)
                getServletContext().getAttribute(ApplicationBootstrapRef.CTX_LOGIN_TRACKER);
        if (tracker == null) {
            // Defensive: bootstrap hasn't run yet (e.g. unit test) - create a throwaway one.
            tracker = new LoginAttemptTracker(new com.sas.dao.FailedLoginAttemptDAOImpl());
        }
        authService = new AuthenticationServiceImpl(
                new AdminDAOImpl(), new StudentDAOImpl(), tracker, auditLogger);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        // Already logged in? Send them to their dashboard.
        User current = SessionUtil.currentUser(req);
        if (current != null) {
            resp.sendRedirect(req.getContextPath() + "/dashboard");
            return;
        }
        req.getRequestDispatcher("/jsp/login.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        String role = req.getParameter("role");
        String accept = req.getHeader("Accept");

        try {
            if (username == null || password == null || role == null) {
                // Try JSON body
                String body = ServletHelper.readBody(req);
                if (body != null && !body.isBlank() && body.startsWith("{")) {
                    @SuppressWarnings("unchecked")
                    Map<String, String> json = JsonUtilHolder.gson().fromJson(body, Map.class);
                    if (json != null) {
                        username = json.get("username");
                        password = json.get("password");
                        role = json.get("role");
                    }
                }
            }
            if (role == null || role.isBlank()) {
                role = "admin";
            }

            User user = authService.login(username, password, role,
                    ServletHelper.clientIp(req), ServletHelper.userAgent(req));

            // Regenerate session (session-fixation defence) + attach user.
            HttpSession session = SessionUtil.regenerate(req);
            SessionUtil.attachUser(session, user);

            if (accept != null && accept.contains("application/json")) {
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(Map.of(
                        "role", user.getRole(),
                        "name", user.getName(),
                        "redirect", req.getContextPath() + "/dashboard")));
            } else {
                resp.sendRedirect(req.getContextPath() + "/dashboard");
            }
        } catch (AuthenticationException e) {
            if (accept != null && accept.contains("application/json")) {
                ErrorHandler.writeJsonError(resp, e);
            } else {
                req.setAttribute("error", e.getMessage());
                req.setAttribute("role", role);
                req.getRequestDispatcher("/jsp/login.jsp").forward(req, resp);
            }
        } catch (Exception e) {
            if (accept != null && accept.contains("application/json")) {
                ErrorHandler.writeJsonError(resp, e);
            } else {
                throw new ServletException(e);
            }
        }
    }

    /** Indirection so this servlet can be tested without the bootstrap running. */
    static final class ApplicationBootstrapRef {
        static final String CTX_LOGIN_TRACKER = com.sas.task.ApplicationBootstrap.CTX_LOGIN_TRACKER;
    }

    /** Lazy gson accessor to keep this file dependency-light. */
    static final class JsonUtilHolder {
        static com.google.gson.Gson gson() {
            return com.sas.util.JsonUtil.gson();
        }
    }
}
