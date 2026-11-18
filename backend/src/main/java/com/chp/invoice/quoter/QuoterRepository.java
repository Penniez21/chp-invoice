package com.chp.invoice.quoter;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuoterRepository extends JpaRepository<Quoter, Long> {
    List<Quoter> findAllByOrderByNameAsc();

    // ผู้เสนอราคาที่มีโลโก้ ตามชื่อ + เลขภาษี — แยกเคสไม่มีเลขภาษี เพราะ "= null" ใน SQL ไม่เคยเป็นจริง
    Optional<Quoter> findFirstByNameAndTaxIdAndLogoIsNotNull(String name, String taxId);

    Optional<Quoter> findFirstByNameAndTaxIdIsNullAndLogoIsNotNull(String name);
}
