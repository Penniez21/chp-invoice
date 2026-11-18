package com.chp.invoice.quoter.dto;

import com.chp.invoice.web.ImageDataUrl;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record QuoterRequest(
        @NotBlank(message = "กรุณากรอกชื่อบริษัท / ร้าน / บุคคล")
        @Size(max = 200, message = "ชื่อผู้เสนอราคายาวเกินไป")
        String name,

        @Pattern(regexp = "^$|^\\d{13}$", message = "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")
        String taxId,

        String address,

        @Pattern(regexp = "^$|^\\d{10}$", message = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก")
        String phone,

        @Email(message = "อีเมลไม่ถูกต้อง")
        @Size(max = 120, message = "อีเมลยาวเกินไป")
        String email,

        @ImageDataUrl
        String logo,

        @Size(max = 200, message = "ชื่อผู้เสนอราคา (บุคคล) ยาวเกินไป")
        String contactName,

        @Pattern(regexp = "^$|^\\d{10}$", message = "เบอร์โทรผู้เสนอราคา (บุคคล) ต้องเป็นตัวเลข 10 หลัก")
        String contactPhone,

        @Email(message = "อีเมลผู้เสนอราคา (บุคคล) ไม่ถูกต้อง")
        @Size(max = 120, message = "อีเมลผู้เสนอราคา (บุคคล) ยาวเกินไป")
        String contactEmail
) {
}
