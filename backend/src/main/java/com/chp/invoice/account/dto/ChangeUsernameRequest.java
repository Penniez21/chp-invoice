package com.chp.invoice.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangeUsernameRequest(
        @NotBlank(message = "กรุณากรอกรหัสผ่านปัจจุบัน")
        String currentPassword,

        @NotBlank(message = "กรุณากรอกชื่อผู้ใช้ใหม่")
        @Size(min = 3, max = 50, message = "ชื่อผู้ใช้ต้องยาว 3–50 ตัวอักษร")
        @Pattern(regexp = "^[A-Za-z0-9._-]+$",
                 message = "ชื่อผู้ใช้ใช้ได้เฉพาะ a-z A-Z 0-9 และ . _ - เท่านั้น")
        String newUsername
) {
}
