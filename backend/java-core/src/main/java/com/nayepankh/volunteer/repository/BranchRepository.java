package com.nayepankh.volunteer.repository;

import com.nayepankh.volunteer.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByStatus(String status);
    List<Branch> findByCity(String city);
}
