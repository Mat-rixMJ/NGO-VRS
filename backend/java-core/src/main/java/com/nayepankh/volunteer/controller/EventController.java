package com.nayepankh.volunteer.controller;

import com.nayepankh.volunteer.model.Event;
import com.nayepankh.volunteer.model.EventRegistration;
import com.nayepankh.volunteer.repository.EventRepository;
import com.nayepankh.volunteer.repository.EventRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal/events")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventRegistrationRepository registrationRepository;

    // Create event (admin)
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Event event) {
        if (event.getTitle() == null || event.getType() == null || event.getEventDate() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "title, type, and eventDate are required"));
        }
        Event saved = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get all events
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllEvents(
            @RequestParam(value = "status", required = false) String status) {
        List<Event> events;
        if (status != null && !status.isEmpty()) {
            events = eventRepository.findByStatusOrderByEventDateDesc(status);
        } else {
            events = eventRepository.findAllByOrderByEventDateDesc();
        }
        
        // Enrich with registration count
        List<Map<String, Object>> enriched = events.stream().map(e -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", e.getId());
            map.put("title", e.getTitle());
            map.put("description", e.getDescription());
            map.put("type", e.getType());
            map.put("eventDate", e.getEventDate());
            map.put("location", e.getLocation());
            map.put("city", e.getCity());
            map.put("maxCapacity", e.getMaxCapacity());
            map.put("status", e.getStatus());
            map.put("createdBy", e.getCreatedBy());
            map.put("createdAt", e.getCreatedAt());
            map.put("registeredCount", registrationRepository.countByEventId(e.getId()));
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(enriched);
    }

    // Get event by id
    @GetMapping("/{id}")
    public ResponseEntity<?> getEvent(@PathVariable Long id) {
        Optional<Event> opt = eventRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
        }
        Event event = opt.get();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("event", event);
        response.put("registrations", registrationRepository.findByEventId(id));
        response.put("registeredCount", registrationRepository.countByEventId(id));
        return ResponseEntity.ok(response);
    }

    // Update event
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Event updateData) {
        Optional<Event> opt = eventRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
        }
        Event existing = opt.get();
        if (updateData.getTitle() != null) existing.setTitle(updateData.getTitle());
        if (updateData.getDescription() != null) existing.setDescription(updateData.getDescription());
        if (updateData.getType() != null) existing.setType(updateData.getType());
        if (updateData.getEventDate() != null) existing.setEventDate(updateData.getEventDate());
        if (updateData.getLocation() != null) existing.setLocation(updateData.getLocation());
        if (updateData.getCity() != null) existing.setCity(updateData.getCity());
        if (updateData.getMaxCapacity() != null) existing.setMaxCapacity(updateData.getMaxCapacity());
        if (updateData.getStatus() != null) existing.setStatus(updateData.getStatus());
        
        Event saved = eventRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // Delete event
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        if (!eventRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
        }
        eventRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully"));
    }

    // --- REGISTRATION ENDPOINTS ---

    // Register volunteer for event
    @PostMapping("/{eventId}/register")
    public ResponseEntity<?> registerForEvent(@PathVariable Long eventId, @RequestBody Map<String, Object> body) {
        Long volunteerId = body.get("volunteerId") != null ? ((Number) body.get("volunteerId")).longValue() : null;
        if (volunteerId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "volunteerId is required"));
        }
        
        if (!eventRepository.existsById(eventId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
        }
        
        // Check if already registered
        Optional<EventRegistration> existing = registrationRepository.findByEventIdAndVolunteerId(eventId, volunteerId);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Already registered for this event"));
        }
        
        // Check capacity
        Event event = eventRepository.findById(eventId).get();
        if (event.getMaxCapacity() != null) {
            long currentCount = registrationRepository.countByEventId(eventId);
            if (currentCount >= event.getMaxCapacity()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Event is at full capacity"));
            }
        }
        
        EventRegistration reg = new EventRegistration();
        reg.setEventId(eventId);
        reg.setVolunteerId(volunteerId);
        
        EventRegistration saved = registrationRepository.save(reg);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Unregister from event
    @DeleteMapping("/{eventId}/register/{volunteerId}")
    public ResponseEntity<?> unregisterFromEvent(@PathVariable Long eventId, @PathVariable Long volunteerId) {
        Optional<EventRegistration> opt = registrationRepository.findByEventIdAndVolunteerId(eventId, volunteerId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Registration not found"));
        }
        registrationRepository.delete(opt.get());
        return ResponseEntity.ok(Map.of("message", "Unregistered successfully"));
    }

    // Mark attendance (admin)
    @PutMapping("/{eventId}/attendance")
    public ResponseEntity<?> markAttendance(@PathVariable Long eventId, @RequestBody Map<String, Object> body) {
        Long volunteerId = body.get("volunteerId") != null ? ((Number) body.get("volunteerId")).longValue() : null;
        String attendanceStatus = (String) body.get("status"); // "attended" or "absent"
        Double hours = body.get("hours") != null ? ((Number) body.get("hours")).doubleValue() : null;
        
        if (volunteerId == null || attendanceStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "volunteerId and status required"));
        }
        
        Optional<EventRegistration> opt = registrationRepository.findByEventIdAndVolunteerId(eventId, volunteerId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Registration not found"));
        }
        
        EventRegistration reg = opt.get();
        reg.setStatus(attendanceStatus);
        if (hours != null) reg.setHoursLogged(hours);
        
        EventRegistration saved = registrationRepository.save(reg);
        return ResponseEntity.ok(saved);
    }

    // Get volunteer's events
    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<?> getVolunteerEvents(@PathVariable Long volunteerId) {
        List<EventRegistration> registrations = registrationRepository.findByVolunteerId(volunteerId);
        
        List<Map<String, Object>> result = registrations.stream().map(reg -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("registration", reg);
            eventRepository.findById(reg.getEventId()).ifPresent(e -> map.put("event", e));
            return map;
        }).collect(Collectors.toList());
        
        // Also include summary stats
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("events", result);
        response.put("totalRegistered", registrations.size());
        response.put("totalAttended", registrations.stream().filter(r -> "attended".equals(r.getStatus())).count());
        response.put("totalHours", registrations.stream()
                .filter(r -> r.getHoursLogged() != null)
                .mapToDouble(EventRegistration::getHoursLogged).sum());
        
        return ResponseEntity.ok(response);
    }
}
