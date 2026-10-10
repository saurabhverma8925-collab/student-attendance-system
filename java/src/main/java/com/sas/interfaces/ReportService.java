package com.sas.interfaces;

import java.util.List;
import java.util.Map;

public interface ReportService {

    /** Per-subject rollup for one student. */
    List<Map<String, Object>> studentReport(long studentId);

    /** Per-student rollup inside one subject. */
    List<Map<String, Object>> subjectReport(long subjectId);

    /** All students whose overall attendance is below {@code thresholdPct}. */
    List<Map<String, Object>> lowAttendance(double thresholdPct);
}
