-- ตั้งค่าระบบ: บัญชีธนาคาร + ผู้รับที่บันทึกไว้ล่วงหน้า
-- (โปรไฟล์ h2 ไม่ใช้ไฟล์นี้ — Hibernate สร้างตารางจาก entity ให้เอง)

-- บัญชีธนาคารสำหรับแสดงบนใบแจ้งหนี้ (เลือกแสดงได้สูงสุด 3 บัญชี — บังคับที่ BankAccountService)
CREATE TABLE bank_accounts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    bank_name       VARCHAR(120) NOT NULL,
    account_type    VARCHAR(60),
    account_no      VARCHAR(40)  NOT NULL,
    account_name    VARCHAR(160),
    show_on_invoice BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INT     NOT NULL DEFAULT 0,

    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_bank_accounts_shown ON bank_accounts (show_on_invoice, sort_order);

-- ผู้รับที่บันทึกไว้ เลือกจาก dropdown ตอนกรอกใบแจ้งหนี้ได้
-- ใบแจ้งหนี้ยังคัดลอกข้อมูลไปเก็บในตัวเอง ไม่มี FK — แก้ผู้รับทีหลังจึงไม่กระทบใบที่ออกไปแล้ว
CREATE TABLE recipients (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    tax_id     VARCHAR(13),
    address    TEXT,
    phone      VARCHAR(30),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_recipients_name ON recipients (name);
