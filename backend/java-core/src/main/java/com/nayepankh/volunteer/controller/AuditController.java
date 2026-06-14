package com.nayepankh.volunteer.controller;

import com.nayepankh.volunteer.model.AuditLog;
import com.nayepankh.volunteer.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/audit")
public class AuditController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    // Log an action
    @PostMapping
    public ResponseEntity<?> logAction(@RequestBody AuditLog auditLog) {
        AuditLog saved = auditLogRepository.save(auditLog);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Get recent audit logs
    @GetMapping
    public ResponseEntity<List<AuditLog>> getRecentLogs() {
        return ResponseEntity.ok(auditLogRepository.findTop50ByOrderByCreatedAtDesc());
    }

    // Get logs for specific entity
    @GetMapping("/entity/{entity}/{id}")
    public ResponseEntity<List<AuditLog>> getEntityLogs(@PathVariable String entity, @PathVariable Long id) {
        return ResponseEntity.ok(auditLogRepository.findByTargetEntityAndTargetIdOrderByCreatedAtDesc(entity, id));
    }
}
