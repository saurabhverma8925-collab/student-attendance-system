package com.sas.interfaces;

import com.sas.model.Resource;

import java.util.List;

/**
 * Resource persistence contract.
 */
public interface ResourceDAO extends GenericDAO<Resource, Long> {

    List<Resource> findBySubject(long subjectId);
}
