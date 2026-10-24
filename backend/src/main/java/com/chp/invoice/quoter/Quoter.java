package com.chp.invoice.quoter;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * ผู้เสนอราคาที่บันทึกไว้ล่วงหน้า (บริษัท / ร้าน / บุคคล) — ใช้เลือกจาก dropdown ตอนสร้างใบเสนอราคา
 * แยกจาก "ผู้ออก" ของใบแจ้งหนี้โดยตั้งใจ (ผู้ใช้เลือกให้ข้อมูลสองฝั่งไม่ปนกัน)
 *
 * ใบเสนอราคายัง "คัดลอก" ข้อมูลไปเก็บในตัวเอง — แก้ที่นี่ทีหลังไม่กระทบใบที่ออกไปแล้ว
 */
@Entity
@Table(name = "quoters")
public class Quoter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "tax_id", length = 13)
    private String taxId;

    @Column(columnDefinition = "TEXT")
    private String address;

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
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
