package com.chp.invoice.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

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
