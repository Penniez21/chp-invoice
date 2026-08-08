package com.chp.invoice.invoice;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_no", nullable = false, length = 50)
    private String invoiceNo;

    @Column(name = "po_no", length = 50)
    private String poNo;

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

    @Column(name = "wht_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal whtRate = new BigDecimal("3.00");

    @Column(name = "wht_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal whtAmount = BigDecimal.ZERO;

    @Column(name = "net_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal netTotal = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<InvoiceItem> items = new ArrayList<>();

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

    public void addItem(InvoiceItem item) {
        item.setInvoice(this);
        this.items.add(item);
    }

    // ----- getters / setters -----
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInvoiceNo() { return invoiceNo; }
    public void setInvoiceNo(String invoiceNo) { this.invoiceNo = invoiceNo; }
    public String getPoNo() { return poNo; }
    public void setPoNo(String poNo) { this.poNo = poNo; }
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
    public BigDecimal getWhtRate() { return whtRate; }
    public void setWhtRate(BigDecimal whtRate) { this.whtRate = whtRate; }
    public BigDecimal getWhtAmount() { return whtAmount; }
    public void setWhtAmount(BigDecimal whtAmount) { this.whtAmount = whtAmount; }
    public BigDecimal getNetTotal() { return netTotal; }
    public void setNetTotal(BigDecimal netTotal) { this.netTotal = netTotal; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<InvoiceItem> getItems() { return items; }
    public void setItems(List<InvoiceItem> items) { this.items = items; }
}
