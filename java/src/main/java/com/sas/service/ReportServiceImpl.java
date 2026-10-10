package com.sas.service;

import com.sas.dao.AttendanceDAOImpl;
import com.sas.interfaces.ReportService;

import java.util.List;
import java.util.Map;

/**
 * Reporting service - thin facade over the attendance DAO's aggregate queries.
 */
public class ReportServiceImpl implements ReportService {

    private final AttendanceDAOImpl attendanceDao;

    public ReportServiceImpl(AttendanceDAOImpl attendanceDao) {
        this.attendanceDao = attendanceDao;
    }

    @Override
    public List<Map<String, Object>> studentReport(long studentId) {
        return attendanceDao.subjectWiseSummary(studentId);
    }

    @Override
    public List<Map<String, Object>> subjectReport(long subjectId) {
        return attendanceDao.subjectReport(subjectId);
    }

    @Override
    public List<Map<String, Object>> lowAttendance(double thresholdPct) {
        return attendanceDao.lowAttendanceReport(thresholdPct);
    }
}
