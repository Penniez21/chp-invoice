package com.chp.invoice.quotation;

import com.chp.invoice.quotation.dto.NextQuotationNoResponse;
import com.chp.invoice.quotation.dto.QuotationRequest;
import com.chp.invoice.quotation.dto.QuotationResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/quotations")
public class QuotationController {

    private final QuotationService service;

    public QuotationController(QuotationService service) {
        this.service = service;
    }

    @GetMapping
    public List<QuotationResponse> list() {
        return service.findAll().stream().map(QuotationResponse::from).toList();
    }

    /** เลขที่ถัดไปที่ยังไม่ซ้ำ — ใช้เติมหน้าสร้างใบเสนอราคาอัตโนมัติ (ต้องมาก่อน /{id}) */
    @GetMapping("/next-number")
    public NextQuotationNoResponse nextNumber() {
        return service.nextQuotationNo();
    }

    @GetMapping("/{id}")
    public QuotationResponse get(@PathVariable Long id) {
        return QuotationResponse.from(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<QuotationResponse> create(@Valid @RequestBody QuotationRequest req) {
        Quotation saved = service.create(req);
        return ResponseEntity
                .created(URI.create("/api/quotations/" + saved.getId()))
                .body(QuotationResponse.from(saved));
    }

    @PutMapping("/{id}")
    public QuotationResponse update(@PathVariable Long id, @Valid @RequestBody QuotationRequest req) {
        return QuotationResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
