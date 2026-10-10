package com.sas.service;

import com.sas.dao.StudentDAOImpl;
import com.sas.exception.ResourceNotFoundException;
import com.sas.exception.ValidationException;
import com.sas.interfaces.StudentService;
import com.sas.model.AuditLog;
import com.sas.model.Student;
import com.sas.task.AuditLogger;
import com.sas.util.InputValidator;
import com.sas.util.PasswordUtil;

import java.util.List;

/**
 * Student CRUD + search service. Delegates persistence to {@link StudentDAOImpl}
 * and adds input validation, password hashing and audit logging on top.
 */
public class StudentServiceImpl implements StudentService {

    private final StudentDAOImpl dao;
    private final AuditLogger auditLogger;
    private final String actorId;
    private final String ip;
    private final String userAgent;

    public StudentServiceImpl(StudentDAOImpl dao, AuditLogger auditLogger,
                               String actorId, String ip, String userAgent) {
        this.dao = dao;
        this.auditLogger = auditLogger;
        this.actorId = actorId;
        this.ip = ip;
        this.userAgent = userAgent;
    }

    @Override
    public Student create(Student s, String rawPassword) {
        InputValidator.validateStudentId(s.getRollNo());
        InputValidator.requireNonBlank(s.getName(), "Name");
        InputValidator.requireNonBlank(s.getBranch(), "Branch");
        InputValidator.requireNonBlank(s.getSection(), "Section");
        InputValidator.validateEmail(s.getEmail());
        InputValidator.validatePhone(s.getPhone());
        InputValidator.validatePasswordStrength(rawPassword);

        s.setPasswordHash(PasswordUtil.hash(rawPassword));
        Student saved = dao.save(s);
        auditLogger.log(new AuditLog(actorId, "admin", AuditLog.ACTION_STUDENT_CREATE,
                saved.getRollNo(), ip, userAgent, "created " + saved.getRollNo()));
        return saved;
    }

    @Override
    public Student update(Student s) {
        if (s.getId() == null) {
            throw new ValidationException("Student id required for update");
        }
        InputValidator.requireNonBlank(s.getName(), "Name");
        InputValidator.requireNonBlank(s.getBranch(), "Branch");
        InputValidator.requireNonBlank(s.getSection(), "Section");
        InputValidator.validateEmail(s.getEmail());
        InputValidator.validatePhone(s.getPhone());

        Student updated = dao.update(s);
        if (updated == null) {
            throw new ResourceNotFoundException("Student " + s.getId() + " not found");
        }
        auditLogger.log(new AuditLog(actorId, "admin", AuditLog.ACTION_STUDENT_UPDATE,
                String.valueOf(updated.getId()), ip, userAgent, "updated"));
        return updated;
    }

    @Override
    public boolean delete(long id) {
        boolean ok = dao.delete(id);
        if (ok) {
            auditLogger.log(new AuditLog(actorId, "admin", AuditLog.ACTION_STUDENT_DELETE,
                    String.valueOf(id), ip, userAgent, "deleted"));
        }
        return ok;
    }

    @Override
    public Student get(long id) {
        Student s = dao.findById(id);
        if (s == null) {
            throw new ResourceNotFoundException("Student " + id + " not found");
        }
        return s;
    }

    @Override
    public List<Student> list() {
        return dao.findAll();
    }

    @Override
    public List<Student> search(String query) {
        if (query == null || query.isBlank()) {
            return dao.findAll();
        }
        return dao.search(InputValidator.sanitize(query));
    }

    @Override
    public boolean bindDevice(long studentId, String fingerprint, String userAgent) {
        if (fingerprint == null || fingerprint.isBlank()) {
            throw new ValidationException("Device fingerprint required");
        }
        boolean ok = dao.bindDevice(studentId, fingerprint, userAgent);
        if (ok) {
            auditLogger.log(new AuditLog(actorId, "student", AuditLog.ACTION_DEVICE_BIND,
                    String.valueOf(studentId), ip, userAgent, "bound device"));
        }
        return ok;
    }

    @Override
    public boolean unbindDevice(long studentId) {
        boolean ok = dao.unbindDevice(studentId);
        if (ok) {
            auditLogger.log(new AuditLog(actorId, "student", AuditLog.ACTION_DEVICE_UNBIND,
                    String.valueOf(studentId), ip, userAgent, "unbound device"));
        }
        return ok;
    }

    @Override
    public boolean markOnboardingSeen(long studentId) {
        return dao.markOnboardingSeen(studentId);
    }
}
