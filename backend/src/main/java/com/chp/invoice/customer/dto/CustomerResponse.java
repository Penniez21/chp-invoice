package com.chp.invoice.customer.dto;

import com.chp.invoice.customer.Customer;

public record CustomerResponse(
        Long id,
        String code,
        String name,
        String taxId,
        String address,
        String contactName,
        String phone,
        String email
) {
    public static CustomerResponse from(Customer c) {
        return new CustomerResponse(
                c.getId(),
                c.getCode(),
                c.getName(),
                c.getTaxId(),
                c.getAddress(),
                c.getContactName(),
                c.getPhone(),
                c.getEmail());
    }
}
