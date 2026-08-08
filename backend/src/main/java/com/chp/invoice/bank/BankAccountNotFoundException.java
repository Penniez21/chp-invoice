package com.chp.invoice.bank;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class BankAccountNotFoundException extends RuntimeException {
    public BankAccountNotFoundException(Long id) {
        super("ไม่พบบัญชีธนาคาร id=" + id);
    }
}
