package com.chp.invoice.issuer;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * ผู้ออกที่บันทึกไว้ล่วงหน้า — ใช้เลือกจาก dropdown ตอนสร้างใบแจ้งหนี้
 * แล้วเติมข้อมูลให้อัตโนมัติ (ยังพิมพ์เองได้ถ้าไม่มีในรายการ)
 *
 * หมายเหตุ: ใบแจ้งหนี้ยัง "คัดลอก" ข้อมูลผู้ออกไปเก็บในตัวเองเหมือนเดิม
 * ไม่ได้อ้างอิงด้วย FK — แก้ข้อมูลผู้ออกทีหลังจึงไม่กระทบใบเก่าที่ออกไปแล้ว
 *
 * ต่างจากผู้รับตรงที่มี "อีเมล" เพิ่มมา (ผู้ออกมักต้องแสดงอีเมลติดต่อบนเอกสาร)
 */
@Entity
@Table(name = "issuers")
public class Issuer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "tax_id", length = 13)
    private String taxId;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 120)
    private String email;

    @Column(length = 30)
    private String phone;

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
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
