package com.chp.invoice.invoice.dto;

import com.chp.invoice.invoice.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** ข้อมูลใบแจ้งหนี้ที่ส่งกลับให้ frontend (รวมยอดที่คำนวณแล้ว) */
public record InvoiceResponse(
        Long id,
        String invoiceNo,
        String poNo,
        LocalDate issueDate,
        LocalDate dueDate,
        String issuerName,
        String issuerTaxId,
        String issuerAddress,
        String issuerEmail,
        String issuerPhone,
        String recipientName,
        String recipientTaxId,
        String recipientAddress,
        String recipientPhone,
        BigDecimal subTotal,
        BigDecimal whtRate,
        BigDecimal whtAmount,
        BigDecimal netTotal,
        BigDecimal grandTotal,
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

    public static InvoiceResponse from(Invoice inv) {
        List<Item> items = inv.getItems().stream()
                .map(it -> new Item(it.getDescription(), it.getQuantity(), it.getUnitPrice(), it.getLineTotal()))
                .toList();
        return new InvoiceResponse(
                inv.getId(), inv.getInvoiceNo(), inv.getPoNo(), inv.getIssueDate(), inv.getDueDate(),
                inv.getIssuerName(), inv.getIssuerTaxId(), inv.getIssuerAddress(), inv.getIssuerEmail(), inv.getIssuerPhone(),
                inv.getRecipientName(), inv.getRecipientTaxId(), inv.getRecipientAddress(), inv.getRecipientPhone(),
                inv.getSubTotal(), inv.getWhtRate(), inv.getWhtAmount(), inv.getNetTotal(), inv.getGrandTotal(),
                inv.getCreatedAt(), items
        );
    }
}
