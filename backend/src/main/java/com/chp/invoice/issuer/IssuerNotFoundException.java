package com.chp.invoice.issuer;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class IssuerNotFoundException extends RuntimeException {
    public IssuerNotFoundException(Long id) {
        super("ไม่พบผู้ออก id=" + id);
    }
}
