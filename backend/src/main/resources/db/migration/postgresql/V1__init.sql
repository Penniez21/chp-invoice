-- ============================================================
--  ระบบทำรายงานผู้เสียภาษี — schema เริ่มต้น (PostgreSQL)
--  เทียบเท่ากับ db/migration/mysql/V1__init.sql ทุกประการ
--
--  หมายเหตุการแปลงจาก MySQL:
--    BIGINT AUTO_INCREMENT      -> BIGSERIAL
--    DATETIME                   -> TIMESTAMP
--    ENGINE / CHARSET / COLLATE -> ไม่มีใน Postgres (ตัดทิ้ง; ฐานข้อมูลเป็น UTF-8 อยู่แล้ว)
--    ON UPDATE CURRENT_TIMESTAMP-> ไม่ต้องใช้ เพราะ entity ตั้ง updated_at เองใน @PreUpdate
-- ============================================================

-- ผู้ใช้งาน admin
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_username UNIQUE (username)
);

-- ใบแจ้งหนี้ (หัวเอกสาร)
CREATE TABLE invoices (
    id                BIGSERIAL PRIMARY KEY,
    invoice_no        VARCHAR(50)  NOT NULL,
    po_no             VARCHAR(50),
    issue_date        DATE         NOT NULL,
    due_date          DATE,

    issuer_name       VARCHAR(255) NOT NULL,
    issuer_tax_id     VARCHAR(13),
    issuer_address    TEXT,
    issuer_email      VARCHAR(120),
    issuer_phone      VARCHAR(30),

    recipient_name    VARCHAR(255) NOT NULL,
    recipient_tax_id  VARCHAR(13),
    recipient_address TEXT,
    recipient_phone   VARCHAR(30),

    sub_total         DECIMAL(14,2) NOT NULL DEFAULT 0,
    wht_rate          DECIMAL(5,2)  NOT NULL DEFAULT 3.00,   -- ภาษีหัก ณ ที่จ่าย (%)
    wht_amount        DECIMAL(14,2) NOT NULL DEFAULT 0,      -- จำนวนเงินที่หัก
    net_total         DECIMAL(14,2) NOT NULL DEFAULT 0,      -- ยอดชำระสุทธิ = sub_total - wht_amount
    grand_total       DECIMAL(14,2) NOT NULL DEFAULT 0,      -- เผื่อ VAT อนาคต (ตอนนี้ = sub_total)

    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- รายการในใบแจ้งหนี้
CREATE TABLE invoice_items (
    id          BIGSERIAL PRIMARY KEY,
    invoice_id  BIGINT NOT NULL,
    description VARCHAR(500)  NOT NULL,
    quantity    DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price  DECIMAL(14,2) NOT NULL DEFAULT 0,
    line_total  DECIMAL(14,2) NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_items_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices (id) ON DELETE CASCADE
);

CREATE INDEX idx_items_invoice ON invoice_items (invoice_id);
CREATE INDEX idx_invoices_no   ON invoices (invoice_no);

-- ไม่ seed ผู้ใช้ที่นี่โดยตั้งใจ
--
-- ของเดิมเคย INSERT admin พร้อม BCrypt ของ 'admin123' ไว้ ผลคือ DataSeeder เห็นว่ามี
-- ผู้ใช้ชื่อนี้แล้วจึงข้ามการสร้างจาก ADMIN_PASSWORD ทำให้ค่าที่ตั้งใน env ไม่มีผล
-- และระบบที่ deploy จริงจะเข้าได้ด้วย admin123 ซึ่งอ่านได้จาก repo สาธารณะ
--
-- ตอนนี้ให้ DataSeeder เป็นผู้สร้างผู้ใช้แทน โดยใช้รหัสจาก ADMIN_PASSWORD
-- (โปรไฟล์ prod บังคับให้ตั้งค่านี้ ไม่ตั้งแล้วแอปจะไม่สตาร์ท)
