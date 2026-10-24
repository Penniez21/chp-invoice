package com.chp.invoice.quotation.dto;

import com.chp.invoice.quotation.VatMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * ข้อมูลที่ frontend ส่งมาเพื่อสร้าง/แก้ไขใบเสนอราคา
 * (ยอดเงินทุกช่องคำนวณใหม่ฝั่งเซิร์ฟเวอร์เสมอ ไม่เชื่อค่าจาก client)
 */
public record QuotationRequest(
        @NotBlank(message = "กรุณากรอกเลขที่ใบเสนอราคา")
        @Size(max = 50, message = "เลขที่ใบเสนอราคายาวเกินไป")
        String quotationNo,

        @NotNull(message = "กรุณาระบุวันที่") LocalDate issueDate,

        @Size(max = 30, message = "เลขที่ลูกค้ายาวเกินไป") String customerNo,
        @Size(max = 255, message = "ชื่อโครงการยาวเกินไป") String project,
        @Size(max = 255, message = "สถานที่ยาวเกินไป") String location,

        @NotBlank(message = "กรุณากรอกชื่อผู้เสนอราคา (บริษัท / ร้าน / บุคคล)")
        @Size(max = 255, message = "ชื่อผู้เสนอราคายาวเกินไป")
        String sellerName,
        @Pattern(regexp = "^$|^\\d{13}$", message = "เลขประจำตัวผู้เสียภาษีผู้เสนอราคาต้องเป็นตัวเลข 13 หลัก")
        String sellerTaxId,
        String sellerAddress,
        @Size(max = 30, message = "เบอร์โทรผู้เสนอราคายาวเกินไป") String sellerPhone,
        @Email(message = "อีเมลผู้เสนอราคาไม่ถูกต้อง") @Size(max = 120) String sellerEmail,

        @NotBlank(message = "กรุณากรอกชื่อลูกค้า")
        @Size(max = 255, message = "ชื่อลูกค้ายาวเกินไป")
        String customerName,
        @Pattern(regexp = "^$|^\\d{13}$", message = "เลขประจำตัวผู้เสียภาษีลูกค้าต้องเป็นตัวเลข 13 หลัก")
        String customerTaxId,
        String customerAddress,
        @Size(max = 200, message = "ชื่อผู้ติดต่อยาวเกินไป") String customerAttn,
        @Size(max = 30, message = "เบอร์โทรลูกค้ายาวเกินไป") String customerPhone,
        @Email(message = "อีเมลลูกค้าไม่ถูกต้อง") @Size(max = 120) String customerEmail,

        String remark,

        @NotNull(message = "กรุณาเลือกวิธีคิดภาษีมูลค่าเพิ่ม") VatMode vatMode,

        @NotNull(message = "กรุณาระบุอัตราภาษีมูลค่าเพิ่ม")
        @DecimalMin(value = "0", message = "อัตราภาษีมูลค่าเพิ่มต้องไม่ติดลบ")
        @DecimalMax(value = "100", message = "อัตราภาษีมูลค่าเพิ่มต้องไม่เกิน 100%")
        BigDecimal vatRate,

        @NotEmpty(message = "กรุณาเพิ่มรายการอย่างน้อย 1 รายการ")
        @Valid List<Item> items
) {
    public record Item(
            @NotBlank(message = "กรุณากรอกรายการ")
            @Size(max = 500, message = "ชื่อรายการยาวเกินไป")
            String description,
            String details,
            @NotNull @PositiveOrZero(message = "ปริมาณต้องไม่ติดลบ") BigDecimal quantity,
            @Size(max = 30, message = "หน่วยยาวเกินไป") String unit,
            @NotNull @PositiveOrZero(message = "ราคาต่อหน่วยต้องไม่ติดลบ") BigDecimal unitPrice
    ) {
    }
}
