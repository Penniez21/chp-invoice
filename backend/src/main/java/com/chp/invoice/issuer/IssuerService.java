package com.chp.invoice.issuer;

import com.chp.invoice.issuer.dto.IssuerRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IssuerService {

    private final IssuerRepository repository;

    public IssuerService(IssuerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Issuer> findAll() {
        return repository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Issuer findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new IssuerNotFoundException(id));
    }

    @Transactional
    public Issuer create(IssuerRequest req) {
        Issuer i = new Issuer();
        apply(i, req);
        return repository.save(i);
    }

    @Transactional
    public Issuer update(Long id, IssuerRequest req) {
        Issuer i = findById(id);
        apply(i, req);
        return repository.save(i);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IssuerNotFoundException(id);
        }
        repository.deleteById(id);
    }

    private void apply(Issuer i, IssuerRequest req) {
        i.setName(req.name().trim());
        i.setTaxId(trimOrNull(req.taxId()));
        i.setAddress(trimOrNull(req.address()));
        i.setEmail(trimOrNull(req.email()));
        i.setPhone(trimOrNull(req.phone()));
    }

    private static String trimOrNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
