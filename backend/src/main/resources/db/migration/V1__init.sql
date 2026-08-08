-- ============================================================
--  ระบบทำรายงานผู้เสียภาษี — schema เริ่มต้น (MySQL 8, utf8mb4)
-- ============================================================

-- ผู้ใช้งาน admin
CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_username UNIQUE (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ใบแจ้งหนี้ (หัวเอกสาร)
CREATE TABLE invoices (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
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

    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- รายการในใบแจ้งหนี้
CREATE TABLE invoice_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id  BIGINT NOT NULL,
    description VARCHAR(500)  NOT NULL,
    quantity    DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit_price  DECIMAL(14,2) NOT NULL DEFAULT 0,
    line_total  DECIMAL(14,2) NOT NULL DEFAULT 0,
    sort_order  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_items_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoices (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_items_invoice ON invoice_items (invoice_id);
CREATE INDEX idx_invoices_no    ON invoices (invoice_no);

-- ผู้ใช้เริ่มต้น: admin / admin123  (BCrypt) — เปลี่ยนรหัสหลังใช้งานจริง
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$dktbaaiiKCv4yajjhlaxL.Rw6mw5tqJbfBnoVNptMqMxZ6KM7GbJK', 'ADMIN');
