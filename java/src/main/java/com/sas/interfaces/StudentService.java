package com.sas.interfaces;

import com.sas.model.Student;

import java.util.List;

public interface StudentService {

    Student create(Student s, String rawPassword);

    Student update(Student s);

    boolean delete(long id);

    Student get(long id);

    List<Student> list();

    List<Student> search(String query);

    boolean bindDevice(long studentId, String fingerprint, String userAgent);

    boolean unbindDevice(long studentId);

    boolean markOnboardingSeen(long studentId);
}
