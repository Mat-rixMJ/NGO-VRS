package com.nayepankh.volunteer.controller;

import com.nayepankh.volunteer.model.Donation;
import com.nayepankh.volunteer.repository.DonationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal/donations")
public class DonationController {

    @Autowired
    private DonationRepository donationRepository;

    // Create donation record
    @PostMapping
    public ResponseEntity<?> createDonation(@RequestBody Donation donation) {
        if (donation.getDonorName() == null || donation.getAmount() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "donorName and amount are required"));
        }
        // Auto-generate receipt number
        if (donation.getReceiptNumber() == null) {
            donation.setReceiptNumber("NP-" + System.currentTimeMillis() % 100000);
        }
        Donation saved = donationRepository.save(donation);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get all donations
    @GetMapping
    public ResponseEntity<?> getAllDonations() {
        List<Donation> donations = donationRepository.findAllByOrderByDonationDateDesc();
        return ResponseEntity.ok(donations);
    }

    // Get donation by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getDonation(@PathVariable Long id) {
        Optional<Donation> opt = donationRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Donation not found"));
        }
        return ResponseEntity.ok(opt.get());
    }

    // Update donation
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDonation(@PathVariable Long id, @RequestBody Donation updateData) {
        Optional<Donation> opt = donationRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Donation not found"));
        }
        Donation existing = opt.get();
        if (updateData.getDonorName() != null) existing.setDonorName(updateData.getDonorName());
        if (updateData.getDonorEmail() != null) existing.setDonorEmail(updateData.getDonorEmail());
        if (updateData.getDonorPhone() != null) existing.setDonorPhone(updateData.getDonorPhone());
        if (updateData.getAmount() != null) existing.setAmount(updateData.getAmount());
        if (updateData.getCampaign() != null) existing.setCampaign(updateData.getCampaign());
        if (updateData.getPaymentMethod() != null) existing.setPaymentMethod(updateData.getPaymentMethod());
        if (updateData.getPanNumber() != null) existing.setPanNumber(updateData.getPanNumber());
        if (updateData.getStatus() != null) existing.setStatus(updateData.getStatus());
        if (updateData.getNotes() != null) existing.setNotes(updateData.getNotes());
        
        Donation saved = donationRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // Delete donation
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDonation(@PathVariable Long id) {
        if (!donationRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Donation not found"));
        }
        donationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Donation deleted successfully"));
    }

    // Donation summary / analytics
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        List<Donation> all = donationRepository.findAll();
        
        double totalAmount = all.stream()
                .filter(d -> "completed".equals(d.getStatus()))
                .mapToDouble(Donation::getAmount).sum();
        
        long totalDonations = all.stream().filter(d -> "completed".equals(d.getStatus())).count();
        
        // This month
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0);
        double thisMonth = all.stream()
                .filter(d -> "completed".equals(d.getStatus()) && d.getDonationDate().isAfter(startOfMonth))
                .mapToDouble(Donation::getAmount).sum();
        
        // By campaign
        Map<String, Double> byCampaign = all.stream()
                .filter(d -> "completed".equals(d.getStatus()) && d.getCampaign() != null)
                .collect(Collectors.groupingBy(Donation::getCampaign, Collectors.summingDouble(Donation::getAmount)));
        
        List<Map<String, Object>> campaignList = byCampaign.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("campaign", e.getKey());
            m.put("amount", e.getValue());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalAmount", totalAmount);
        summary.put("totalDonations", totalDonations);
        summary.put("thisMonthAmount", thisMonth);
        summary.put("byCampaign", campaignList);
        
        return ResponseEntity.ok(summary);
    }
}
