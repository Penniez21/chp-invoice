package com.chp.invoice.auth;

/** ล็อกอินผิดถี่เกินกำหนด — ตอบ 429 พร้อมบอกเวลาที่ต้องรอ */
public class TooManyAttemptsException extends RuntimeException {

    private final long secondsLeft;

    public TooManyAttemptsException(long secondsLeft) {
        super("พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป");
        this.secondsLeft = secondsLeft;
    }

    public long getSecondsLeft() {
        return secondsLeft;
    }
}
