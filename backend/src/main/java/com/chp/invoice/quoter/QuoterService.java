package com.chp.invoice.quoter;

import com.chp.invoice.quoter.dto.QuoterRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuoterService {

    private final QuoterRepository repository;

    public QuoterService(QuoterRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Quoter> findAll() {
        return repository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Quoter findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new QuoterNotFoundException(id));
    }

    @Transactional
    public Quoter create(QuoterRequest req) {
        Quoter q = new Quoter();
        apply(q, req);
        return repository.save(q);
    }

    @Transactional
    public Quoter update(Long id, QuoterRequest req) {
        Quoter q = findById(id);
        apply(q, req);
        return repository.save(q);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new QuoterNotFoundException(id);
        }
        repository.deleteById(id);
    }

    private void apply(Quoter q, QuoterRequest req) {
        q.setName(req.name().trim());
        q.setTaxId(trimOrNull(req.taxId()));
        q.setAddress(trimOrNull(req.address()));
        q.setPhone(trimOrNull(req.phone()));
        q.setEmail(trimOrNull(req.email()));
    }

    private static String trimOrNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
