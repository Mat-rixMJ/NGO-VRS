package com.nayepankh.volunteer.repository;

import com.nayepankh.volunteer.model.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    List<EventRegistration> findByEventId(Long eventId);
    List<EventRegistration> findByVolunteerId(Long volunteerId);
    Optional<EventRegistration> findByEventIdAndVolunteerId(Long eventId, Long volunteerId);
    long countByEventId(Long eventId);
    long countByVolunteerId(Long volunteerId);
    long countByVolunteerIdAndStatus(Long volunteerId, String status);
}
