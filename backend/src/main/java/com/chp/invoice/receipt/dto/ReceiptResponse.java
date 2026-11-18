package com.chp.invoice.receipt.dto;

import com.chp.invoice.document.PaymentMethod;
import com.chp.invoice.quotation.VatMode;
import com.chp.invoice.receipt.Receipt;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** ข้อมูลใบเสร็จรับเงินที่ส่งกลับให้ frontend (รวมยอดที่คำนวณแล้ว) */
public record ReceiptResponse(
        Long id,
        String receiptNo,
        String poNo,
        String project,
        LocalDate issueDate,
        LocalDate dueDate,
        String issuerName,
        String issuerTaxId,
        String issuerBranch,
        String issuerAddress,
        String issuerEmail,
        String issuerPhone,
        String recipientName,
        String recipientTaxId,
        String recipientBranch,
        String recipientAddress,
        String recipientPhone,
        BigDecimal subTotal,
        VatMode vatMode,
        BigDecimal beforeVat,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal whtRate,
        BigDecimal whtAmount,
        BigDecimal netTotal,
        BigDecimal grandTotal,
        boolean taxInvoice,
        PaymentMethod paymentMethod,
        String chequeBank,
        String chequeBranch,
        String chequeNo,
        LocalDate chequeDate,
        LocalDateTime createdAt,
        List<Item> items
) {
    public record Item(
            String description,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal
    ) {
    }

    public static ReceiptResponse from(Receipt r) {
        List<Item> items = r.getItems().stream()
                .map(it -> new Item(it.getDescription(), it.getQuantity(), it.getUnitPrice(), it.getLineTotal()))
                .toList();
        return new ReceiptResponse(
                r.getId(), r.getReceiptNo(), r.getPoNo(), r.getProject(), r.getIssueDate(), r.getDueDate(),
                r.getIssuerName(), r.getIssuerTaxId(), r.getIssuerBranch(), r.getIssuerAddress(), r.getIssuerEmail(), r.getIssuerPhone(),
                r.getRecipientName(), r.getRecipientTaxId(), r.getRecipientBranch(), r.getRecipientAddress(), r.getRecipientPhone(),
                r.getSubTotal(), r.getVatMode(), r.getBeforeVat(), r.getVatRate(), r.getVatAmount(),
                r.getWhtRate(), r.getWhtAmount(), r.getNetTotal(), r.getGrandTotal(),
                r.isTaxInvoice(),
                r.getPaymentMethod(), r.getChequeBank(), r.getChequeBranch(), r.getChequeNo(), r.getChequeDate(),
                r.getCreatedAt(), items
        );
    }
}
