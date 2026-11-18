package com.chp.invoice.issuer.dto;

import com.chp.invoice.issuer.Issuer;

public record IssuerResponse(
        Long id,
        String name,
        String taxId,
        String branch,
        String address,
        String email,
        String phone
) {
    public static IssuerResponse from(Issuer i) {
        return new IssuerResponse(
                i.getId(),
                i.getName(),
                i.getTaxId(),
                i.getBranch(),
                i.getAddress(),
                i.getEmail(),
                i.getPhone());
    }
}
