package com.sas.interfaces;

import com.sas.model.Attendance;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AttendanceService {

    /**
     * Mark (or overwrite) attendance for a single student. Runs inside a JDBC
     * transaction so partial failures roll back cleanly.
     */
    Attendance markAttendance(long studentId, long subjectId, LocalDate date,
                              String status, String markedBy, String markedVia);

    /** Bulk-mark a list of records in a single transaction. */
    int markBulk(List<Attendance> records);

    List<Attendance> forStudent(long studentId, Long subjectId);

    List<Attendance> forSubjectAndDate(long subjectId, LocalDate date);

    Map<String, Long> statusCounts(long studentId);

    double percentage(long studentId);
}
