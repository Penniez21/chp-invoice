package com.chp.invoice.receipt;

import com.chp.invoice.receipt.dto.ReceiptNextNumbersResponse;
import com.chp.invoice.receipt.dto.ReceiptRequest;
import com.chp.invoice.receipt.dto.ReceiptResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/receipts")
public class ReceiptController {

    private final ReceiptService service;

    public ReceiptController(ReceiptService service) {
        this.service = service;
    }

    @GetMapping
    public List<ReceiptResponse> list() {
        return service.findAll().stream().map(ReceiptResponse::from).toList();
    }

    /** เลขรันถัดไปที่ยังไม่ซ้ำ — ใช้เติมหน้าสร้างใบเสร็จรับเงินอัตโนมัติ (ต้องมาก่อน /{id}) */
    @GetMapping("/next-numbers")
    public ReceiptNextNumbersResponse nextNumbers() {
        return service.nextNumbers();
    }

    @GetMapping("/{id}")
    public ReceiptResponse get(@PathVariable Long id) {
        return ReceiptResponse.from(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<ReceiptResponse> create(@Valid @RequestBody ReceiptRequest req) {
        Receipt saved = service.create(req);
        return ResponseEntity
                .created(URI.create("/api/receipts/" + saved.getId()))
                .body(ReceiptResponse.from(saved));
    }

    @PutMapping("/{id}")
    public ReceiptResponse update(@PathVariable Long id, @Valid @RequestBody ReceiptRequest req) {
        return ReceiptResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
