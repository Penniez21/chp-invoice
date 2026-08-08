package com.chp.invoice.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Health check ง่าย ๆ ไว้ยืนยันว่า backend รันอยู่ (Phase 1)
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "service", "chp-invoice-backend",
            "time", OffsetDateTime.now().toString()
        );
    }
}
