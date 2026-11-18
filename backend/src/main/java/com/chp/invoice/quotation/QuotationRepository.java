package com.chp.invoice.quotation;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /**
     * ใส่โลโก้ให้ใบเสนอราคาเดิมของผู้เสนอราคารายนี้ ที่ยังไม่มีโลโก้ (เทียบชื่อ + เลขภาษี)
     * ใบที่มีโลโก้ของตัวเองอยู่แล้วไม่ถูกแตะ · แยกเคสไม่มีเลขภาษี เพราะ "= null" ใน SQL ไม่เคยเป็นจริง
     */
    @Modifying
    @Query("update Quotation q set q.sellerLogo = :logo"
            + " where q.sellerLogo is null and q.sellerName = :name and q.sellerTaxId = :taxId")
    int fillMissingSellerLogo(@Param("name") String name, @Param("taxId") String taxId, @Param("logo") String logo);

    @Modifying
    @Query("update Quotation q set q.sellerLogo = :logo"
            + " where q.sellerLogo is null and q.sellerName = :name and q.sellerTaxId is null")
    int fillMissingSellerLogoWithoutTaxId(@Param("name") String name, @Param("logo") String logo);
}
