package com.chp.invoice.quoter;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class QuoterNotFoundException extends RuntimeException {
    public QuoterNotFoundException(Long id) {
        super("ไม่พบผู้เสนอราคา id=" + id);
    }
}
