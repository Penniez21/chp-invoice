-- ใบแจ้งหนี้ / ใบเสร็จรับเงิน: VAT 3 แบบ + ช่องทางการชำระ · ใบเสร็จ: ใบกำกับภาษี + สาขา (MySQL)
--
-- vat_mode: INCLUDED (ราคารวม VAT แล้ว — แบบที่ V7 ใช้กับทุกใบ) / EXCLUDED (บวก VAT เพิ่ม) / NONE (ไม่มี VAT)
--   ค่าเริ่มต้น INCLUDED เพื่อให้ยอดของใบเดิมยังตรงกับที่คำนวณไว้แล้วใน V7
-- payment_method: CASH (เงินสด) / CHEQUE (เช็ค) / TRANSFER (โอนเงิน) / NULL (ไม่ระบุ) — กรณีเช็คเก็บธนาคาร สาขา เลขที่ วันที่
-- branch: รหัสสาขา 5 หลักแบบกรมสรรพากร — 00000 = สำนักงานใหญ่ · NULL = ไม่ระบุ
--   ใช้บนใบกำกับภาษีเต็มรูป (ใบเสร็จรับเงิน/ใบกำกับภาษี) ทั้งของผู้ออกและผู้รับ

ALTER TABLE invoices
    ADD COLUMN vat_mode       VARCHAR(10)  NOT NULL DEFAULT 'INCLUDED' AFTER sub_total,
    ADD COLUMN payment_method VARCHAR(10)  NULL,
    ADD COLUMN cheque_bank    VARCHAR(100) NULL,
    ADD COLUMN cheque_branch  VARCHAR(100) NULL,
    ADD COLUMN cheque_no      VARCHAR(50)  NULL,
    ADD COLUMN cheque_date    DATE         NULL;

ALTER TABLE receipts
    ADD COLUMN vat_mode         VARCHAR(10)  NOT NULL DEFAULT 'INCLUDED' AFTER sub_total,
    ADD COLUMN payment_method   VARCHAR(10)  NULL,
    ADD COLUMN cheque_bank      VARCHAR(100) NULL,
    ADD COLUMN cheque_branch    VARCHAR(100) NULL,
    ADD COLUMN cheque_no        VARCHAR(50)  NULL,
    ADD COLUMN cheque_date      DATE         NULL,
    ADD COLUMN tax_invoice      BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN issuer_branch    VARCHAR(5)   NULL AFTER issuer_tax_id,
    ADD COLUMN recipient_branch VARCHAR(5)   NULL AFTER recipient_tax_id;

ALTER TABLE issuers    ADD COLUMN branch VARCHAR(5) NULL AFTER tax_id;
ALTER TABLE recipients ADD COLUMN branch VARCHAR(5) NULL AFTER tax_id;
