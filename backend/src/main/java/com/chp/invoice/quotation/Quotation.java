package com.chp.invoice.quotation;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotations")
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quotation_no", nullable = false, length = 50)
    private String quotationNo;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "customer_no", length = 30)
    private String customerNo;

    @Column(length = 255)
    private String project;

    @Column(length = 255)
    private String location;

    // ----- ผู้เสนอราคา (บริษัท / ร้าน / บุคคล) -----
    @Column(name = "seller_name", nullable = false)
    private String sellerName;

    @Column(name = "seller_tax_id", length = 13)
    private String sellerTaxId;

    @Column(name = "seller_address", columnDefinition = "TEXT")
    private String sellerAddress;

    @Column(name = "seller_phone", length = 30)
    private String sellerPhone;

    @Column(name = "seller_email", length = 120)
    private String sellerEmail;

    // ----- ลูกค้า -----
    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_tax_id", length = 13)
    private String customerTaxId;

    @Column(name = "customer_address", columnDefinition = "TEXT")
    private String customerAddress;

    @Column(name = "customer_attn", length = 200)
    private String customerAttn;

    @Column(name = "customer_phone", length = 30)
    private String customerPhone;

    @Column(name = "customer_email", length = 120)
    private String customerEmail;

    @Column(columnDefinition = "TEXT")
    private String remark;

    // ----- ยอดเงิน (คำนวณฝั่งเซิร์ฟเวอร์) -----
    @Enumerated(EnumType.STRING)
    @Column(name = "vat_mode", nullable = false, length = 10)
    private VatMode vatMode = VatMode.INCLUDED;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate = new BigDecimal("7.00");

    /** ผลรวมราคารวมทุกบรรทัด (ตัวเลขตามที่กรอก ก่อนแยก/บวก VAT) */
    @Column(name = "items_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal itemsTotal = BigDecimal.ZERO;

    @Column(name = "before_vat", nullable = false, precision = 14, scale = 2)
    private BigDecimal beforeVat = BigDecimal.ZERO;

    @Column(name = "vat_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<QuotationItem> items = new ArrayList<>();

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

    public void addItem(QuotationItem item) {
        item.setQuotation(this);
        this.items.add(item);
    }

    // ----- getters / setters -----
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getQuotationNo() { return quotationNo; }
    public void setQuotationNo(String quotationNo) { this.quotationNo = quotationNo; }
    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public String getCustomerNo() { return customerNo; }
    public void setCustomerNo(String customerNo) { this.customerNo = customerNo; }
    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
    public String getSellerTaxId() { return sellerTaxId; }
    public void setSellerTaxId(String sellerTaxId) { this.sellerTaxId = sellerTaxId; }
    public String getSellerAddress() { return sellerAddress; }
    public void setSellerAddress(String sellerAddress) { this.sellerAddress = sellerAddress; }
    public String getSellerPhone() { return sellerPhone; }
    public void setSellerPhone(String sellerPhone) { this.sellerPhone = sellerPhone; }
    public String getSellerEmail() { return sellerEmail; }
    public void setSellerEmail(String sellerEmail) { this.sellerEmail = sellerEmail; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerTaxId() { return customerTaxId; }
    public void setCustomerTaxId(String customerTaxId) { this.customerTaxId = customerTaxId; }
    public String getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(String customerAddress) { this.customerAddress = customerAddress; }
    public String getCustomerAttn() { return customerAttn; }
    public void setCustomerAttn(String customerAttn) { this.customerAttn = customerAttn; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public VatMode getVatMode() { return vatMode; }
    public void setVatMode(VatMode vatMode) { this.vatMode = vatMode; }
    public BigDecimal getVatRate() { return vatRate; }
    public void setVatRate(BigDecimal vatRate) { this.vatRate = vatRate; }
    public BigDecimal getItemsTotal() { return itemsTotal; }
    public void setItemsTotal(BigDecimal itemsTotal) { this.itemsTotal = itemsTotal; }
    public BigDecimal getBeforeVat() { return beforeVat; }
    public void setBeforeVat(BigDecimal beforeVat) { this.beforeVat = beforeVat; }
    public BigDecimal getVatAmount() { return vatAmount; }
    public void setVatAmount(BigDecimal vatAmount) { this.vatAmount = vatAmount; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<QuotationItem> getItems() { return items; }
    public void setItems(List<QuotationItem> items) { this.items = items; }
}
