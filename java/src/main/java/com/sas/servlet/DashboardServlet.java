package com.sas.servlet;

import com.sas.dao.AdminDAOImpl;
import com.sas.dao.AttendanceDAOImpl;
import com.sas.dao.QRScanDAOImpl;
import com.sas.dao.QRSessionDAOImpl;
import com.sas.dao.StudentDAOImpl;
import com.sas.dao.SubjectDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.interfaces.DashboardService;
import com.sas.model.ApiResponse;
import com.sas.model.User;
import com.sas.service.DashboardServiceImpl;
import com.sas.util.SessionUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Dashboard endpoint - returns admin or student stats depending on the caller.
 *
 * <p>Routes:</p>
 * <ul>
 *   <li>GET /dashboard            -> JSON stats (role-aware)</li>
 *   <li>GET /dashboard?view=html  -> forward to the role's dashboard JSP</li>
 * </ul>
 */
@WebServlet("/dashboard")
public class DashboardServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            User u = SessionUtil.currentUser(req);
            if (u == null) {
                resp.sendRedirect(req.getContextPath() + "/login");
                return;
            }
            DashboardService svc = new DashboardServiceImpl(
                    new StudentDAOImpl(), new SubjectDAOImpl(),
                    new AttendanceDAOImpl(), new QRSessionDAOImpl(),
                    new QRScanDAOImpl(), new AdminDAOImpl());

            String view = req.getParameter("view");
            boolean wantsHtml = "html".equalsIgnoreCase(view)
                    || (req.getHeader("Accept") != null && req.getHeader("Accept").contains("text/html"));

            if (wantsHtml) {
                if ("admin".equals(u.getRole())) {
                    req.setAttribute("stats", svc.adminStats());
                    req.getRequestDispatcher("/jsp/admin/dashboard.jsp").forward(req, resp);
                } else {
                    req.setAttribute("stats", svc.studentStats(u.getId()));
                    req.getRequestDispatcher("/jsp/student/dashboard.jsp").forward(req, resp);
                }
                return;
            }
            Object data = "admin".equals(u.getRole())
                    ? svc.adminStats()
                    : svc.studentStats(u.getId());
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(data));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }
}
