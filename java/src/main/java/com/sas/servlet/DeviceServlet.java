package com.sas.servlet;

import com.sas.dao.StudentDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.model.ApiResponse;
import com.sas.model.User;
import com.sas.service.StudentServiceImpl;
import com.sas.task.AuditLogger;
import com.sas.util.SessionUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

/**
 * Device bind/unbind endpoint for the single-device policy.
 *
 * <p>Routes:</p>
 * <ul>
 *   <li>POST /device?action=bind     -> bind fingerprint to current student</li>
 *   <li>POST /device?action=unbind   -> release the binding</li>
 *   <li>GET  /device                  -> current binding info for the student</li>
 * </ul>
 */
@WebServlet("/device")
public class DeviceServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            User u = SessionUtil.currentUser(req);
            if (!(u instanceof com.sas.model.Student)) {
                ServletHelper.badRequest(resp, "Only students can register devices");
                return;
            }
            Map<String, Object> binding = new StudentDAOImpl().findDeviceBinding(u.getId());
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(binding));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        User u = SessionUtil.currentUser(req);
        if (!(u instanceof com.sas.model.Student)) {
            ServletHelper.badRequest(resp, "Only students can register devices");
            return;
        }
        com.sas.model.Student s = (com.sas.model.Student) u;
        StudentServiceImpl svc = new StudentServiceImpl(
                new StudentDAOImpl(),
                AuditLogger.getInstance(),
                String.valueOf(u.getId()),
                ServletHelper.clientIp(req),
                ServletHelper.userAgent(req));
        try {
            String action = req.getParameter("action");
            boolean ok;
            if ("unbind".equalsIgnoreCase(action)) {
                ok = svc.unbindDevice(s.getId());
            } else {
                String fingerprint = req.getParameter("fingerprint");
                if (fingerprint == null || fingerprint.isBlank()) {
                    throw new IllegalArgumentException("Device fingerprint required");
                }
                ok = svc.bindDevice(s.getId(), fingerprint, ServletHelper.userAgent(req));
            }
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(ok));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }
}
