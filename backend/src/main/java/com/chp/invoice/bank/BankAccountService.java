package com.chp.invoice.bank;

import com.chp.invoice.bank.dto.BankAccountRequest;
import com.chp.invoice.web.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BankAccountService {

    private final BankAccountRepository repository;

    public BankAccountService(BankAccountRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<BankAccount> findAll() {
        return repository.findAllByOrderBySortOrderAscIdAsc();
    }

    /** เฉพาะบัญชีที่เลือกให้แสดงบนใบแจ้งหนี้ (ไม่เกิน MAX_SHOWN) */
    @Transactional(readOnly = true)
    public List<BankAccount> findShown() {
        return repository.findByShowOnInvoiceTrueOrderBySortOrderAscIdAsc();
    }

    @Transactional(readOnly = true)
    public BankAccount findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new BankAccountNotFoundException(id));
    }

    @Transactional
    public BankAccount create(BankAccountRequest req) {
        BankAccount b = new BankAccount();
        if (req.showOnInvoice()) {
            requireRoomToShow();
        }
        apply(b, req);
        return repository.save(b);
    }

    @Transactional
    public BankAccount update(Long id, BankAccountRequest req) {
        BankAccount b = findById(id);
        // ตรวจโควตาเฉพาะตอน "เปลี่ยนจากไม่แสดง → แสดง" เท่านั้น
        if (req.showOnInvoice() && !b.isShowOnInvoice()) {
            requireRoomToShow();
        }
        apply(b, req);
        return repository.save(b);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new BankAccountNotFoundException(id);
        }
        repository.deleteById(id);
    }

    private void requireRoomToShow() {
        if (repository.countByShowOnInvoiceTrue() >= BankAccount.MAX_SHOWN) {
            throw new BadRequestException(
                    "เลือกแสดงบนใบแจ้งหนี้ได้สูงสุด " + BankAccount.MAX_SHOWN
                            + " บัญชี กรุณาเอาบัญชีอื่นออกก่อน");
        }
    }

    private void apply(BankAccount b, BankAccountRequest req) {
        b.setBankName(req.bankName().trim());
        b.setAccountType(trimOrNull(req.accountType()));
        b.setAccountNo(req.accountNo().trim());
        b.setAccountName(trimOrNull(req.accountName()));
        b.setShowOnInvoice(req.showOnInvoice());
        b.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
    }

    private static String trimOrNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
