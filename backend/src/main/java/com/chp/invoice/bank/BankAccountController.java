package com.chp.invoice.bank;

import com.chp.invoice.bank.dto.BankAccountRequest;
import com.chp.invoice.bank.dto.BankAccountResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts")
public class BankAccountController {

    private final BankAccountService service;

    public BankAccountController(BankAccountService service) {
        this.service = service;
    }

    /** `?shown=true` = เอาเฉพาะบัญชีที่เลือกให้ขึ้นใบแจ้งหนี้ */
    @GetMapping
    public List<BankAccountResponse> list(@RequestParam(required = false, defaultValue = "false") boolean shown) {
        List<BankAccount> list = shown ? service.findShown() : service.findAll();
        return list.stream().map(BankAccountResponse::from).toList();
    }

    @GetMapping("/{id}")
    public BankAccountResponse get(@PathVariable Long id) {
        return BankAccountResponse.from(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<BankAccountResponse> create(@Valid @RequestBody BankAccountRequest req) {
        BankAccount saved = service.create(req);
        return ResponseEntity
                .created(URI.create("/api/bank-accounts/" + saved.getId()))
                .body(BankAccountResponse.from(saved));
    }

    @PutMapping("/{id}")
    public BankAccountResponse update(@PathVariable Long id, @Valid @RequestBody BankAccountRequest req) {
        return BankAccountResponse.from(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
