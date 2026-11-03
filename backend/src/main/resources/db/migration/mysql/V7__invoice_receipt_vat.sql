-- ราคาก่อนภาษีมูลค่าเพิ่มของใบแจ้งหนี้และใบเสร็จรับเงิน (MySQL)
-- ราคาที่กรอกในรายการถือว่า "รวม VAT 7% แล้ว" จึงถอดออกมาเป็น before_vat / vat_amount
-- และภาษีหัก ณ ที่จ่ายเปลี่ยนไปคิดจาก before_vat (แต่ยังหักออกจาก sub_total ที่รวม VAT)

ALTER TABLE invoices
    ADD COLUMN before_vat DECIMAL(14,2) NOT NULL DEFAULT 0    AFTER sub_total,   -- ราคาก่อนภาษีมูลค่าเพิ่ม
    ADD COLUMN vat_rate   DECIMAL(5,2)  NOT NULL DEFAULT 7.00 AFTER before_vat,  -- ภาษีมูลค่าเพิ่ม (%)
    ADD COLUMN vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0    AFTER vat_rate;

ALTER TABLE receipts
    ADD COLUMN before_vat DECIMAL(14,2) NOT NULL DEFAULT 0    AFTER sub_total,
    ADD COLUMN vat_rate   DECIMAL(5,2)  NOT NULL DEFAULT 7.00 AFTER before_vat,
    ADD COLUMN vat_amount DECIMAL(14,2) NOT NULL DEFAULT 0    AFTER vat_rate;

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
