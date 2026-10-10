package com.sas.servlet;

import com.sas.dao.StudentDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.exception.ValidationException;
import com.sas.interfaces.StudentService;
import com.sas.model.ApiResponse;
import com.sas.model.Student;
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
import java.util.List;

/**
 * Student CRUD endpoint.
 *
 * <p>Routes:</p>
 * <ul>
 *   <li>GET  /students           -> list (with optional ?q=)</li>
 *   <li>GET  /students?id=N      -> one student</li>
 *   <li>POST /students           -> create (form-encoded or JSON)</li>
 *   <li>PUT  /students?id=N      -> update</li>
 *   <li>DELETE /students?id=N    -> delete</li>
 * </ul>
 */
@WebServlet("/students")
public class StudentServlet extends HttpServlet {

    private StudentService service;

    @Override
    public void init() {
        User actor = null; // bound per-request
        service = new StudentServiceImpl(
                new StudentDAOImpl(),
                AuditLogger.getInstance(),
                "system", "?", "students-servlet");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            String idParam = req.getParameter("id");
            String q = req.getParameter("q");
            if (idParam != null && !idParam.isBlank()) {
                long id = Long.parseLong(idParam);
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(service.get(id)));
            } else {
                List<Student> list = (q == null) ? service.list() : service.search(q);
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(list));
            }
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        User actor = SessionUtil.currentUser(req);
        StudentService local = bindFor(req, actor);
        try {
            Student s = readStudent(req);
            if (s.getRollNo() == null || s.getRollNo().isBlank()) {
                throw new ValidationException("Student ID required");
            }
            String rawPassword = req.getParameter("password");
            if (rawPassword == null) rawPassword = "ChangeMe@1"; // default for admin-created rows
            Student saved = local.create(s, rawPassword);
            ServletHelper.writeJson(resp, HttpServletResponse.SC_CREATED,
                    ApiResponse.ok(saved));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        User actor = SessionUtil.currentUser(req);
        StudentService local = bindFor(req, actor);
        try {
            long id = Long.parseLong(req.getParameter("id"));
            Student s = readStudent(req);
            s.setId(id);
            Student updated = local.update(s);
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(updated));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        User actor = SessionUtil.currentUser(req);
        StudentService local = bindFor(req, actor);
        try {
            long id = Long.parseLong(req.getParameter("id"));
            boolean ok = local.delete(id);
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(ok));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    private StudentService bindFor(HttpServletRequest req, User actor) {
        return new StudentServiceImpl(
                new StudentDAOImpl(),
                AuditLogger.getInstance(),
                actor == null ? "system" : String.valueOf(actor.getId()),
                ServletHelper.clientIp(req),
                ServletHelper.userAgent(req));
    }

    private Student readStudent(HttpServletRequest req) {
        Student s = new Student();
        s.setRollNo(req.getParameter("studentId"));
        s.setName(req.getParameter("name"));
        s.setBranch(req.getParameter("branch"));
        s.setSection(req.getParameter("section"));
        String sem = req.getParameter("semester");
        if (sem != null && !sem.isBlank()) s.setSemester(Integer.parseInt(sem));
        s.setEmail(req.getParameter("email"));
        s.setPhone(req.getParameter("phone"));
        return s;
    }
}
