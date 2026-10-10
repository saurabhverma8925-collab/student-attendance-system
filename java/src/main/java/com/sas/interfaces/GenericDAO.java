package com.sas.interfaces;

import java.util.List;

/**
 * Generic data-access contract (Generics: entity type + id type).
 *
 * @param <T>  the entity type
 * @param <ID> the type of the entity's primary key
 */
public interface GenericDAO<T, ID> {

    T save(T entity);

    T findById(ID id);

    List<T> findAll();

    T update(T entity);

    boolean delete(ID id);
}
