package com.chp.invoice.quotation;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    @EntityGraph(attributePaths = "items")
    List<Quotation> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "items")
    Optional<Quotation> findWithItemsById(Long id);

    // สำหรับออกเลขรันไม่ให้ซ้ำ — ดึงเฉพาะเลขที่มีอยู่แล้วมาคำนวณในหน่วยความจำ
    @Query("select q.quotationNo from Quotation q")
    List<String> findAllQuotationNos();
}
