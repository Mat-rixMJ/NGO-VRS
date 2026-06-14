package com.nayepankh.volunteer.repository;

import com.nayepankh.volunteer.model.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByStatus(String status);
    List<Donation> findByCampaign(String campaign);
    List<Donation> findByDonationDateBetween(LocalDateTime start, LocalDateTime end);
    List<Donation> findAllByOrderByDonationDateDesc();
}
