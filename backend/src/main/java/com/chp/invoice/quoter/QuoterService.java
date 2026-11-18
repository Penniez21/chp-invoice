package com.chp.invoice.quoter;

import com.chp.invoice.quotation.QuotationRepository;
import com.chp.invoice.quoter.dto.QuoterRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QuoterService {

    /** ผู้เสนอราคาที่บันทึกแล้ว + จำนวนใบเสนอราคาเดิมที่ได้โลโก้นี้ไปด้วย (ดู applyLogoToOldQuotations) */
    public record SaveResult(Quoter quoter, int logoAppliedToQuotations) {
    }

    private final QuoterRepository repository;
    private final QuotationRepository quotations;

    public QuoterService(QuoterRepository repository, QuotationRepository quotations) {
        this.repository = repository;
        this.quotations = quotations;
    }

    @Transactional(readOnly = true)
    public List<Quoter> findAll() {
        return repository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Quoter findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new QuoterNotFoundException(id));
    }

    @Transactional
    public SaveResult create(QuoterRequest req) {
        Quoter q = new Quoter();
        apply(q, req);
        Quoter saved = repository.save(q);
        return new SaveResult(saved, applyLogoToOldQuotations(saved));
    }

    @Transactional
    public SaveResult update(Long id, QuoterRequest req) {
        Quoter q = findById(id);
        apply(q, req);
        Quoter saved = repository.save(q);
        return new SaveResult(saved, applyLogoToOldQuotations(saved));
    }

    /**
     * ใบเสนอราคาคัดลอกโลโก้ไปตอนสร้าง ใบที่ออกก่อนผู้เสนอราคามีโลโก้จึงไม่มีโลโก้ —
     * พอบันทึกโลโก้ที่นี่ ก็ใส่ให้ใบเดิมของผู้เสนอราคารายนี้ (ชื่อ + เลขภาษีตรงกัน) ที่ยังไม่มีโลโก้ด้วย (ผู้ใช้ขอ)
     * ใบที่มีโลโก้ของตัวเองอยู่แล้วไม่เปลี่ยน เอกสารที่ส่งไปแล้วจึงไม่เปลี่ยนหน้าตาเพราะเปลี่ยนโลโก้ทีหลัง
     */
    private int applyLogoToOldQuotations(Quoter q) {
        if (q.getLogo() == null) return 0;
        return q.getTaxId() == null
                ? quotations.fillMissingSellerLogoWithoutTaxId(q.getName(), q.getLogo())
                : quotations.fillMissingSellerLogo(q.getName(), q.getTaxId(), q.getLogo());
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new QuoterNotFoundException(id);
        }
        repository.deleteById(id);
    }

    private void apply(Quoter q, QuoterRequest req) {
        q.setName(req.name().trim());
        q.setTaxId(trimOrNull(req.taxId()));
        q.setAddress(trimOrNull(req.address()));
        q.setPhone(trimOrNull(req.phone()));
        q.setEmail(trimOrNull(req.email()));
        q.setLogo(trimOrNull(req.logo()));
        q.setContactName(trimOrNull(req.contactName()));
        q.setContactPhone(trimOrNull(req.contactPhone()));
        q.setContactEmail(trimOrNull(req.contactEmail()));
    }

    private static String trimOrNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
