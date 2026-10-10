package com.sas.service;

import com.sas.dao.ResourceDAOImpl;
import com.sas.dao.SubjectDAOImpl;
import com.sas.exception.ResourceNotFoundException;
import com.sas.exception.ValidationException;
import com.sas.interfaces.ResourceService;
import com.sas.model.Resource;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CRUD service for study resources. Validates type + URL and ensures the
 * referenced subject exists before delegating to the DAO.
 */
public class ResourceServiceImpl implements ResourceService {

    private static final Set<String> ALLOWED_TYPES =
            new HashSet<>(Arrays.asList(Resource.TYPE_NOTES, Resource.TYPE_PDF,
                    Resource.TYPE_VIDEO, Resource.TYPE_SLIDES));

    private final ResourceDAOImpl dao;
    private final SubjectDAOImpl subjectDao;

    public ResourceServiceImpl(ResourceDAOImpl dao, SubjectDAOImpl subjectDao) {
        this.dao = dao;
        this.subjectDao = subjectDao;
    }

    @Override
    public Resource create(long subjectId, String title, String type, String url,
                           String description, boolean free) {
        validate(subjectId, title, type, url);
        Resource r = new Resource(subjectId, title.trim(), type.trim(), url.trim(),
                description == null ? null : description.trim(), free);
        return dao.save(r);
    }

    @Override
    public Resource update(Resource r) {
        if (r.getId() == null) {
            throw new ValidationException("Resource id required for update");
        }
        validate(r.getSubjectId(), r.getTitle(), r.getType(), r.getUrl());
        Resource updated = dao.update(r);
        if (updated == null) {
            throw new ResourceNotFoundException("Resource " + r.getId() + " not found");
        }
        return updated;
    }

    @Override
    public boolean delete(long id) {
        return dao.delete(id);
    }

    @Override
    public Resource get(long id) {
        Resource r = dao.findById(id);
        if (r == null) {
            throw new ResourceNotFoundException("Resource " + id + " not found");
        }
        return r;
    }

    @Override
    public List<Resource> list() {
        return dao.findAll();
    }

    @Override
    public List<Resource> forSubject(long subjectId) {
        return dao.findBySubject(subjectId);
    }

    private void validate(long subjectId, String title, String type, String url) {
        if (subjectId <= 0) throw new ValidationException("Subject required");
        if (title == null || title.isBlank()) throw new ValidationException("Title required");
        if (!ALLOWED_TYPES.contains(type)) {
            throw new ValidationException("Type must be one of: " +
                    ALLOWED_TYPES.stream().sorted().collect(Collectors.joining(", ")));
        }
        if (url == null || url.isBlank()) throw new ValidationException("URL required");
        if (subjectDao.findById(subjectId) == null) {
            throw new ResourceNotFoundException("Subject " + subjectId + " not found");
        }
    }
}
