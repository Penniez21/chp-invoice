package com.chp.invoice.customer;

import com.chp.invoice.customer.dto.CustomerRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Customer> findAll() {
        return repository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Customer findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new CustomerNotFoundException(id));
    }

    @Transactional
    public Customer create(CustomerRequest req) {
        Customer c = new Customer();
        apply(c, req);
        return repository.save(c);
    }

    @Transactional
    public Customer update(Long id, CustomerRequest req) {
        Customer c = findById(id);
        apply(c, req);
        return repository.save(c);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new CustomerNotFoundException(id);
        }
        repository.deleteById(id);
    }

    private void apply(Customer c, CustomerRequest req) {
        c.setCode(trimOrNull(req.code()));
        c.setName(req.name().trim());
        c.setTaxId(trimOrNull(req.taxId()));
        c.setAddress(trimOrNull(req.address()));
        c.setContactName(trimOrNull(req.contactName()));
        c.setPhone(trimOrNull(req.phone()));
        c.setEmail(trimOrNull(req.email()));
    }

    private static String trimOrNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
