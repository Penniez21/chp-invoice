package com.chp.invoice.invoice;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @EntityGraph(attributePaths = "items")
    List<Invoice> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "items")
    Optional<Invoice> findWithItemsById(Long id);
}
