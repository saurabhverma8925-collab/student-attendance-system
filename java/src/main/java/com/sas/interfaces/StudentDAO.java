package com.sas.interfaces;

import com.sas.model.Student;
import com.sas.model.User;

import java.util.List;
import java.util.Map;

/**
 * Student-specific persistence contract.
 */
public interface StudentDAO extends GenericDAO<Student, Long> {

    /**
     * Look up a student by their roll number (their login username).
     * Returned as a polymorphic {@link User} so the auth service can keep a
     * single reference type across roles.
     */
    User findByStudentId(String studentId);

    /** Free-text search across roll number, name, branch and section. */
    List<Student> search(String query);

    /** Bind a device fingerprint to the student (single-device policy). */
    boolean bindDevice(Long studentId, String fingerprint, String userAgent);

    /** Remove the device binding. */
    boolean unbindDevice(Long studentId);

    /** Mark onboarding as seen so the banner stops appearing. */
    boolean markOnboardingSeen(Long studentId);

    /** Get device fingerprint + registration timestamp (nullable). */
    Map<String, Object> findDeviceBinding(Long studentId);

    /** Count of students per branch (used in dashboard stats). */
    Map<String, Long> countByBranch();
}
