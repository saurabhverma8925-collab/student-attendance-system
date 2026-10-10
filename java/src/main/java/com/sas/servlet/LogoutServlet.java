package com.sas.servlet;

import com.sas.model.AuditLog;
import com.sas.model.User;
import com.sas.task.AuditLogger;
import com.sas.util.SessionUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Logout - invalidate the session, fire a LOGOUT audit record, redirect to /login.
 */
@WebServlet("/logout")
public class LogoutServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        User u = SessionUtil.currentUser(req);
        if (u != null) {
            AuditLogger.getInstance().log(new AuditLog(
                    String.valueOf(u.getId()), u.getRole(), AuditLog.ACTION_LOGOUT,
                    null, ServletHelper.clientIp(req),
                    ServletHelper.userAgent(req), "logout"));
        }
        SessionUtil.regenerate(req).invalidate();
        resp.sendRedirect(req.getContextPath() + "/login");
    }
}
