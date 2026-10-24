package com.chp.invoice.quoter;

import com.chp.invoice.quoter.dto.QuoterRequest;
import com.chp.invoice.quoter.dto.QuoterResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/quoters")
public class QuoterController {

    private final QuoterService service;

    public QuoterController(QuoterService service) {
        this.service = service;
    }

    @GetMapping
    public List<QuoterResponse> list() {
        return service.findAll().stream().map(QuoterResponse::from).toList();
    }

    @GetMapping("/{id}")
    public QuoterResponse get(@PathVariable Long id) {
        return QuoterResponse.from(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<QuoterResponse> create(@Valid @RequestBody QuoterRequest req) {
        Quoter saved = service.create(req);
        return ResponseEntity
                .created(URI.create("/api/quoters/" + saved.getId()))
                .body(QuoterResponse.from(saved));
    }

    @PutMapping("/{id}")
    public QuoterResponse update(@PathVariable Long id, @Valid @RequestBody QuoterRequest req) {
        return QuoterResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
