package com.sas.interfaces;

import com.sas.model.Subject;

import java.util.List;

/**
 * Subject-specific persistence contract.
 */
public interface SubjectDAO extends GenericDAO<Subject, Long> {

    Subject findByCode(String code);

    List<Subject> findByBranchAndSemester(String branch, int semester);

    List<Subject> findByBranch(String branch);
}
