package com.chp.invoice.invoice;

import com.chp.invoice.invoice.dto.InvoiceRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class InvoiceService {

    private static final int MONEY_SCALE = 2;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final InvoiceRepository repository;

    public InvoiceService(InvoiceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Invoice> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Invoice findById(Long id) {
        return repository.findWithItemsById(id)
                .orElseThrow(() -> new InvoiceNotFoundException(id));
    }

    @Transactional
    public Invoice create(InvoiceRequest req) {
        Invoice inv = new Invoice();
        apply(inv, req);
        return repository.save(inv);
    }

    @Transactional
    public Invoice update(Long id, InvoiceRequest req) {
        Invoice inv = findById(id);
        inv.getItems().clear();
        apply(inv, req);
        return repository.save(inv);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new InvoiceNotFoundException(id);
        }
        repository.deleteById(id);
    }

    /** เขียนข้อมูลจาก request ลง entity + คำนวณยอดใหม่ทั้งหมดฝั่งเซิร์ฟเวอร์ */
    private void apply(Invoice inv, InvoiceRequest req) {
        inv.setInvoiceNo(req.invoiceNo());
        inv.setPoNo(req.poNo());
        inv.setIssueDate(req.issueDate());
        inv.setDueDate(req.dueDate());

        inv.setIssuerName(req.issuerName());
        inv.setIssuerTaxId(req.issuerTaxId());
        inv.setIssuerAddress(req.issuerAddress());
        inv.setIssuerEmail(req.issuerEmail());
        inv.setIssuerPhone(req.issuerPhone());

        inv.setRecipientName(req.recipientName());
        inv.setRecipientTaxId(req.recipientTaxId());
        inv.setRecipientAddress(req.recipientAddress());
        inv.setRecipientPhone(req.recipientPhone());

        BigDecimal subTotal = BigDecimal.ZERO;
        int order = 0;
        for (InvoiceRequest.Item itemReq : req.items()) {
            BigDecimal qty = nz(itemReq.quantity());
            BigDecimal unit = nz(itemReq.unitPrice());
            BigDecimal lineTotal = qty.multiply(unit).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            InvoiceItem item = new InvoiceItem();
            item.setDescription(itemReq.description());
            item.setQuantity(qty);
            item.setUnitPrice(unit);
            item.setLineTotal(lineTotal);
            item.setSortOrder(order++);
            inv.addItem(item);

            subTotal = subTotal.add(lineTotal);
        }
        subTotal = subTotal.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal whtRate = nz(req.whtRate());
        BigDecimal whtAmount = subTotal.multiply(whtRate)
                .divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal netTotal = subTotal.subtract(whtAmount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        inv.setSubTotal(subTotal);
        inv.setWhtRate(whtRate);
        inv.setWhtAmount(whtAmount);
        inv.setNetTotal(netTotal);
        inv.setGrandTotal(subTotal); // ไม่มี VAT — ยอดรวมทั้งหมด = ยอดรวมย่อย
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
