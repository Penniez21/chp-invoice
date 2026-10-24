package com.chp.invoice.customer;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * ลูกค้าของใบเสนอราคาที่บันทึกไว้ล่วงหน้า — แยกจาก "ผู้รับ" ของใบแจ้งหนี้โดยตั้งใจ
 *
 * ต่างจากผู้รับตรงที่มี "รหัสลูกค้า" (เลขที่ลูกค้าบนใบเสนอราคา) และผู้ติดต่อ (Attn.) + อีเมล
 * ใบเสนอราคายัง "คัดลอก" ข้อมูลไปเก็บในตัวเอง — แก้ที่นี่ทีหลังไม่กระทบใบที่ออกไปแล้ว
 */
@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "tax_id", length = 13)
    private String taxId;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "contact_name", length = 200)
    private String contactName;

    @Column(length = 30)
    private String phone;

    @Column(length = 120)
    private String email;

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
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
