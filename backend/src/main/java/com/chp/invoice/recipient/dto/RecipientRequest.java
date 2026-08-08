package com.chp.invoice.recipient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RecipientRequest(
        @NotBlank(message = "กรุณากรอกชื่อผู้รับ")
        @Size(max = 200, message = "ชื่อผู้รับยาวเกินไป")
        String name,

        @Pattern(regexp = "^$|^\\d{13}$", message = "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก")
        String taxId,

        String address,

        @Pattern(regexp = "^$|^\\d{10}$", message = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก")
        String phone
) {
}
