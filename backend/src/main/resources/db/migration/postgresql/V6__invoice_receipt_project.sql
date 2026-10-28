-- ชื่อโครงการของใบแจ้งหนี้และใบเสร็จรับเงิน (PostgreSQL) — เทียบเท่ากับ db/migration/mysql/V6__invoice_receipt_project.sql
-- ไม่บังคับ ใช้ตั้งชื่อไฟล์ PDF เช่น "Invoice-014-ชื่อโครงการ" แบบเดียวกับใบเสนอราคา

ALTER TABLE invoices ADD COLUMN project VARCHAR(255);
ALTER TABLE receipts ADD COLUMN project VARCHAR(255);
