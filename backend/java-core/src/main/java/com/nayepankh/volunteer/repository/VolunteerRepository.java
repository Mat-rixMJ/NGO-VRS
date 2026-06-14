package com.nayepankh.volunteer.repository;

import com.nayepankh.volunteer.model.Volunteer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {
    Optional<Volunteer> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT v FROM Volunteer v WHERE " +
           "(:search IS NULL OR LOWER(v.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(v.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:city IS NULL OR v.city = :city) AND " +
           "(:skill IS NULL OR LOWER(v.skills) LIKE LOWER(CONCAT('%', :skill, '%')))")
    List<Volunteer> findByFilters(@Param("search") String search,
                                 @Param("city") String city,
                                 @Param("skill") String skill);

    @Query("SELECT DISTINCT v.city FROM Volunteer v WHERE v.city IS NOT NULL")
    List<String> findUniqueCities();
}
