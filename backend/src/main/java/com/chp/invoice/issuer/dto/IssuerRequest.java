package com.chp.invoice.issuer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record IssuerRequest(
        @NotBlank(message = "กรุณากรอกชื่อผู้ออก")
        @Size(max = 200, message = "ชื่อผู้ออกยาวเกินไป")
        String name,

        @Pattern(regexp = "^$|^\\d{13}$", message = "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")
        String taxId,

        String address,

        @Email(message = "อีเมลไม่ถูกต้อง")
        @Size(max = 120, message = "อีเมลยาวเกินไป")
        String email,

        @Pattern(regexp = "^$|^\\d{10}$", message = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก")
        String phone
) {
}
