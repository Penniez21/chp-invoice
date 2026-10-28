package com.chp.invoice.receipt;

import com.chp.invoice.receipt.dto.ReceiptNextNumbersResponse;
import com.chp.invoice.receipt.dto.ReceiptRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** ใบเสร็จรับเงิน — การคำนวณยอดเหมือน InvoiceService ทุกอย่าง ต่างกันแค่รูปแบบเลขที่ (PS-032, …) */
@Service
public class ReceiptService {

    private static final int MONEY_SCALE = 2;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    /** รูปแบบเลขที่ใบเสร็จ: PS- + เลขรัน 3 หลัก (PS-032, PS-033, …) */
    private static final String RECEIPT_PREFIX = "PS-";
    private static final Pattern RECEIPT_RUNNING = Pattern.compile("^PS-(\\d{1,18})$", Pattern.CASE_INSENSITIVE);

    /**
     * ระบบเดิมออกใบเสร็จไปถึง PS-031 แล้ว ใบแรกในระบบนี้จึงเริ่มที่ PS-032
     * (ค่านี้คือ "เลขสุดท้ายที่ใช้ไปแล้ว" ไม่ใช่เลขเริ่ม)
     */
    private static final long LAST_RECEIPT_NO_IN_OLD_SYSTEM = 31;

    private final ReceiptRepository repository;

    public ReceiptService(ReceiptRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Receipt> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Receipt findById(Long id) {
        return repository.findWithItemsById(id)
                .orElseThrow(() -> new ReceiptNotFoundException(id));
    }

    /**
     * เลขรันถัดไปที่ยังไม่ซ้ำในตารางใบเสร็จ (รันแยกจากใบแจ้งหนี้)
     * - เลขที่ใบเสร็จรับเงิน: PS- + เลขรัน 3 หลัก — ดู nextReceiptNo
     * - หมายเลขสั่งซื้อ: เลข 3 หลักเติมศูนย์หน้า (001, 002, ...) เหมือนใบแจ้งหนี้
     */
    @Transactional(readOnly = true)
    public ReceiptNextNumbersResponse nextNumbers() {
        return new ReceiptNextNumbersResponse(
                nextReceiptNo(repository.findAllReceiptNos()),
                nextRunning(repository.findAllPoNos()));
    }

    /**
     * PS- + (เลขรันมากสุดที่มีอยู่ + 1) เติมศูนย์ให้ครบ 3 หลัก แต่ไม่ต่ำกว่า PS-032
     * เช่น ยังไม่มีใบไหน → PS-032 · มี PS-040 แล้ว → PS-041
     * ผู้ใช้ยังแก้เลขเองได้ในฟอร์ม — เลขรูปแบบอื่นที่พิมพ์เอง (เช่น 001) จะไม่ถูกนับเป็นเลขรัน
     */
    static String nextReceiptNo(List<String> existing) {
        Set<String> used = new HashSet<>();
        long max = LAST_RECEIPT_NO_IN_OLD_SYSTEM;
        for (String s : existing) {
            if (s == null || s.isBlank()) continue;
            String t = s.trim().toUpperCase();
            used.add(t);
            Matcher m = RECEIPT_RUNNING.matcher(t);
            if (m.matches()) {
                try {
                    max = Math.max(max, Long.parseLong(m.group(1)));
                } catch (NumberFormatException ignored) {
                    // เลขยาวเกิน long — ข้ามไป ไม่เอามาคิดค่า max
                }
            }
        }
        long n = max + 1;
        // กันชนกับเลขที่มีอยู่แล้วในรูปแบบเดียวกัน (เผื่อมีใครพิมพ์เลขข้ามไว้ก่อน)
        while (used.contains(RECEIPT_PREFIX + fmt(n))) {
            n++;
        }
        return RECEIPT_PREFIX + fmt(n);
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
    public Receipt create(ReceiptRequest req) {
        Receipt r = new Receipt();
        apply(r, req);
        return repository.save(r);
    }

    @Transactional
    public Receipt update(Long id, ReceiptRequest req) {
        Receipt r = findById(id);
        r.getItems().clear();
        apply(r, req);
        return repository.save(r);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ReceiptNotFoundException(id);
        }
        repository.deleteById(id);
    }

    /** เขียนข้อมูลจาก request ลง entity + คำนวณยอดใหม่ทั้งหมดฝั่งเซิร์ฟเวอร์ */
    private void apply(Receipt r, ReceiptRequest req) {
        r.setReceiptNo(req.receiptNo());
        r.setPoNo(req.poNo());
        r.setProject(trimOrNull(req.project()));
        r.setIssueDate(req.issueDate());
        r.setDueDate(req.dueDate());

        r.setIssuerName(req.issuerName());
        r.setIssuerTaxId(req.issuerTaxId());
        r.setIssuerAddress(req.issuerAddress());
        r.setIssuerEmail(req.issuerEmail());
        r.setIssuerPhone(req.issuerPhone());

        r.setRecipientName(req.recipientName());
        r.setRecipientTaxId(req.recipientTaxId());
        r.setRecipientAddress(req.recipientAddress());
        r.setRecipientPhone(req.recipientPhone());

        BigDecimal subTotal = BigDecimal.ZERO;
        int order = 0;
        for (ReceiptRequest.Item itemReq : req.items()) {
            BigDecimal qty = nz(itemReq.quantity());
            BigDecimal unit = nz(itemReq.unitPrice());
            BigDecimal lineTotal = qty.multiply(unit).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            ReceiptItem item = new ReceiptItem();
            item.setDescription(itemReq.description());
            item.setQuantity(qty);
            item.setUnitPrice(unit);
            item.setLineTotal(lineTotal);
            item.setSortOrder(order++);
            r.addItem(item);

            subTotal = subTotal.add(lineTotal);
        }
        subTotal = subTotal.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal whtRate = nz(req.whtRate());
        BigDecimal whtAmount = subTotal.multiply(whtRate)
                .divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal netTotal = subTotal.subtract(whtAmount).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        r.setSubTotal(subTotal);
        r.setWhtRate(whtRate);
        r.setWhtAmount(whtAmount);
        r.setNetTotal(netTotal);
        r.setGrandTotal(subTotal); // ไม่มี VAT — ยอดรวมทั้งหมด = ยอดรวมย่อย (เหมือนใบแจ้งหนี้)
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static String trimOrNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
