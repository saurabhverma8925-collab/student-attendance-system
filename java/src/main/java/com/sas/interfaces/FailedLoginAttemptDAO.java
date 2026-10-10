package com.sas.interfaces;

import com.sas.model.FailedLoginAttempt;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Failed login attempt persistence contract (used by rate-limiting + security UI).
 */
public interface FailedLoginAttemptDAO extends GenericDAO<FailedLoginAttempt, Long> {

    /** Failed attempts for a username since {@code since}. */
    long countByUsernameSince(String username, LocalDateTime since);

    /** Failed attempts for an IP since {@code since}. */
    long countByIpSince(String ip, LocalDateTime since);

    /** Recent attempts for the security dashboard. */
    List<FailedLoginAttempt> findRecent(int limit);

    /** Purge attempts older than the cutoff. Returns affected count. */
    int purgeOlderThan(LocalDateTime cutoff);
}
