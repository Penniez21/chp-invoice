package com.chp.invoice.receipt;

import com.chp.invoice.document.PaymentMethod;
import com.chp.invoice.quotation.VatMode;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ใบเสร็จรับเงิน — ข้อมูลชุดเดียวกับใบแจ้งหนี้ทุกช่อง (ผู้ใช้ต้องการฟอร์มเหมือนกัน)
 * แต่เก็บแยกตาราง เลขที่จึงรันแยกจากใบแจ้งหนี้ และแตกต่างจากใบแจ้งหนี้ได้ในอนาคต
 */
@Entity
@Table(name = "receipts")
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_no", nullable = false, length = 50)
    private String receiptNo;

    @Column(name = "po_no", length = 50)
    private String poNo;

    /** ชื่อโครงการ — ไม่บังคับ ใช้ตั้งชื่อไฟล์ PDF และแสดงในกล่องเลขที่เอกสาร */
    @Column(name = "project", length = 255)
    private String project;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    // ----- ผู้ออก (Issuer) -----
    @Column(name = "issuer_name", nullable = false)
    private String issuerName;

    @Column(name = "issuer_tax_id", length = 13)
    private String issuerTaxId;

    @Column(name = "issuer_address", columnDefinition = "TEXT")
    private String issuerAddress;

    @Column(name = "issuer_email", length = 120)
    private String issuerEmail;

    @Column(name = "issuer_phone", length = 30)
    private String issuerPhone;

    // ----- ผู้รับ (Recipient) -----
    @Column(name = "recipient_name", nullable = false)
    private String recipientName;

    @Column(name = "recipient_tax_id", length = 13)
    private String recipientTaxId;

    @Column(name = "recipient_address", columnDefinition = "TEXT")
    private String recipientAddress;

    @Column(name = "recipient_phone", length = 30)
    private String recipientPhone;

    // ----- ยอดเงิน (คำนวณฝั่งเซิร์ฟเวอร์) -----
    @Column(name = "sub_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal subTotal = BigDecimal.ZERO;

    /** วิธีคิด VAT 3 แบบเหมือนใบเสนอราคา — ดู document.DocumentTotals */
    @Enumerated(EnumType.STRING)
    @Column(name = "vat_mode", nullable = false, length = 10)
    private VatMode vatMode = VatMode.INCLUDED;

    /** ราคาก่อนภาษีมูลค่าเพิ่ม (ฐานคิดภาษีหัก ณ ที่จ่าย) */
    @Column(name = "before_vat", nullable = false, precision = 14, scale = 2)
    private BigDecimal beforeVat = BigDecimal.ZERO;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate = new BigDecimal("7.00");

    @Column(name = "vat_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "wht_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal whtRate = new BigDecimal("3.00");

    @Column(name = "wht_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal whtAmount = BigDecimal.ZERO;

    @Column(name = "net_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal netTotal = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    // ----- ช่องทางการชำระ (ไม่บังคับ) — กรณีเช็คเก็บรายละเอียดเช็คด้วย -----
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 10)
    private PaymentMethod paymentMethod;

    @Column(name = "cheque_bank", length = 100)
    private String chequeBank;

    @Column(name = "cheque_branch", length = 100)
    private String chequeBranch;

    @Column(name = "cheque_no", length = 50)
    private String chequeNo;

    @Column(name = "cheque_date")
    private LocalDate chequeDate;

    // ----- ใบกำกับภาษี — หัวเอกสารเป็น "ใบเสร็จรับเงิน/ใบกำกับภาษี" (ต้องมี VAT) -----
    @Column(name = "tax_invoice", nullable = false)
    private boolean taxInvoice = false;

    /** รหัสสาขา 5 หลักแบบกรมสรรพากร: 00000 = สำนักงานใหญ่ · null = ไม่ระบุ */
    @Column(name = "issuer_branch", length = 5)
    private String issuerBranch;

    @Column(name = "recipient_branch", length = 5)
    private String recipientBranch;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ReceiptItem> items = new ArrayList<>();

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

    public void addItem(ReceiptItem item) {
        item.setReceipt(this);
        this.items.add(item);
    }

    // ----- getters / setters -----
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReceiptNo() { return receiptNo; }
    public void setReceiptNo(String receiptNo) { this.receiptNo = receiptNo; }
    public String getPoNo() { return poNo; }
    public void setPoNo(String poNo) { this.poNo = poNo; }
    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }
    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getIssuerName() { return issuerName; }
    public void setIssuerName(String issuerName) { this.issuerName = issuerName; }
    public String getIssuerTaxId() { return issuerTaxId; }
    public void setIssuerTaxId(String issuerTaxId) { this.issuerTaxId = issuerTaxId; }
    public String getIssuerAddress() { return issuerAddress; }
    public void setIssuerAddress(String issuerAddress) { this.issuerAddress = issuerAddress; }
    public String getIssuerEmail() { return issuerEmail; }
    public void setIssuerEmail(String issuerEmail) { this.issuerEmail = issuerEmail; }
    public String getIssuerPhone() { return issuerPhone; }
    public void setIssuerPhone(String issuerPhone) { this.issuerPhone = issuerPhone; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getRecipientTaxId() { return recipientTaxId; }
    public void setRecipientTaxId(String recipientTaxId) { this.recipientTaxId = recipientTaxId; }
    public String getRecipientAddress() { return recipientAddress; }
    public void setRecipientAddress(String recipientAddress) { this.recipientAddress = recipientAddress; }
    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }
    public BigDecimal getSubTotal() { return subTotal; }
    public void setSubTotal(BigDecimal subTotal) { this.subTotal = subTotal; }
    public BigDecimal getBeforeVat() { return beforeVat; }
    public void setBeforeVat(BigDecimal beforeVat) { this.beforeVat = beforeVat; }
    public BigDecimal getVatRate() { return vatRate; }
    public void setVatRate(BigDecimal vatRate) { this.vatRate = vatRate; }
    public BigDecimal getVatAmount() { return vatAmount; }
    public void setVatAmount(BigDecimal vatAmount) { this.vatAmount = vatAmount; }
    public BigDecimal getWhtRate() { return whtRate; }
    public void setWhtRate(BigDecimal whtRate) { this.whtRate = whtRate; }
    public BigDecimal getWhtAmount() { return whtAmount; }
    public void setWhtAmount(BigDecimal whtAmount) { this.whtAmount = whtAmount; }
    public BigDecimal getNetTotal() { return netTotal; }
    public void setNetTotal(BigDecimal netTotal) { this.netTotal = netTotal; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public VatMode getVatMode() { return vatMode; }
    public void setVatMode(VatMode vatMode) { this.vatMode = vatMode; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getChequeBank() { return chequeBank; }
    public void setChequeBank(String chequeBank) { this.chequeBank = chequeBank; }
    public String getChequeBranch() { return chequeBranch; }
    public void setChequeBranch(String chequeBranch) { this.chequeBranch = chequeBranch; }
    public String getChequeNo() { return chequeNo; }
    public void setChequeNo(String chequeNo) { this.chequeNo = chequeNo; }
    public LocalDate getChequeDate() { return chequeDate; }
    public void setChequeDate(LocalDate chequeDate) { this.chequeDate = chequeDate; }
    public boolean isTaxInvoice() { return taxInvoice; }
    public void setTaxInvoice(boolean taxInvoice) { this.taxInvoice = taxInvoice; }
    public String getIssuerBranch() { return issuerBranch; }
    public void setIssuerBranch(String issuerBranch) { this.issuerBranch = issuerBranch; }
    public String getRecipientBranch() { return recipientBranch; }
    public void setRecipientBranch(String recipientBranch) { this.recipientBranch = recipientBranch; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<ReceiptItem> getItems() { return items; }
    public void setItems(List<ReceiptItem> items) { this.items = items; }
}
