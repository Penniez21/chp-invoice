package com.chp.invoice.bank;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * บัญชีธนาคารของผู้ออกใบแจ้งหนี้
 *
 * เก็บได้ไม่จำกัดจำนวน (ธนาคารเดียวมีหลายบัญชีก็ได้) แต่เลือกให้ "แสดงบนใบแจ้งหนี้"
 * ได้สูงสุด 3 รายการ — ดูการบังคับกฎที่ BankAccountService
 */
@Entity
@Table(name = "bank_accounts")
public class BankAccount {

    /** จำนวนบัญชีสูงสุดที่แสดงบนใบแจ้งหนี้ได้พร้อมกัน */
    public static final int MAX_SHOWN = 3;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bank_name", nullable = false, length = 120)
    private String bankName;

    /** ประเภทบัญชี เช่น ออมทรัพย์ / กระแสรายวัน */
    @Column(name = "account_type", length = 60)
    private String accountType;

    @Column(name = "account_no", nullable = false, length = 40)
    private String accountNo;

    /** ชื่อบัญชี — เว้นว่างได้ ใบแจ้งหนี้จะใช้ชื่อผู้ออกแทน */
    @Column(name = "account_name", length = 160)
    private String accountName;

    @Column(name = "show_on_invoice", nullable = false)
    private boolean showOnInvoice = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }
    public String getAccountNo() { return accountNo; }
    public void setAccountNo(String accountNo) { this.accountNo = accountNo; }
    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }
    public boolean isShowOnInvoice() { return showOnInvoice; }
    public void setShowOnInvoice(boolean showOnInvoice) { this.showOnInvoice = showOnInvoice; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
