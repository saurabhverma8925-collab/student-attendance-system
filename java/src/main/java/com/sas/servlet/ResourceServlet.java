package com.sas.servlet;

import com.sas.dao.ResourceDAOImpl;
import com.sas.dao.SubjectDAOImpl;
import com.sas.exception.ErrorHandler;
import com.sas.interfaces.ResourceService;
import com.sas.model.ApiResponse;
import com.sas.model.Resource;
import com.sas.service.ResourceServiceImpl;
import com.sas.util.SessionUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

/**
 * Resource CRUD endpoint.
 *
 * <p>Routes:</p>
 * <ul>
 *   <li>GET  /resources                -> list all</li>
 *   <li>GET  /resources?subjectId=N    -> list by subject</li>
 *   <li>GET  /resources?id=N           -> one resource</li>
 *   <li>POST /resources                -> create</li>
 *   <li>PUT  /resources?id=N           -> update</li>
 *   <li>DELETE /resources?id=N         -> delete</li>
 * </ul>
 */
@WebServlet("/resources")
public class ResourceServlet extends HttpServlet {

    private ResourceService service;

    @Override
    public void init() {
        this.service = new ResourceServiceImpl(new ResourceDAOImpl(), new SubjectDAOImpl());
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            String idParam = req.getParameter("id");
            String subjectParam = req.getParameter("subjectId");
            if (idParam != null && !idParam.isBlank()) {
                Resource r = service.get(Long.parseLong(idParam));
                ServletHelper.writeJsonOk(resp, ApiResponse.ok(r));
                return;
            }
            List<Resource> list = (subjectParam == null)
                    ? service.list()
                    : service.forSubject(Long.parseLong(subjectParam));
            String accept = req.getHeader("Accept");
            if (accept != null && accept.contains("text/html")) {
                req.setAttribute("resources", list);
                req.setAttribute("currentUser", SessionUtil.currentUser(req));
                req.getRequestDispatcher("/jsp/student/resources.jsp").forward(req, resp);
                return;
            }
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(list));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            long subjectId = Long.parseLong(req.getParameter("subjectId"));
            String title = req.getParameter("title");
            String type = req.getParameter("type");
            String url = req.getParameter("url");
            String description = req.getParameter("description");
            boolean free = !"false".equalsIgnoreCase(req.getParameter("isFree"));
            Resource saved = service.create(subjectId, title, type, url, description, free);
            ServletHelper.writeJson(resp, HttpServletResponse.SC_CREATED, ApiResponse.ok(saved));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            long id = Long.parseLong(req.getParameter("id"));
            Resource r = new Resource();
            r.setId(id);
            r.setSubjectId(Long.parseLong(req.getParameter("subjectId")));
            r.setTitle(req.getParameter("title"));
            r.setType(req.getParameter("type"));
            r.setUrl(req.getParameter("url"));
            r.setDescription(req.getParameter("description"));
            r.setFree(!"false".equalsIgnoreCase(req.getParameter("isFree")));
            Resource updated = service.update(r);
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
            boolean ok = service.delete(id);
            ServletHelper.writeJsonOk(resp, ApiResponse.ok(ok));
        } catch (Exception e) {
            ErrorHandler.writeJsonError(resp, e);
        }
    }
}
