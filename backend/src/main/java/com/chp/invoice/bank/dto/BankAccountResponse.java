package com.chp.invoice.bank.dto;

import com.chp.invoice.bank.BankAccount;

public record BankAccountResponse(
        Long id,
        String bankName,
        String accountType,
        String accountNo,
        String accountName,
        boolean showOnInvoice,
        int sortOrder
) {
    public static BankAccountResponse from(BankAccount b) {
        return new BankAccountResponse(
                b.getId(),
                b.getBankName(),
                b.getAccountType(),
                b.getAccountNo(),
                b.getAccountName(),
                b.isShowOnInvoice(),
                b.getSortOrder());
    }
}
