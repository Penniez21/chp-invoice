package com.chp.invoice.receipt.dto;

import com.chp.invoice.document.PaymentMethod;
import com.chp.invoice.quotation.VatMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * ข้อมูลที่ frontend ส่งมาเพื่อสร้าง/แก้ไขใบเสร็จรับเงิน — ช่องเดียวกับใบแจ้งหนี้
 * (ยอดรวมต่าง ๆ คำนวณใหม่ฝั่งเซิร์ฟเวอร์เสมอ ไม่เชื่อค่าจาก client)
 */
public record ReceiptRequest(
        @NotBlank(message = "กรุณากรอกเลขที่ใบเสร็จรับเงิน") String receiptNo,
        String poNo,
        @Size(max = 255, message = "ชื่อโครงการยาวเกินไป") String project,
        @NotNull(message = "กรุณาระบุวันที่") LocalDate issueDate,
        LocalDate dueDate,

        @NotBlank(message = "กรุณากรอกชื่อผู้ออก") String issuerName,
        String issuerTaxId,
        @Pattern(regexp = "^$|^\\d{5}$", message = "รหัสสาขาผู้ออกต้องเป็นตัวเลข 5 หลัก (สำนักงานใหญ่ = 00000)")
        String issuerBranch,
        String issuerAddress,
        String issuerEmail,
        String issuerPhone,

        @NotBlank(message = "กรุณากรอกชื่อผู้รับ") String recipientName,
        String recipientTaxId,
        @Pattern(regexp = "^$|^\\d{5}$", message = "รหัสสาขาผู้รับต้องเป็นตัวเลข 5 หลัก (สำนักงานใหญ่ = 00000)")
        String recipientBranch,
        String recipientAddress,
        String recipientPhone,

        @NotNull(message = "กรุณาระบุอัตราภาษีหัก ณ ที่จ่าย") BigDecimal whtRate,

        // VAT 3 แบบเหมือนใบเสนอราคา — ไม่ส่งมา = ราคารวม VAT 7% (แบบเดียวที่มีก่อนเพิ่มตัวเลือกนี้)
        VatMode vatMode,
        @DecimalMin(value = "0", message = "อัตราภาษีมูลค่าเพิ่มต้องไม่ติดลบ")
        @DecimalMax(value = "100", message = "อัตราภาษีมูลค่าเพิ่มต้องไม่เกิน 100%")
        BigDecimal vatRate,

        // ออกเป็น "ใบเสร็จรับเงิน/ใบกำกับภาษี" — ไม่มี VAT ออกใบกำกับภาษีไม่ได้ (service บังคับเป็น false)
        Boolean taxInvoice,

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
