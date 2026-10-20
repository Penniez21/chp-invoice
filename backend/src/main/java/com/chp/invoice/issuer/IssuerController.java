package com.chp.invoice.issuer;

import com.chp.invoice.issuer.dto.IssuerRequest;
import com.chp.invoice.issuer.dto.IssuerResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/issuers")
public class IssuerController {

    private final IssuerService service;

    public IssuerController(IssuerService service) {
        this.service = service;
    }

    @GetMapping
    public List<IssuerResponse> list() {
        return service.findAll().stream().map(IssuerResponse::from).toList();
    }

    @GetMapping("/{id}")
    public IssuerResponse get(@PathVariable Long id) {
        return IssuerResponse.from(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<IssuerResponse> create(@Valid @RequestBody IssuerRequest req) {
        Issuer saved = service.create(req);
        return ResponseEntity
                .created(URI.create("/api/issuers/" + saved.getId()))
                .body(IssuerResponse.from(saved));
    }

    @PutMapping("/{id}")
    public IssuerResponse update(@PathVariable Long id, @Valid @RequestBody IssuerRequest req) {
        return IssuerResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
