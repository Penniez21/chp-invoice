package com.chp.invoice.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @Size(max = 30, message = "รหัสลูกค้ายาวเกินไป")
        String code,

        @NotBlank(message = "กรุณากรอกชื่อลูกค้า")
        @Size(max = 200, message = "ชื่อลูกค้ายาวเกินไป")
        String name,

        @Pattern(regexp = "^$|^\\d{13}$", message = "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")
        String taxId,

        String address,

        @Size(max = 200, message = "ชื่อผู้ติดต่อยาวเกินไป")
        String contactName,

        @Pattern(regexp = "^$|^\\d{10}$", message = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก")
        String phone,

        @Email(message = "อีเมลไม่ถูกต้อง")
        @Size(max = 120, message = "อีเมลยาวเกินไป")
        String email
) {
}
