package com.chp.invoice.quoter;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoterRepository extends JpaRepository<Quoter, Long> {
    List<Quoter> findAllByOrderByNameAsc();
}
