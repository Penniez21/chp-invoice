-- ผู้เสนอราคา: โลโก้ + บุคคลผู้เสนอราคา (MySQL)
--
-- โลโก้เก็บเป็น data URL (data:image/png;base64,...) อัปโหลดผ่านหน้าผู้เสนอราคา
-- ไม่ฝังไฟล์ไว้ในโค้ด เพราะ repo เป็น public · MEDIUMTEXT เพราะ TEXT ของ MySQL รับได้แค่ 64 KB
--
-- บุคคลผู้เสนอราคา (ชื่อ / โทร / อีเมล) = คนที่ดูแลใบเสนอราคา แสดงในกรอบเหลืองตามใบตัวอย่าง
-- คนละอย่างกับข้อมูลบริษัทที่หัวกระดาษ — ไม่บังคับกรอก
--
-- ใบเสนอราคา "คัดลอก" ค่าทั้งหมดไปเก็บในตัวเองเหมือนข้อมูลผู้เสนอราคาช่องอื่น

ALTER TABLE quoters
    ADD COLUMN logo          MEDIUMTEXT   NULL AFTER email,
    ADD COLUMN contact_name  VARCHAR(200) NULL AFTER logo,
    ADD COLUMN contact_phone VARCHAR(30)  NULL AFTER contact_name,
    ADD COLUMN contact_email VARCHAR(120) NULL AFTER contact_phone;

ALTER TABLE quotations
    ADD COLUMN seller_logo          MEDIUMTEXT   NULL AFTER seller_email,
    ADD COLUMN seller_contact_name  VARCHAR(200) NULL AFTER seller_logo,
    ADD COLUMN seller_contact_phone VARCHAR(30)  NULL AFTER seller_contact_name,
    ADD COLUMN seller_contact_email VARCHAR(120) NULL AFTER seller_contact_phone;
