package com.chp.invoice.invoice;

import com.chp.invoice.invoice.dto.InvoiceRequest;
import com.chp.invoice.invoice.dto.NextNumbersResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    /**
     * ออกเลขรันถัดไปของ "เลขที่ใบแจ้งหนี้" และ "หมายเลขสั่งซื้อ" แบบไม่ซ้ำกับที่มีในฐานข้อมูล
     * เริ่มจาก (เลขมากสุดที่มีอยู่ + 1) แล้วข้ามหมายเลขที่มีอยู่แล้วไปจนกว่าจะเจอเลขว่าง
     * รูปแบบ: เลข 3 หลักเติมศูนย์หน้า (001, 002, ...)
     */
    @Transactional(readOnly = true)
    public NextNumbersResponse nextNumbers() {
        return new NextNumbersResponse(
                nextRunning(repository.findAllInvoiceNos()),
                nextRunning(repository.findAllPoNos()));
    }

    private static String nextRunning(List<String> existing) {
        Set<String> used = new HashSet<>();
        long max = 0;
        for (String s : existing) {
            if (s == null) continue;
            String t = s.trim();
            if (t.isEmpty()) continue;
            used.add(t);
            if (t.matches("\\d{1,18}")) {
                try {
                    max = Math.max(max, Long.parseLong(t));
                } catch (NumberFormatException ignored) {
                    // เลขยาวเกิน long — ข้ามไป ไม่เอามาคิดค่า max
                }
            }
        }
        long n = max + 1;
        // ข้ามเลขที่มีอยู่แล้ว (ทั้งแบบเติมศูนย์และไม่เติม) จนเจอเลขที่ยังไม่ถูกใช้
        while (used.contains(fmt(n)) || used.contains(String.valueOf(n))) {
            n++;
        }
        return fmt(n);
    }

    private static String fmt(long n) {
        return String.format("%03d", n);
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
