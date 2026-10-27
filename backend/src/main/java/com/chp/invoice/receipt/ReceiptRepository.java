package com.chp.invoice.receipt;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {

    @EntityGraph(attributePaths = "items")
    List<Receipt> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "items")
    Optional<Receipt> findWithItemsById(Long id);

    // สำหรับออกเลขรันไม่ให้ซ้ำ — ดึงเฉพาะเลขที่มีอยู่แล้วมาคำนวณในหน่วยความจำ
    @Query("select r.receiptNo from Receipt r")
    List<String> findAllReceiptNos();

    @Query("select r.poNo from Receipt r where r.poNo is not null")
    List<String> findAllPoNos();
}
