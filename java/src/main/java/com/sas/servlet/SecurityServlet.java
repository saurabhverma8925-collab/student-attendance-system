package com.sas.servlet;

import com.sas.dao.AdminDAOImpl;
import com.sas.dao.AuditLogDAOImpl;
import com.sas.dao.FailedLoginAttemptDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.interfaces.SecurityService;
import com.sas.model.ApiResponse;
import com.sas.service.SecurityServiceImpl;
import com.sas.task.AuditLogger;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

/**
 * Security overview endpoint.
 *
 * <p>Routes:</p>
 * <ul>
 *   <li>GET /security              -> JSON overview</li>
 *   <li>GET /security?view=html    -> HTML page (admin/security.jsp)</li>
 * </ul>
 */
@WebServlet("/security")
public class SecurityServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        SecurityService svc = new SecurityServiceImpl(
                AuditLogger.getInstance(),
                new AuditLogDAOImpl(),
                new FailedLoginAttemptDAOImpl(),
                new AdminDAOImpl());
        try {
            Map<String, Object> overview = svc.overview();
            String accept = req.getHeader("Accept");
            if ("html".equalsIgnoreCase(req.getParameter("view"))
                    || (accept != null && accept.contains("text/html"))) {
                req.setAttribute("overview", overview);
                req.getRequestDispatcher("/jsp/admin/security.jsp").forward(req, resp);
                return;
            }
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(overview));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }
}
