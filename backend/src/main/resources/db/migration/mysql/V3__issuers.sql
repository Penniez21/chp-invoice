-- ผู้ออกที่บันทึกไว้ล่วงหน้า เลือกจาก dropdown ตอนกรอกใบแจ้งหนี้ได้ (MySQL)
-- ใบแจ้งหนี้ยังคัดลอกข้อมูลไปเก็บในตัวเอง ไม่มี FK — แก้ผู้ออกทีหลังจึงไม่กระทบใบที่ออกไปแล้ว
-- ต่างจากผู้รับตรงที่มีคอลัมน์ email เพิ่มมา

CREATE TABLE issuers (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    tax_id     VARCHAR(13),
    address    TEXT,
    email      VARCHAR(120),
    phone      VARCHAR(30),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_issuers_name ON issuers (name);
