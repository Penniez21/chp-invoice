package com.chp.invoice.web;

/** ข้อมูลที่ส่งมาไม่ผ่านกฎทางธุรกิจ — ตอบ 400 พร้อมข้อความภาษาไทยให้ frontend แสดงได้เลย */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
