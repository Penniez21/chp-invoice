package com.chp.invoice.quotation;

import com.chp.invoice.quotation.dto.NextQuotationNoResponse;
import com.chp.invoice.quotation.dto.QuotationRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class QuotationService {

    private static final int MONEY_SCALE = 2;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    /** รูปแบบเลขที่ใบเสนอราคา: PSPO- + เลขรัน 3 หลัก (PSPO-001, PSPO-002, …) */
    private static final String PREFIX = "PSPO-";
    private static final Pattern RUNNING = Pattern.compile("^PSPO-(\\d{1,18})$", Pattern.CASE_INSENSITIVE);

    private final QuotationRepository repository;

    public QuotationService(QuotationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Quotation> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Quotation findById(Long id) {
        return repository.findWithItemsById(id)
                .orElseThrow(() -> new QuotationNotFoundException(id));
    }

    /**
     * เลขที่ใบเสนอราคาถัดไปที่ยังไม่ซ้ำ: PSPO- + (เลขรันมากสุดที่มีอยู่ + 1) เติมศูนย์ให้ครบ 3 หลัก
     * เช่น มี PSPO-066 อยู่แล้ว → PSPO-067 · ยังไม่มีใบไหนเลย → PSPO-001
     * ผู้ใช้ยังแก้เลขเองได้ในฟอร์ม — เลขรูปแบบอื่นที่พิมพ์เองจะไม่ถูกนับเป็นเลขรัน
     */
    @Transactional(readOnly = true)
    public NextQuotationNoResponse nextQuotationNo() {
        return new NextQuotationNoResponse(nextRunning(repository.findAllQuotationNos()));
    }

    static String nextRunning(List<String> existing) {
        Set<String> used = new HashSet<>();
        long max = 0;
        for (String s : existing) {
            if (s == null || s.isBlank()) continue;
            String t = s.trim().toUpperCase();
            used.add(t);
            Matcher m = RUNNING.matcher(t);
            if (m.matches()) {
                max = Math.max(max, Long.parseLong(m.group(1)));
            }
        }
        long n = max + 1;
        // กันชนกับเลขที่มีอยู่แล้วในรูปแบบเดียวกัน (เผื่อมีใครพิมพ์เลขข้ามไว้ก่อน)
        while (used.contains(format(n))) {
            n++;
        }
        return format(n);
    }

    private static String format(long n) {
        return PREFIX + String.format("%03d", n);
    }

    @Transactional
    public Quotation create(QuotationRequest req) {
        Quotation q = new Quotation();
        apply(q, req);
        return repository.save(q);
    }

    @Transactional
    public Quotation update(Long id, QuotationRequest req) {
        Quotation q = findById(id);
        q.getItems().clear();
        apply(q, req);
        return repository.save(q);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new QuotationNotFoundException(id);
        }
        repository.deleteById(id);
    }

    /** เขียนข้อมูลจาก request ลง entity + คำนวณยอดใหม่ทั้งหมดฝั่งเซิร์ฟเวอร์ */
    private void apply(Quotation q, QuotationRequest req) {
        q.setQuotationNo(req.quotationNo().trim());
        q.setIssueDate(req.issueDate());
        q.setCustomerNo(trimOrNull(req.customerNo()));
        q.setProject(trimOrNull(req.project()));
        q.setLocation(trimOrNull(req.location()));

        q.setSellerName(req.sellerName().trim());
        q.setSellerTaxId(trimOrNull(req.sellerTaxId()));
        q.setSellerAddress(trimOrNull(req.sellerAddress()));
        q.setSellerPhone(trimOrNull(req.sellerPhone()));
        q.setSellerEmail(trimOrNull(req.sellerEmail()));

        q.setCustomerName(req.customerName().trim());
        q.setCustomerTaxId(trimOrNull(req.customerTaxId()));
        q.setCustomerAddress(trimOrNull(req.customerAddress()));
        q.setCustomerAttn(trimOrNull(req.customerAttn()));
        q.setCustomerPhone(trimOrNull(req.customerPhone()));
        q.setCustomerEmail(trimOrNull(req.customerEmail()));

        q.setRemark(trimOrNull(req.remark()));

        BigDecimal itemsTotal = BigDecimal.ZERO;
        int order = 0;
        for (QuotationRequest.Item itemReq : req.items()) {
            BigDecimal qty = nz(itemReq.quantity());
            BigDecimal unit = nz(itemReq.unitPrice());
            BigDecimal lineTotal = qty.multiply(unit).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

            QuotationItem item = new QuotationItem();
            item.setDescription(itemReq.description().trim());
            item.setDetails(trimOrNull(itemReq.details()));
            item.setQuantity(qty);
            item.setUnit(trimOrNull(itemReq.unit()));
            item.setUnitPrice(unit);
            item.setLineTotal(lineTotal);
            item.setSortOrder(order++);
            q.addItem(item);

            itemsTotal = itemsTotal.add(lineTotal);
        }
        itemsTotal = itemsTotal.setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        VatMode mode = req.vatMode();
        BigDecimal rate = nz(req.vatRate());
        BigDecimal beforeVat;
        BigDecimal vatAmount;
        BigDecimal grandTotal;
        switch (mode) {
            case INCLUDED -> {
                // ราคารวม VAT แล้ว: ถอดมูลค่าก่อน VAT = ยอดรวม × 100 / (100 + อัตรา) แล้ว VAT = ส่วนต่าง
                // ใช้ส่วนต่างแทนการคูณอัตราตรง ๆ เพื่อให้ ก่อน VAT + VAT = ยอดรวม พอดีทุกสตางค์
                grandTotal = itemsTotal;
                beforeVat = itemsTotal.multiply(HUNDRED)
                        .divide(HUNDRED.add(rate), MONEY_SCALE, RoundingMode.HALF_UP);
                vatAmount = grandTotal.subtract(beforeVat);
            }
            case EXCLUDED -> {
                beforeVat = itemsTotal;
                vatAmount = itemsTotal.multiply(rate).divide(HUNDRED, MONEY_SCALE, RoundingMode.HALF_UP);
                grandTotal = beforeVat.add(vatAmount);
            }
            default -> {
                beforeVat = itemsTotal;
                vatAmount = BigDecimal.ZERO.setScale(MONEY_SCALE);
                grandTotal = itemsTotal;
            }
        }

        q.setVatMode(mode);
        q.setVatRate(rate);
        q.setItemsTotal(itemsTotal);
        q.setBeforeVat(beforeVat);
        q.setVatAmount(vatAmount);
        q.setGrandTotal(grandTotal);
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
