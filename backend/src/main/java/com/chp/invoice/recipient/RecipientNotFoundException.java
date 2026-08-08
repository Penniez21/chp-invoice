package com.chp.invoice.recipient;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class RecipientNotFoundException extends RuntimeException {
    public RecipientNotFoundException(Long id) {
        super("ไม่พบผู้รับ id=" + id);
    }
}
