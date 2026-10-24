package com.chp.invoice.quotation.dto;

import com.chp.invoice.quotation.Quotation;
import com.chp.invoice.quotation.VatMode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** ข้อมูลใบเสนอราคาที่ส่งกลับให้ frontend (รวมยอดที่คำนวณแล้ว) */
public record QuotationResponse(
        Long id,
        String quotationNo,
        LocalDate issueDate,
        String customerNo,
        String project,
        String location,
        String sellerName,
        String sellerTaxId,
        String sellerAddress,
        String sellerPhone,
        String sellerEmail,
        String customerName,
        String customerTaxId,
        String customerAddress,
        String customerAttn,
        String customerPhone,
        String customerEmail,
        String remark,
        VatMode vatMode,
        BigDecimal vatRate,
        BigDecimal itemsTotal,
        BigDecimal beforeVat,
        BigDecimal vatAmount,
        BigDecimal grandTotal,
        LocalDateTime createdAt,
        List<Item> items
) {
    public record Item(
            String description,
            String details,
            BigDecimal quantity,
            String unit,
            BigDecimal unitPrice,
            BigDecimal lineTotal
    ) {
    }

    public static QuotationResponse from(Quotation q) {
        List<Item> items = q.getItems().stream()
                .map(it -> new Item(it.getDescription(), it.getDetails(), it.getQuantity(), it.getUnit(),
                        it.getUnitPrice(), it.getLineTotal()))
                .toList();
        return new QuotationResponse(
                q.getId(), q.getQuotationNo(), q.getIssueDate(), q.getCustomerNo(), q.getProject(), q.getLocation(),
                q.getSellerName(), q.getSellerTaxId(), q.getSellerAddress(), q.getSellerPhone(), q.getSellerEmail(),
                q.getCustomerName(), q.getCustomerTaxId(), q.getCustomerAddress(), q.getCustomerAttn(),
                q.getCustomerPhone(), q.getCustomerEmail(),
                q.getRemark(),
                q.getVatMode(), q.getVatRate(), q.getItemsTotal(), q.getBeforeVat(), q.getVatAmount(), q.getGrandTotal(),
                q.getCreatedAt(), items
        );
    }
}
