package com.sas.interfaces;

import java.util.Map;

public interface DashboardService {

    /** Aggregate counts shown on the admin dashboard cards. */
    Map<String, Object> adminStats();

    /** Per-subject attendance summary for the student dashboard. */
    Map<String, Object> studentStats(long studentId);
}
