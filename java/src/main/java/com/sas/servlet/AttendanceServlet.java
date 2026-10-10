package com.sas.servlet;

import com.sas.dao.AttendanceDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.interfaces.AttendanceService;
import com.sas.model.ApiResponse;
import com.sas.model.Attendance;
import com.sas.model.User;
import com.sas.service.AttendanceServiceImpl;
import com.sas.task.AuditLogger;
import com.sas.util.JsonUtil;
import com.sas.util.SessionUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Attendance mark + daily-view endpoint.
 *
 * <p>Routes:</p>
 * <ul>
 *   <li>GET  /attendance?studentId=N                 -> student's records</li>
 *   <li>GET  /attendance?subjectId=N&date=YYYY-MM-DD  -> daily grid</li>
 *   <li>GET  /attendance?studentId=N&subjectId=M     -> student/subject records</li>
 *   <li>POST /attendance?action=mark                  -> mark single</li>
 *   <li>POST /attendance?action=bulk                 -> bulk mark (JSON body)</li>
 * </ul>
 */
@WebServlet("/attendance")
public class AttendanceServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            AttendanceDAOImpl dao = new AttendanceDAOImpl();
            String studentId = req.getParameter("studentId");
            String subjectId = req.getParameter("subjectId");
            String date = req.getParameter("date");

            if (studentId != null && !studentId.isBlank()) {
                long sid = Long.parseLong(studentId);
                Long subid = subjectId == null ? null : Long.parseLong(subjectId);
                List<Attendance> list = dao.findByStudent(sid, subid);
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(list));
                return;
            }
            if (subjectId != null && !subjectId.isBlank() && date != null) {
                long subid = Long.parseLong(subjectId);
                LocalDate d = LocalDate.parse(date);
                List<Attendance> list = dao.findBySubjectAndDate(subid, d);
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(list));
                return;
            }
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(dao.findAll()));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        User actor = SessionUtil.currentUser(req);
        AttendanceService svc = new AttendanceServiceImpl(
                new AttendanceDAOImpl(),
                AuditLogger.getInstance(),
                actor == null ? "system" : String.valueOf(actor.getId()),
                ServletHelper.clientIp(req),
                ServletHelper.userAgent(req));
        try {
            String action = req.getParameter("action");
            if ("bulk".equalsIgnoreCase(action)) {
                // Expect JSON array body of attendance records.
                String body = ServletHelper.readBody(req);
                com.google.gson.reflect.TypeToken<List<Map<String, Object>>> t =
                        new com.google.gson.reflect.TypeToken<>() {};
                List<Map<String, Object>> raw = JsonUtil.gson().fromJson(body, t.getType());
                List<Attendance> records = new ArrayList<>();
                for (Map<String, Object> m : raw) {
                    Attendance a = new Attendance();
                    a.setStudentId(toLong(m.get("studentId")));
                    a.setSubjectId(toLong(m.get("subjectId")));
                    a.setDate(LocalDate.parse(String.valueOf(m.get("date"))));
                    a.setStatus(String.valueOf(m.get("status")));
                    a.setMarkedBy(actor == null ? "qr" : actor.getUsername());
                    a.setMarkedVia(Attendance.VIA_MANUAL);
                    records.add(a);
                }
                int n = svc.markBulk(records);
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(Map.of("marked", n)));
                return;
            }
            // Single mark
            long studentId = Long.parseLong(req.getParameter("studentId"));
            long subjectId = Long.parseLong(req.getParameter("subjectId"));
            LocalDate date = req.getParameter("date") == null
                    ? LocalDate.now() : LocalDate.parse(req.getParameter("date"));
            String status = req.getParameter("status");
            String markedBy = actor == null ? "system" : actor.getUsername();
            Attendance saved = svc.markAttendance(studentId, subjectId, date, status, markedBy, Attendance.VIA_MANUAL);
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(saved));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    private static long toLong(Object o) {
        if (o == null) throw new IllegalArgumentException("missing id");
        return ((Number) o).longValue();
    }
}
