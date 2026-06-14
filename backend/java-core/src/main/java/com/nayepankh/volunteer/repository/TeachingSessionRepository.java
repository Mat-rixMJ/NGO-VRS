package com.nayepankh.volunteer.repository;

import com.nayepankh.volunteer.model.TeachingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeachingSessionRepository extends JpaRepository<TeachingSession, Long> {
    List<TeachingSession> findByVolunteerId(Long volunteerId);
    List<TeachingSession> findByStudentId(Long studentId);
    List<TeachingSession> findByVolunteerIdOrderBySessionDateDesc(Long volunteerId);
    List<TeachingSession> findByStudentIdOrderBySessionDateDesc(Long studentId);
}
