package com.nayepankh.volunteer.controller;

import com.nayepankh.volunteer.model.Volunteer;
import com.nayepankh.volunteer.repository.VolunteerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal")
public class VolunteerController {

    @Autowired
    private VolunteerRepository volunteerRepository;

    // Health Check
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "ok");
        health.put("service", "core-java-service");
        health.put("totalVolunteers", volunteerRepository.count());
        return ResponseEntity.ok(health);
    }

    // Create a new volunteer (used by signup Gateway)
    @PostMapping("/volunteers")
    public ResponseEntity<?> createVolunteer(@RequestBody Volunteer volunteer) {
        if (volunteerRepository.existsByEmail(volunteer.getEmail())) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Email already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(err);
        }
        Volunteer saved = volunteerRepository.save(volunteer);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get volunteer by email (used by login Gateway)
    @GetMapping("/volunteers/by-email")
    public ResponseEntity<?> getVolunteerByEmail(@RequestParam("email") String email) {
        Optional<Volunteer> opt = volunteerRepository.findByEmail(email);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        Map<String, String> err = new HashMap<>();
        err.put("error", "User not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    // Get all volunteers with search/filters and pagination (used by admin list)
    @GetMapping("/volunteers")
    public ResponseEntity<?> getAllVolunteers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "skill", required = false) String skill,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "limit", required = false) Integer limit) {
        
        // Treat empty params as null
        String searchVal = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cityVal = (city != null && !city.trim().isEmpty()) ? city.trim() : null;
        String skillVal = (skill != null && !skill.trim().isEmpty()) ? skill.trim() : null;

        List<Volunteer> list = volunteerRepository.findByFilters(searchVal, cityVal, skillVal);
        
        // If pagination params are provided, return paginated response
        if (page != null && limit != null) {
            int pageNum = Math.max(page - 1, 0); // Convert 1-indexed to 0-indexed
            int pageSize = Math.max(limit, 1);
            int total = list.size();
            int fromIndex = pageNum * pageSize;
            int toIndex = Math.min(fromIndex + pageSize, total);
            
            List<Volunteer> pageResults = (fromIndex < total) ? list.subList(fromIndex, toIndex) : new ArrayList<>();
            
            Map<String, Object> response = new HashMap<>();
            response.put("total", total);
            response.put("page", page);
            response.put("limit", pageSize);
            response.put("results", pageResults);
            return ResponseEntity.ok(response);
        }
        
        // Without pagination params, return flat array (backward compatible)
        return ResponseEntity.ok(list);
    }

    // Get volunteer by id
    @GetMapping("/volunteers/{id}")
    public ResponseEntity<?> getVolunteerById(@PathVariable("id") Long id) {
        Optional<Volunteer> opt = volunteerRepository.findById(id);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        Map<String, String> err = new HashMap<>();
        err.put("error", "Volunteer not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    // Update volunteer profile details
    @PutMapping("/volunteers/{id}")
    public ResponseEntity<?> updateVolunteer(@PathVariable("id") Long id, @RequestBody Volunteer updateData) {
        Optional<Volunteer> opt = volunteerRepository.findById(id);
        if (opt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Volunteer not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        Volunteer existing = opt.get();
        existing.setName(updateData.getName());
        if (updateData.getPhone() != null) existing.setPhone(updateData.getPhone());
        if (updateData.getAge() != null) existing.setAge(updateData.getAge());
        if (updateData.getCity() != null) existing.setCity(updateData.getCity());
        if (updateData.getSkills() != null) existing.setSkills(updateData.getSkills());
        if (updateData.getAvailability() != null) existing.setAvailability(updateData.getAvailability());
        if (updateData.getPasswordHash() != null) existing.setPasswordHash(updateData.getPasswordHash());
        
        Volunteer saved = volunteerRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // Delete volunteer
    @DeleteMapping("/volunteers/{id}")
    public ResponseEntity<?> deleteVolunteer(@PathVariable("id") Long id) {
        if (!volunteerRepository.existsById(id)) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Volunteer not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        volunteerRepository.deleteById(id);
        Map<String, String> res = new HashMap<>();
        res.put("message", "Volunteer deleted successfully");
        return ResponseEntity.ok(res);
    }

    // Update volunteer status (approve, activate, deactivate)
    @PutMapping("/volunteers/{id}/status")
    public ResponseEntity<?> updateVolunteerStatus(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        Optional<Volunteer> opt = volunteerRepository.findById(id);
        if (opt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Volunteer not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
        }
        
        Volunteer volunteer = opt.get();
        String newStatus = (String) body.get("status");
        Long approvedBy = body.get("approvedBy") != null ? ((Number) body.get("approvedBy")).longValue() : null;
        
        if (newStatus == null || !List.of("pending", "approved", "active", "inactive").contains(newStatus)) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Invalid status. Must be: pending, approved, active, or inactive");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
        }
        
        volunteer.setStatus(newStatus);
        if ("approved".equals(newStatus) || "active".equals(newStatus)) {
            volunteer.setApprovedAt(LocalDateTime.now());
            volunteer.setApprovedBy(approvedBy);
        }
        
        Volunteer saved = volunteerRepository.save(volunteer);
        return ResponseEntity.ok(saved);
    }

    // Summary endpoint for analytics
    @GetMapping("/analytics/summary")
    public ResponseEntity<?> getAnalyticsSummary() {
        List<Volunteer> all = volunteerRepository.findAll();
        long total = all.size();
        
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusWeeks(1);
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        
        long newThisWeek = all.stream().filter(v -> v.getCreatedAt().isAfter(oneWeekAgo)).count();
        long newThisMonth = all.stream().filter(v -> v.getCreatedAt().isAfter(oneMonthAgo)).count();
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("total", total);
        summary.put("newThisWeek", newThisWeek);
        summary.put("newThisMonth", newThisMonth);
        
        return ResponseEntity.ok(summary);
    }

    // Trends endpoint for analytics charts
    @GetMapping("/analytics/trends")
    public ResponseEntity<?> getAnalyticsTrends() {
        List<Volunteer> all = volunteerRepository.findAll();
        
        // 1. Signups over time (by month)
        Map<String, Long> signupsMap = all.stream()
                .collect(Collectors.groupingBy(v -> v.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")), 
                        TreeMap::new, Collectors.counting()));
        
        List<Map<String, Object>> signupsOverTime = new ArrayList<>();
        signupsMap.forEach((month, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("month", month);
            item.put("count", count);
            signupsOverTime.add(item);
        });

        // 2. By City
        Map<String, Long> cityMap = all.stream()
                .filter(v -> v.getCity() != null && !v.getCity().trim().isEmpty())
                .collect(Collectors.groupingBy(v -> v.getCity().trim(), Collectors.counting()));
        
        List<Map<String, Object>> byCity = new ArrayList<>();
        cityMap.forEach((city, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("city", city);
            item.put("count", count);
            byCity.add(item);
        });
        byCity.sort((a, b) -> ((Long) b.get("count")).compareTo((Long) a.get("count")));

        // 3. By Skill
        Map<String, Long> skillMap = new HashMap<>();
        all.stream()
                .filter(v -> v.getSkills() != null && !v.getSkills().trim().isEmpty())
                .forEach(v -> {
                    String[] parts = v.getSkills().split(",");
                    for (String part : parts) {
                        String clean = part.trim();
                        if (!clean.isEmpty()) {
                            // Capitalize first letter for display consistency
                            String cap = clean.substring(0, 1).toUpperCase() + clean.substring(1).toLowerCase();
                            skillMap.put(cap, skillMap.getOrDefault(cap, 0L) + 1);
                        }
                    }
                });
        
        List<Map<String, Object>> bySkill = new ArrayList<>();
        skillMap.forEach((skill, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("skill", skill);
            item.put("count", count);
            bySkill.add(item);
        });
        bySkill.sort((a, b) -> ((Long) b.get("count")).compareTo((Long) a.get("count")));

        // 4. By Age Band
        Map<String, Long> ageBands = new LinkedHashMap<>();
        ageBands.put("Under 18", 0L);
        ageBands.put("18-25", 0L);
        ageBands.put("26-35", 0L);
        ageBands.put("36+", 0L);
        
        all.stream()
                .filter(v -> v.getAge() != null)
                .forEach(v -> {
                    int age = v.getAge();
                    if (age < 18) {
                        ageBands.put("Under 18", ageBands.get("Under 18") + 1);
                    } else if (age <= 25) {
                        ageBands.put("18-25", ageBands.get("18-25") + 1);
                    } else if (age <= 35) {
                        ageBands.put("26-35", ageBands.get("26-35") + 1);
                    } else {
                        ageBands.put("36+", ageBands.get("36+") + 1);
                    }
                });

        List<Map<String, Object>> byAgeBand = new ArrayList<>();
        ageBands.forEach((band, count) -> {
            Map<String, Object> item = new HashMap<>();
            item.put("band", band);
            item.put("count", count);
            byAgeBand.add(item);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("signupsOverTime", signupsOverTime);
        response.put("byCity", byCity);
        response.put("bySkill", bySkill);
        response.put("byAgeBand", byAgeBand);

        return ResponseEntity.ok(response);
    }
}
