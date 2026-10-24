-- ใบเสนอราคา + ข้อมูลหลักของฝั่งใบเสนอราคา (MySQL)
-- ผู้เสนอราคา / ลูกค้า แยกจาก ผู้ออก / ผู้รับ ของใบแจ้งหนี้โดยตั้งใจ
-- ใบเสนอราคาคัดลอกข้อมูลไปเก็บในตัวเอง ไม่มี FK — แก้ผู้เสนอราคา/ลูกค้าทีหลังจึงไม่กระทบใบที่ออกไปแล้ว

CREATE TABLE quoters (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    tax_id        VARCHAR(13),
    address       TEXT,
    phone         VARCHAR(30),
    email         VARCHAR(120),

    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_quoters_name ON quoters (name);

CREATE TABLE customers (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    code         VARCHAR(30),
    name         VARCHAR(200) NOT NULL,
    tax_id       VARCHAR(13),
    address      TEXT,
    contact_name VARCHAR(200),
    phone        VARCHAR(30),
    email        VARCHAR(120),

    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_customers_name ON customers (name);

-- ใบเสนอราคา (หัวเอกสาร)
CREATE TABLE quotations (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    quotation_no     VARCHAR(50)  NOT NULL,
    issue_date       DATE         NOT NULL,
    customer_no      VARCHAR(30),
    project          VARCHAR(255),
    location         VARCHAR(255),

    seller_name      VARCHAR(255) NOT NULL,
    seller_tax_id    VARCHAR(13),
    seller_address   TEXT,
    seller_phone     VARCHAR(30),
    seller_email     VARCHAR(120),

    customer_name    VARCHAR(255) NOT NULL,
    customer_tax_id  VARCHAR(13),
    customer_address TEXT,
    customer_attn    VARCHAR(200),
    customer_phone   VARCHAR(30),
    customer_email   VARCHAR(120),

    remark           TEXT,

    vat_mode         VARCHAR(10)   NOT NULL DEFAULT 'INCLUDED', -- INCLUDED / EXCLUDED / NONE
    vat_rate         DECIMAL(5,2)  NOT NULL DEFAULT 7.00,
    items_total      DECIMAL(14,2) NOT NULL DEFAULT 0,          -- ผลรวมราคารวมทุกบรรทัด
    before_vat       DECIMAL(14,2) NOT NULL DEFAULT 0,          -- มูลค่าก่อนภาษีมูลค่าเพิ่ม
    vat_amount       DECIMAL(14,2) NOT NULL DEFAULT 0,
    grand_total      DECIMAL(14,2) NOT NULL DEFAULT 0,          -- ราคาสุทธิทั้งหมด

    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- รายการในใบเสนอราคา
CREATE TABLE quotation_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    quotation_id BIGINT NOT NULL,
    description  VARCHAR(500)  NOT NULL,
    details      TEXT,                                -- รายละเอียดย่อย บรรทัดละข้อ ไม่มีราคา
    quantity     DECIMAL(12,2) NOT NULL DEFAULT 1,
    unit         VARCHAR(30),
    unit_price   DECIMAL(14,2) NOT NULL DEFAULT 0,
    line_total   DECIMAL(14,2) NOT NULL DEFAULT 0,
    sort_order   INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_quotation_items_quotation FOREIGN KEY (quotation_id)
        REFERENCES quotations (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_quotation_items_quotation ON quotation_items (quotation_id);
CREATE INDEX idx_quotations_no             ON quotations (quotation_no);
