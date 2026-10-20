package com.chp.invoice.invoice.dto;

/** เลขรันถัดไปที่ยังไม่ซ้ำในฐานข้อมูล สำหรับเติมให้หน้าสร้างใบแจ้งหนี้อัตโนมัติ */
public record NextNumbersResponse(
        String invoiceNo,
        String poNo
) {
}
