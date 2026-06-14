package com.nayepankh.volunteer.controller;

import com.nayepankh.volunteer.model.Branch;
import com.nayepankh.volunteer.repository.BranchRepository;
import com.nayepankh.volunteer.repository.VolunteerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal/branches")
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private VolunteerRepository volunteerRepository;

    // Create branch
    @PostMapping
    public ResponseEntity<?> createBranch(@RequestBody Branch branch) {
        if (branch.getName() == null || branch.getCity() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name and city are required"));
        }
        Branch saved = branchRepository.save(branch);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get all branches with volunteer counts
    @GetMapping
    public ResponseEntity<?> getAllBranches() {
        List<Branch> branches = branchRepository.findAll();
        
        List<Map<String, Object>> enriched = branches.stream().map(b -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", b.getId());
            map.put("name", b.getName());
            map.put("city", b.getCity());
            map.put("state", b.getState());
            map.put("headVolunteerId", b.getHeadVolunteerId());
            map.put("contactEmail", b.getContactEmail());
            map.put("contactPhone", b.getContactPhone());
            map.put("status", b.getStatus());
            map.put("foundedAt", b.getFoundedAt());
            map.put("createdAt", b.getCreatedAt());
            // Count volunteers in this branch's city
            long volunteerCount = volunteerRepository.findAll().stream()
                    .filter(v -> b.getCity().equalsIgnoreCase(v.getCity()))
                    .count();
            map.put("volunteerCount", volunteerCount);
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(enriched);
    }

    // Get branch by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getBranch(@PathVariable Long id) {
        Optional<Branch> opt = branchRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Branch not found"));
        }
        return ResponseEntity.ok(opt.get());
    }

    // Update branch
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBranch(@PathVariable Long id, @RequestBody Branch updateData) {
        Optional<Branch> opt = branchRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Branch not found"));
        }
        Branch existing = opt.get();
        if (updateData.getName() != null) existing.setName(updateData.getName());
        if (updateData.getCity() != null) existing.setCity(updateData.getCity());
        if (updateData.getState() != null) existing.setState(updateData.getState());
        if (updateData.getHeadVolunteerId() != null) existing.setHeadVolunteerId(updateData.getHeadVolunteerId());
        if (updateData.getContactEmail() != null) existing.setContactEmail(updateData.getContactEmail());
        if (updateData.getContactPhone() != null) existing.setContactPhone(updateData.getContactPhone());
        if (updateData.getStatus() != null) existing.setStatus(updateData.getStatus());
        
        Branch saved = branchRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // Delete branch
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBranch(@PathVariable Long id) {
        if (!branchRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Branch not found"));
        }
        branchRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Branch deleted successfully"));
    }
}
