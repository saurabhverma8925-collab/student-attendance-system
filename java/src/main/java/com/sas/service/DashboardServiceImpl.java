package com.sas.service;

import com.sas.dao.AdminDAOImpl;
import com.sas.dao.AttendanceDAOImpl;
import com.sas.dao.QRSessionDAOImpl;
import com.sas.dao.QRScanDAOImpl;
import com.sas.dao.StudentDAOImpl;
import com.sas.dao.SubjectDAOImpl;
import com.sas.interfaces.DashboardService;
import com.sas.model.Attendance;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregates per-page stats for the admin + student dashboards.
 */
public class DashboardServiceImpl implements DashboardService {

    private final StudentDAOImpl studentDao;
    private final SubjectDAOImpl subjectDao;
    private final AttendanceDAOImpl attendanceDao;
    private final QRSessionDAOImpl qrSessionDao;
    private final QRScanDAOImpl qrScanDao;
    private final AdminDAOImpl adminDao;

    public DashboardServiceImpl(StudentDAOImpl studentDao, SubjectDAOImpl subjectDao,
                               AttendanceDAOImpl attendanceDao, QRSessionDAOImpl qrSessionDao,
                               QRScanDAOImpl qrScanDao, AdminDAOImpl adminDao) {
        this.studentDao = studentDao;
        this.subjectDao = subjectDao;
        this.attendanceDao = attendanceDao;
        this.qrSessionDao = qrSessionDao;
        this.qrScanDao = qrScanDao;
        this.adminDao = adminDao;
    }

    @Override
    public Map<String, Object> adminStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("studentCount", (long) studentDao.findAll().size());
        stats.put("subjectCount", (long) subjectDao.findAll().size());
        stats.put("activeQrSessions", (long) qrSessionDao.findActive().size());
        stats.put("qrScansToday", (long) qrScanDao.findAll().size());
        stats.put("adminCount", adminDao.count());
        stats.put("studentsByBranch", studentDao.countByBranch());
        return stats;
    }

    @Override
    public Map<String, Object> studentStats(long studentId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("percentage", attendanceDao.percentageForStudent(studentId));
        stats.put("statusCounts", attendanceDao.statusCountsForStudent(studentId));
        stats.put("subjects", attendanceDao.subjectWiseSummary(studentId));
        stats.put("recent", attendanceDao.findByStudent(studentId, null));
        return stats;
    }
}
