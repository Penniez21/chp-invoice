package com.chp.invoice.quotation;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class QuotationNotFoundException extends RuntimeException {
    public QuotationNotFoundException(Long id) {
        super("ไม่พบใบเสนอราคา id=" + id);
    }
}
