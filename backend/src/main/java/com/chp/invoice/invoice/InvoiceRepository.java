package com.chp.invoice.invoice;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @EntityGraph(attributePaths = "items")
    List<Invoice> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "items")
    Optional<Invoice> findWithItemsById(Long id);

    // สำหรับออกเลขรันไม่ให้ซ้ำ — ดึงเฉพาะเลขที่มีอยู่แล้วมาคำนวณในหน่วยความจำ
    @Query("select i.invoiceNo from Invoice i")
    List<String> findAllInvoiceNos();

    @Query("select i.poNo from Invoice i where i.poNo is not null")
    List<String> findAllPoNos();
}
