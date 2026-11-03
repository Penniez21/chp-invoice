-- ราคาก่อนภาษีมูลค่าเพิ่มของใบแจ้งหนี้และใบเสร็จรับเงิน (PostgreSQL)
-- เทียบเท่ากับ db/migration/mysql/V7__invoice_receipt_vat.sql

ALTER TABLE invoices
    ADD COLUMN before_vat DECIMAL(14,2) NOT NULL DEFAULT 0,      -- ราคาก่อนภาษีมูลค่าเพิ่ม
    ADD COLUMN vat_rate   DECIMAL(5,2)  NOT NULL DEFAULT 7.00,   -- ภาษีมูลค่าเพิ่ม (%)
    ADD COLUMN vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0;

ALTER TABLE receipts
    ADD COLUMN before_vat DECIMAL(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN vat_rate   DECIMAL(5,2)  NOT NULL DEFAULT 7.00,
    ADD COLUMN vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0;

-- ใบเก่า: คิดยอดใหม่ด้วยกฎเดียวกับที่ service ใช้ เอกสารเก่าจะได้ไม่แสดงตัวเลขที่ขัดกันเอง
UPDATE invoices SET
    before_vat = ROUND(sub_total * 100 / 107, 2),
    vat_amount = sub_total - ROUND(sub_total * 100 / 107, 2),
    wht_amount = ROUND(ROUND(sub_total * 100 / 107, 2) * wht_rate / 100, 2),
    net_total  = sub_total - ROUND(ROUND(sub_total * 100 / 107, 2) * wht_rate / 100, 2);

UPDATE receipts SET
    before_vat = ROUND(sub_total * 100 / 107, 2),
    vat_amount = sub_total - ROUND(sub_total * 100 / 107, 2),
    wht_amount = ROUND(ROUND(sub_total * 100 / 107, 2) * wht_rate / 100, 2),
    net_total  = sub_total - ROUND(ROUND(sub_total * 100 / 107, 2) * wht_rate / 100, 2);
