package com.chp.invoice.receipt.dto;

/** เลขรันถัดไปที่ยังไม่ซ้ำในตารางใบเสร็จ สำหรับเติมให้หน้าสร้างใบเสร็จรับเงินอัตโนมัติ */
public record ReceiptNextNumbersResponse(
        String receiptNo,
        String poNo
) {
}
