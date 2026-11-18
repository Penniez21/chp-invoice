package com.chp.invoice.invoice.dto;

import com.chp.invoice.document.PaymentMethod;
import com.chp.invoice.quotation.VatMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * ข้อมูลที่ frontend ส่งมาเพื่อสร้าง/แก้ไขใบแจ้งหนี้
 * (ยอดรวมต่าง ๆ คำนวณใหม่ฝั่งเซิร์ฟเวอร์เสมอ ไม่เชื่อค่าจาก client)
 */
public record InvoiceRequest(
        @NotBlank(message = "กรุณากรอกเลขที่ใบแจ้งหนี้") String invoiceNo,
        String poNo,
        @Size(max = 255, message = "ชื่อโครงการยาวเกินไป") String project,
        @NotNull(message = "กรุณาระบุวันที่") LocalDate issueDate,
        LocalDate dueDate,

        @NotBlank(message = "กรุณากรอกชื่อผู้ออก") String issuerName,
        String issuerTaxId,
        String issuerAddress,
        String issuerEmail,
        String issuerPhone,

        @NotBlank(message = "กรุณากรอกชื่อผู้รับ") String recipientName,
        String recipientTaxId,
        String recipientAddress,
        String recipientPhone,

        @NotNull(message = "กรุณาระบุอัตราภาษีหัก ณ ที่จ่าย") BigDecimal whtRate,

        // VAT 3 แบบเหมือนใบเสนอราคา — ไม่ส่งมา = ราคารวม VAT 7% (แบบเดียวที่มีก่อนเพิ่มตัวเลือกนี้)
        VatMode vatMode,
        @DecimalMin(value = "0", message = "อัตราภาษีมูลค่าเพิ่มต้องไม่ติดลบ")
        @DecimalMax(value = "100", message = "อัตราภาษีมูลค่าเพิ่มต้องไม่เกิน 100%")
        BigDecimal vatRate,

        // ช่องทางการชำระ (ไม่บังคับ) — รายละเอียดเช็คเก็บเฉพาะเมื่อเลือกเช็ค
        PaymentMethod paymentMethod,
        @Size(max = 100, message = "ชื่อธนาคารยาวเกินไป") String chequeBank,
        @Size(max = 100, message = "ชื่อสาขาธนาคารยาวเกินไป") String chequeBranch,
        @Size(max = 50, message = "เลขที่เช็คยาวเกินไป") String chequeNo,
        LocalDate chequeDate,

        @NotEmpty(message = "กรุณาเพิ่มรายการอย่างน้อย 1 รายการ")
        @Valid List<Item> items
) {
    public record Item(
            @NotBlank(message = "กรุณากรอกคำอธิบาย") String description,
            @NotNull BigDecimal quantity,
            @NotNull BigDecimal unitPrice
    ) {
    }
}
