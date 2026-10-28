-- ชื่อโครงการของใบแจ้งหนี้และใบเสร็จรับเงิน (MySQL) — ไม่บังคับ
-- ใช้ตั้งชื่อไฟล์ PDF เช่น "Invoice-014-ชื่อโครงการ" แบบเดียวกับใบเสนอราคา

ALTER TABLE invoices ADD COLUMN project VARCHAR(255) NULL AFTER po_no;
ALTER TABLE receipts ADD COLUMN project VARCHAR(255) NULL AFTER po_no;
