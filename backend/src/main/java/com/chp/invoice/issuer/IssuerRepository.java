package com.chp.invoice.issuer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssuerRepository extends JpaRepository<Issuer, Long> {
    List<Issuer> findAllByOrderByNameAsc();
}
