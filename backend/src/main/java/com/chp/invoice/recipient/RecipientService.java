package com.chp.invoice.recipient;

import com.chp.invoice.recipient.dto.RecipientRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RecipientService {

    private final RecipientRepository repository;

    public RecipientService(RecipientRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Recipient> findAll() {
        return repository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Recipient findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new RecipientNotFoundException(id));
    }

    @Transactional
    public Recipient create(RecipientRequest req) {
        Recipient r = new Recipient();
        apply(r, req);
        return repository.save(r);
    }

    @Transactional
    public Recipient update(Long id, RecipientRequest req) {
        Recipient r = findById(id);
        apply(r, req);
        return repository.save(r);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RecipientNotFoundException(id);
        }
        repository.deleteById(id);
    }

    private void apply(Recipient r, RecipientRequest req) {
        r.setName(req.name().trim());
        r.setTaxId(trimOrNull(req.taxId()));
        r.setAddress(trimOrNull(req.address()));
        r.setPhone(trimOrNull(req.phone()));
    }

    private static String trimOrNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
