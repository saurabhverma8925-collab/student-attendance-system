package com.sas.servlet;

import com.sas.dao.SubjectDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.exception.ValidationException;
import com.sas.model.ApiResponse;
import com.sas.model.Subject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * Subject CRUD endpoint.
 */
@WebServlet("/subjects")
public class SubjectServlet extends HttpServlet {

    private SubjectDAOImpl dao;

    @Override
    public void init() {
        this.dao = new SubjectDAOImpl();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            String idParam = req.getParameter("id");
            String branch = req.getParameter("branch");
            String sem = req.getParameter("semester");
            if (idParam != null && !idParam.isBlank()) {
                Subject s = dao.findById(Long.parseLong(idParam));
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(s));
            } else if (branch != null && sem != null) {
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(
                        dao.findByBranchAndSemester(branch, Integer.parseInt(sem))));
            } else if (branch != null) {
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(dao.findByBranch(branch)));
            } else {
                List<Subject> list = dao.findAll();
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(list));
            }
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            Subject s = readSubject(req);
            requireFields(s);
            Subject saved = dao.save(s);
            ServletHelper.writeJson(resp, HttpServletResponse.SC_CREATED,
                    ApiResponse.ok(saved));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            long id = Long.parseLong(req.getParameter("id"));
            Subject s = readSubject(req);
            s.setId(id);
            Subject updated = dao.update(s);
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(updated));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            long id = Long.parseLong(req.getParameter("id"));
            boolean ok = dao.delete(id);
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(ok));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    private Subject readSubject(HttpServletRequest req) {
        Subject s = new Subject();
        s.setCode(req.getParameter("code"));
        s.setName(req.getParameter("name"));
        s.setBranch(req.getParameter("branch"));
        String sem = req.getParameter("semester");
        if (sem != null && !sem.isBlank()) s.setSemester(Integer.parseInt(sem));
        String tc = req.getParameter("totalClasses");
        if (tc != null && !tc.isBlank()) s.setTotalClasses(Integer.parseInt(tc));
        return s;
    }

    private void requireFields(Subject s) {
        if (s.getCode() == null || s.getCode().isBlank()) throw new ValidationException("Code required");
        if (s.getName() == null || s.getName().isBlank()) throw new ValidationException("Name required");
        if (s.getBranch() == null || s.getBranch().isBlank()) throw new ValidationException("Branch required");
    }
}
