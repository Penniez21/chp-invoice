package com.chp.invoice.receipt.dto;

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

    public static ReceiptResponse from(Receipt r) {
        List<Item> items = r.getItems().stream()
                .map(it -> new Item(it.getDescription(), it.getQuantity(), it.getUnitPrice(), it.getLineTotal()))
                .toList();
        return new ReceiptResponse(
                r.getId(), r.getReceiptNo(), r.getPoNo(), r.getIssueDate(), r.getDueDate(),
                r.getIssuerName(), r.getIssuerTaxId(), r.getIssuerAddress(), r.getIssuerEmail(), r.getIssuerPhone(),
                r.getRecipientName(), r.getRecipientTaxId(), r.getRecipientAddress(), r.getRecipientPhone(),
                r.getSubTotal(), r.getWhtRate(), r.getWhtAmount(), r.getNetTotal(), r.getGrandTotal(),
                r.getCreatedAt(), items
        );
    }
}
