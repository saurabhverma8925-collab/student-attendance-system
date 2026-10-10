package com.sas.interfaces;

import com.sas.model.Attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Attendance-specific persistence contract.
 */
public interface AttendanceDAO extends GenericDAO<Attendance, Long> {

    /**
     * Insert-or-update attendance for a (student, subject, date) tuple.
     * Backed by ON DUPLICATE KEY UPDATE so the unique constraint is honoured.
     */
    Attendance upsert(Attendance attendance);

    /** All attendance records for one student, optionally filtered by subject. */
    List<Attendance> findByStudent(long studentId, Long subjectId);

    /** All attendance for a subject on a given date (used by the daily grid). */
    List<Attendance> findBySubjectAndDate(long subjectId, LocalDate date);

    /** Count of present / absent / late records grouped by status. */
    Map<String, Long> statusCountsForStudent(long studentId);

    /** Subjects the student is enrolled in along with present count + total. */
    List<Map<String, Object>> subjectWiseSummary(long studentId);

    /** Overall percentage for one student across all subjects. */
    double percentageForStudent(long studentId);

    /** Subject rollups where attendance falls below {@code thresholdPct}. */
    List<Map<String, Object>> lowAttendanceReport(double thresholdPct);

    /** Per-student attendance percentage inside one subject. */
    List<Map<String, Object>> subjectReport(long subjectId);
}
