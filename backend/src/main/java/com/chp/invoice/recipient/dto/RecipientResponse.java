package com.chp.invoice.recipient.dto;

import com.chp.invoice.recipient.Recipient;

public record RecipientResponse(
        Long id,
        String name,
        String taxId,
        String address,
        String phone
) {
    public static RecipientResponse from(Recipient r) {
        return new RecipientResponse(
                r.getId(),
                r.getName(),
                r.getTaxId(),
                r.getAddress(),
                r.getPhone());
    }
}
