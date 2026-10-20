-- ผู้ออกที่บันทึกไว้ล่วงหน้า เลือกจาก dropdown ตอนกรอกใบแจ้งหนี้ได้ (PostgreSQL)
-- เทียบเท่ากับ db/migration/mysql/V3__issuers.sql
-- ใบแจ้งหนี้ยังคัดลอกข้อมูลไปเก็บในตัวเอง ไม่มี FK — แก้ผู้ออกทีหลังจึงไม่กระทบใบที่ออกไปแล้ว

CREATE TABLE issuers (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    tax_id     VARCHAR(13),
    address    TEXT,
    email      VARCHAR(120),
    phone      VARCHAR(30),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_issuers_name ON issuers (name);
