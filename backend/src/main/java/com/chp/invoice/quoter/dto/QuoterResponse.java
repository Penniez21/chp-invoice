package com.chp.invoice.quoter.dto;

import com.chp.invoice.quoter.Quoter;

public record QuoterResponse(
        Long id,
        String name,
        String taxId,
        String address,
        String phone,
        String email
) {
    public static QuoterResponse from(Quoter q) {
        return new QuoterResponse(
                q.getId(),
                q.getName(),
                q.getTaxId(),
                q.getAddress(),
                q.getPhone(),
                q.getEmail());
    }
}
