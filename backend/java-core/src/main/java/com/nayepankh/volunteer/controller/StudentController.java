package com.nayepankh.volunteer.controller;

import com.nayepankh.volunteer.model.Student;
import com.nayepankh.volunteer.model.TeachingSession;
import com.nayepankh.volunteer.repository.StudentRepository;
import com.nayepankh.volunteer.repository.TeachingSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/internal/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeachingSessionRepository sessionRepository;

    // Create student
    @PostMapping
    public ResponseEntity<?> createStudent(@RequestBody Student student) {
        if (student.getName() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name is required"));
        }
        Student saved = studentRepository.save(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get all students with optional filters
    @GetMapping
    public ResponseEntity<?> getAllStudents(
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "branchId", required = false) Long branchId,
            @RequestParam(value = "volunteerId", required = false) Long volunteerId,
            @RequestParam(value = "status", required = false) String status) {
        
        List<Student> students;
        if (volunteerId != null) {
            students = studentRepository.findByAssignedVolunteerId(volunteerId);
        } else if (branchId != null) {
            students = studentRepository.findByBranchId(branchId);
        } else if (city != null && !city.isEmpty()) {
            students = studentRepository.findByCity(city);
        } else if (status != null && !status.isEmpty()) {
            students = studentRepository.findByStatus(status);
        } else {
            students = studentRepository.findAll();
        }
        return ResponseEntity.ok(students);
    }

    // Get student by id with teaching sessions
    @GetMapping("/{id}")
    public ResponseEntity<?> getStudent(@PathVariable Long id) {
        Optional<Student> opt = studentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Student not found"));
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("student", opt.get());
        response.put("sessions", sessionRepository.findByStudentIdOrderBySessionDateDesc(id));
        return ResponseEntity.ok(response);
    }

    // Update student
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Student updateData) {
        Optional<Student> opt = studentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Student not found"));
        }
        Student existing = opt.get();
        if (updateData.getName() != null) existing.setName(updateData.getName());
        if (updateData.getAge() != null) existing.setAge(updateData.getAge());
        if (updateData.getSchool() != null) existing.setSchool(updateData.getSchool());
        if (updateData.getGrade() != null) existing.setGrade(updateData.getGrade());
        if (updateData.getGuardianName() != null) existing.setGuardianName(updateData.getGuardianName());
        if (updateData.getGuardianPhone() != null) existing.setGuardianPhone(updateData.getGuardianPhone());
        if (updateData.getCity() != null) existing.setCity(updateData.getCity());
        if (updateData.getBranchId() != null) existing.setBranchId(updateData.getBranchId());
        if (updateData.getAssignedVolunteerId() != null) existing.setAssignedVolunteerId(updateData.getAssignedVolunteerId());
        if (updateData.getStatus() != null) existing.setStatus(updateData.getStatus());
        if (updateData.getNotes() != null) existing.setNotes(updateData.getNotes());

        Student saved = studentRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    // Delete student
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        if (!studentRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Student not found"));
        }
        studentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Student deleted successfully"));
    }

    // --- TEACHING SESSIONS ---

    // Log a teaching session
    @PostMapping("/sessions")
    public ResponseEntity<?> logSession(@RequestBody TeachingSession session) {
        if (session.getVolunteerId() == null || session.getStudentId() == null || session.getSubject() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "volunteerId, studentId, and subject are required"));
        }
        if (session.getDurationMinutes() == null) session.setDurationMinutes(60);
        TeachingSession saved = sessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get sessions by volunteer
    @GetMapping("/sessions/volunteer/{volunteerId}")
    public ResponseEntity<?> getVolunteerSessions(@PathVariable Long volunteerId) {
        List<TeachingSession> sessions = sessionRepository.findByVolunteerIdOrderBySessionDateDesc(volunteerId);
        int totalMinutes = sessions.stream().mapToInt(TeachingSession::getDurationMinutes).sum();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessions", sessions);
        response.put("totalSessions", sessions.size());
        response.put("totalMinutes", totalMinutes);
        response.put("totalHours", Math.round(totalMinutes / 60.0 * 10) / 10.0);
        return ResponseEntity.ok(response);
    }

    // Get student summary stats
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalStudents", studentRepository.count());
        summary.put("activeStudents", studentRepository.countByStatus("active"));
        summary.put("totalSessions", sessionRepository.count());
        summary.put("totalTeachingMinutes", sessionRepository.findAll().stream()
                .mapToInt(TeachingSession::getDurationMinutes).sum());
        return ResponseEntity.ok(summary);
    }
}
