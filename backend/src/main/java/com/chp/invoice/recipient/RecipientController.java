package com.chp.invoice.recipient;

import com.chp.invoice.recipient.dto.RecipientRequest;
import com.chp.invoice.recipient.dto.RecipientResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/recipients")
public class RecipientController {

    private final RecipientService service;

    public RecipientController(RecipientService service) {
        this.service = service;
    }

    @GetMapping
    public List<RecipientResponse> list() {
        return service.findAll().stream().map(RecipientResponse::from).toList();
    }

    @GetMapping("/{id}")
    public RecipientResponse get(@PathVariable Long id) {
        return RecipientResponse.from(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<RecipientResponse> create(@Valid @RequestBody RecipientRequest req) {
        Recipient saved = service.create(req);
        return ResponseEntity
                .created(URI.create("/api/recipients/" + saved.getId()))
                .body(RecipientResponse.from(saved));
    }

    @PutMapping("/{id}")
    public RecipientResponse update(@PathVariable Long id, @Valid @RequestBody RecipientRequest req) {
        return RecipientResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
