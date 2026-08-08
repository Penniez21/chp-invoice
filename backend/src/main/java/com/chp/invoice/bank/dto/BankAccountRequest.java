package com.chp.invoice.bank.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BankAccountRequest(
        @NotBlank(message = "กรุณากรอกชื่อธนาคาร")
        @Size(max = 120, message = "ชื่อธนาคารยาวเกินไป")
        String bankName,

        @Size(max = 60, message = "ประเภทบัญชียาวเกินไป")
        String accountType,

        @NotBlank(message = "กรุณากรอกเลขที่บัญชี")
        @Size(max = 40, message = "เลขที่บัญชียาวเกินไป")
        String accountNo,

        @Size(max = 160, message = "ชื่อบัญชียาวเกินไป")
        String accountName,

        boolean showOnInvoice,

        Integer sortOrder
) {
}
