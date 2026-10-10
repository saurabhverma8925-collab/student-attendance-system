package com.sas.interfaces;

import com.sas.model.Resource;

import java.util.List;

public interface ResourceService {

    Resource create(long subjectId, String title, String type, String url,
                    String description, boolean free);

    Resource update(Resource r);

    boolean delete(long id);

    Resource get(long id);

    List<Resource> list();

    List<Resource> forSubject(long subjectId);
}
