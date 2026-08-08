package com.chp.invoice.web;

import com.chp.invoice.auth.TooManyAttemptsException;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.Objects;

/**
 * รวมข้อผิดพลาดให้ตอบเป็น {"message": "..."} เสมอ
 * frontend จะได้หยิบข้อความไทยไปขึ้น toast ได้ตรง ๆ
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse("ข้อมูลไม่ถูกต้อง");
        return ResponseEntity.badRequest().body(Map.of("message", message));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    /** ล็อกอินผิดถี่เกินไป — 429 พร้อมบอกเวลาที่ต้องรอ และใส่ Retry-After ตามมาตรฐาน HTTP */
    @ExceptionHandler(TooManyAttemptsException.class)
    public ResponseEntity<Map<String, String>> handleTooManyAttempts(TooManyAttemptsException ex) {
        long minutes = (ex.getSecondsLeft() + 59) / 60;
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getSecondsLeft()))
                .body(Map.of("message",
                        "พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารออีก " + minutes + " นาทีแล้วลองใหม่"));
    }
}
