-- ตั้งค่าระบบ: บัญชีธนาคาร + ผู้รับที่บันทึกไว้ล่วงหน้า (PostgreSQL)
-- เทียบเท่ากับ db/migration/mysql/V2__bank_accounts_and_recipients.sql

-- บัญชีธนาคารสำหรับแสดงบนใบแจ้งหนี้ (เลือกแสดงได้สูงสุด 3 บัญชี — บังคับที่ BankAccountService)
CREATE TABLE bank_accounts (
    id              BIGSERIAL PRIMARY KEY,
    bank_name       VARCHAR(120) NOT NULL,
    account_type    VARCHAR(60),
    account_no      VARCHAR(40)  NOT NULL,
    account_name    VARCHAR(160),
    show_on_invoice BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INT     NOT NULL DEFAULT 0,

    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_accounts_shown ON bank_accounts (show_on_invoice, sort_order);

-- ผู้รับที่บันทึกไว้ เลือกจาก dropdown ตอนกรอกใบแจ้งหนี้ได้
-- ใบแจ้งหนี้ยังคัดลอกข้อมูลไปเก็บในตัวเอง ไม่มี FK — แก้ผู้รับทีหลังจึงไม่กระทบใบที่ออกไปแล้ว
CREATE TABLE recipients (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    tax_id     VARCHAR(13),
    address    TEXT,
    phone      VARCHAR(30),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipients_name ON recipients (name);
