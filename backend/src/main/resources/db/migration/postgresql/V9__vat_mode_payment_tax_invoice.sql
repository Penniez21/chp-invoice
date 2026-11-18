-- ใบแจ้งหนี้ / ใบเสร็จรับเงิน: VAT 3 แบบ + ช่องทางการชำระ · ใบเสร็จ: ใบกำกับภาษี + สาขา (PostgreSQL)
-- เทียบเท่ากับ db/migration/mysql/V9__vat_mode_payment_tax_invoice.sql — คำอธิบายแต่ละคอลัมน์อยู่ในไฟล์นั้น

ALTER TABLE invoices
    ADD COLUMN vat_mode       VARCHAR(10)  NOT NULL DEFAULT 'INCLUDED',
    ADD COLUMN payment_method VARCHAR(10),
    ADD COLUMN cheque_bank    VARCHAR(100),
    ADD COLUMN cheque_branch  VARCHAR(100),
    ADD COLUMN cheque_no      VARCHAR(50),
    ADD COLUMN cheque_date    DATE;

ALTER TABLE receipts
    ADD COLUMN vat_mode         VARCHAR(10)  NOT NULL DEFAULT 'INCLUDED',
    ADD COLUMN payment_method   VARCHAR(10),
    ADD COLUMN cheque_bank      VARCHAR(100),
    ADD COLUMN cheque_branch    VARCHAR(100),
    ADD COLUMN cheque_no        VARCHAR(50),
    ADD COLUMN cheque_date      DATE,
    ADD COLUMN tax_invoice      BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN issuer_branch    VARCHAR(5),
    ADD COLUMN recipient_branch VARCHAR(5);

ALTER TABLE issuers    ADD COLUMN branch VARCHAR(5);
ALTER TABLE recipients ADD COLUMN branch VARCHAR(5);
