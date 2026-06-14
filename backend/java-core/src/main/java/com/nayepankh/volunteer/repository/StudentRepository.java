package com.nayepankh.volunteer.repository;

import com.nayepankh.volunteer.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByAssignedVolunteerId(Long volunteerId);
    List<Student> findByBranchId(Long branchId);
    List<Student> findByCity(String city);
    List<Student> findByStatus(String status);
    long countByStatus(String status);
}
