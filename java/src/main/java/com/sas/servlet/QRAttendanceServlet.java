package com.sas.servlet;

import com.sas.dao.AttendanceDAOImpl;
import com.sas.dao.QRScanDAOImpl;
import com.sas.dao.QRSessionDAOImpl;
import com.sas.dao.SubjectDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.interfaces.QRSessionService;
import com.sas.model.ApiResponse;
import com.sas.model.QRScan;
import com.sas.model.QRSession;
import com.sas.model.User;
import com.sas.service.QRSessionServiceImpl;
import com.sas.task.AuditLogger;
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
 * QR attendance endpoint.
 *
 * <p>Routes:</p>
 * <ul>
 *   <li>POST /qr-attendance?action=generate         -> create a new QR session</li>
 *   <li>GET  /qr-attendance?action=active           -> list active sessions</li>
 *   <li>POST /qr-attendance?action=verify          -> student scan + face verify</li>
 * </ul>
 */
@WebServlet("/qr-attendance")
public class QRAttendanceServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        QRSessionService svc = service(req);
        try {
            String action = req.getParameter("action");
            if ("active".equalsIgnoreCase(action)) {
                List<QRSession> active = svc.active();
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(active));
                return;
            }
            ServletHelper.badRequest(resp, "Unsupported GET action: " + action);
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        QRSessionService svc = service(req);
        try {
            String action = req.getParameter("action");
            User actor = SessionUtil.currentUser(req);
            if ("generate".equalsIgnoreCase(action)) {
                long subjectId = Long.parseLong(req.getParameter("subjectId"));
                int ttl = req.getParameter("ttl") == null ? 5 : Integer.parseInt(req.getParameter("ttl"));
                QRSession session = svc.generate(subjectId,
                        actor == null ? "admin" : actor.getUsername(), ttl);
                ServletHelper.writeJson(resp, HttpServletResponse.SC_CREATED,
                        ApiResponse.ok(session));
                return;
            }
            if ("verify".equalsIgnoreCase(action)) {
                String token = req.getParameter("token");
                long studentId = Long.parseLong(req.getParameter("studentId"));
                boolean face = !"false".equalsIgnoreCase(req.getParameter("faceVerified"));
                String photoHash = req.getParameter("photoHash");
                QRScan scan = svc.verifyAndMark(token, studentId, face, photoHash,
                        actor == null ? "qr" : actor.getUsername());
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(scan));
                return;
            }
            ServletHelper.badRequest(resp, "Unsupported POST action: " + action);
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    private QRSessionService service(HttpServletRequest req) {
        User actor = SessionUtil.currentUser(req);
        return new QRSessionServiceImpl(
                new QRSessionDAOImpl(),
                new QRScanDAOImpl(),
                new SubjectDAOImpl(),
                new AttendanceDAOImpl(),
                AuditLogger.getInstance(),
                actor == null ? "system" : String.valueOf(actor.getId()),
                ServletHelper.clientIp(req),
                ServletHelper.userAgent(req));
    }
}
