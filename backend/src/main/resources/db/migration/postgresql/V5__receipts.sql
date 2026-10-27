-- ใบเสร็จรับเงิน (PostgreSQL) — เทียบเท่ากับ db/migration/mysql/V5__receipts.sql
-- โครงสร้างเดียวกับใบแจ้งหนี้ทุกคอลัมน์ แต่เก็บแยกตาราง เลขที่ใบเสร็จจึงรันแยกจากใบแจ้งหนี้

CREATE TABLE receipts (
    id                BIGSERIAL PRIMARY KEY,
    receipt_no        VARCHAR(50)  NOT NULL,
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
    wht_amount        DECIMAL(14,2) NOT NULL DEFAULT 0,
    net_total         DECIMAL(14,2) NOT NULL DEFAULT 0,      -- ยอดชำระสุทธิ = sub_total - wht_amount
    grand_total       DECIMAL(14,2) NOT NULL DEFAULT 0,

    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE receipt_items (
    id          BIGSERIAL PRIMARY KEY,
    receipt_id  BIGINT NOT NULL,
    description VARCHAR(500)  NOT NULL,
    quantity    DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price  DECIMAL(14,2) NOT NULL DEFAULT 0,
    line_total  DECIMAL(14,2) NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_receipt_items_receipt FOREIGN KEY (receipt_id)
        REFERENCES receipts (id) ON DELETE CASCADE
);

CREATE INDEX idx_receipt_items_receipt ON receipt_items (receipt_id);
CREATE INDEX idx_receipts_no           ON receipts (receipt_no);
