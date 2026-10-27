package com.chp.invoice.receipt;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ReceiptNotFoundException extends RuntimeException {
    public ReceiptNotFoundException(Long id) {
        super("ไม่พบใบเสร็จรับเงิน id=" + id);
    }
}
