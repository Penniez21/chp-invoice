-- ผู้เสนอราคา: โลโก้ + บุคคลผู้เสนอราคา (PostgreSQL)
-- เทียบเท่ากับ db/migration/mysql/V8__quoter_logo_and_contact.sql
-- โลโก้เก็บเป็น data URL · อัปโหลดผ่านหน้าผู้เสนอราคา ไม่ฝังไฟล์ไว้ในโค้ด เพราะ repo เป็น public

ALTER TABLE quoters
    ADD COLUMN logo          TEXT,
    ADD COLUMN contact_name  VARCHAR(200),
    ADD COLUMN contact_phone VARCHAR(30),
    ADD COLUMN contact_email VARCHAR(120);

ALTER TABLE quotations
    ADD COLUMN seller_logo          TEXT,
    ADD COLUMN seller_contact_name  VARCHAR(200),
    ADD COLUMN seller_contact_phone VARCHAR(30),
    ADD COLUMN seller_contact_email VARCHAR(120);
