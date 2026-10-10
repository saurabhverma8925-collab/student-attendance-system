package com.sas.servlet;

import com.sas.dao.AttendanceDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.interfaces.ReportService;
import com.sas.model.ApiResponse;
import com.sas.service.ReportServiceImpl;
import com.sas.util.SessionUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Report endpoint.
 *
 * <p>Routes:</p>
 * <ul>
 *   <li>GET /reports?type=student&id=N                 -> subject-wise for a student</li>
 *   <li>GET /reports?type=subject&id=N                 -> per-student inside a subject</li>
 *   <li>GET /reports?type=low-attendance&threshold=75  -> low attendance list</li>
 * </ul>
 */
@WebServlet("/reports")
public class ReportServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        ReportService svc = new ReportServiceImpl(new AttendanceDAOImpl());
        try {
            String type = req.getParameter("type");
            String accept = req.getHeader("Accept");
            boolean wantsHtml = accept != null && accept.contains("text/html");

            List<Map<String, Object>> data;
            switch (type == null ? "low-attendance" : type) {
                case "student":
                    data = svc.studentReport(Long.parseLong(req.getParameter("id")));
                    break;
                case "subject":
                    data = svc.subjectReport(Long.parseLong(req.getParameter("id")));
                    break;
                case "low-attendance":
                default:
                    double t = req.getParameter("threshold") == null
                            ? 75.0 : Double.parseDouble(req.getParameter("threshold"));
                    data = svc.lowAttendance(t);
                    break;
            }
            if (wantsHtml) {
                req.setAttribute("reportType", type);
                req.setAttribute("data", data);
                req.setAttribute("currentUser", SessionUtil.currentUser(req));
                req.getRequestDispatcher("/jsp/admin/reports.jsp").forward(req, resp);
                return;
            }
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(data));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }
}
