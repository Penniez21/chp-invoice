# ระบบทำรายงานผู้เสียภาษี (chp-invoice)

ระบบสำหรับ admin กรอกข้อมูล → บันทึกลงฐานข้อมูล → ออกรายงานใบแจ้งหนี้เป็น PDF

> รายละเอียดการออกแบบทั้งหมดดูที่ [PLAN.md](PLAN.md)

## Tech Stack

| ส่วน | เทคโนโลยี | เวอร์ชันในเครื่องนี้ |
|------|-----------|----------------------|
| Frontend | Angular + TypeScript + Tailwind CSS v4 + SCSS | Angular 22, Node 22 |
| Backend | Java + Spring Boot + Spring Data JPA + Flyway | Java 21 (build) / JDK 25 (runtime), Spring Boot 3.5.6 |
| Database | MySQL | 8.x |
| รายงาน | OpenPDF (สร้าง PDF ฝั่งหลังบ้าน) | 2.0.3 |

ธีมสี: เขียวพาสเทล `#A8D5BA` + เหลืองพาสเทล `#FCE8A6`

---

## โครงสร้างโปรเจค

```
chp-invoice/
├── PLAN.md              # เอกสารออกแบบ
├── frontend/            # Angular app
└── backend/             # Spring Boot app
    └── src/main/resources/db/migration/  # Flyway (สร้างตาราง + seed admin)
```

---

## สิ่งที่ต้องมี (Prerequisites)

- **Node.js 22+** และ npm
- **JDK 21+** (เครื่องนี้ใช้ JDK 25) + **Maven 3.9+**
- **MySQL 8** — *ยังไม่ได้ติดตั้งในเครื่องนี้* ต้องติดตั้งก่อนรัน backend

### ติดตั้ง MySQL (ครั้งเดียว)

1. ติดตั้ง MySQL 8 (เช่น MySQL Community Server หรือ XAMPP)
2. ฐานข้อมูลชื่อ `chp_invoice` จะถูกสร้างอัตโนมัติ (มี `createDatabaseIfNotExist=true`)
   หรือสร้างเองด้วย:
   ```sql
   CREATE DATABASE chp_invoice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. ตั้งค่าการเชื่อมต่อผ่าน environment variable (ค่าเริ่มต้นในวงเล็บ):
   `DB_HOST(localhost)` · `DB_PORT(3306)` · `DB_NAME(chp_invoice)` · `DB_USER(root)` · `DB_PASSWORD(root)`

---

## วิธีรัน

> Backend รันที่ **พอร์ต 8082** (บนเครื่องนี้ 8080 ถูก Docker และ 8081 ถูกแอปอื่นใช้อยู่) — เปลี่ยนได้ด้วย env `SERVER_PORT`
> ถ้าเปลี่ยนพอร์ต อย่าลืมแก้ target ใน `frontend/proxy.conf.json` ให้ตรงกัน
> Frontend dev server จะ **proxy `/api` ไป backend อัตโนมัติ** (ดู `frontend/proxy.conf.json`) จึงไม่ต้องแก้ URL ในโค้ด

### Backend — โหมด dev (H2 in-memory, ไม่ต้องมี MySQL) ✅ แนะนำสำหรับทดสอบเร็ว

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```
Hibernate จะสร้างตารางให้ และ seed ผู้ใช้ **admin / admin123** อัตโนมัติ (ข้อมูลหายเมื่อปิดโปรแกรม)

### Backend — โหมดจริง (MySQL)

```bash
cd backend
mvn spring-boot:run
```
ครั้งแรก Flyway จะสร้างตาราง `users`, `invoices`, `invoice_items` และ seed ผู้ใช้ **admin / admin123**

ทดสอบว่ารันอยู่: เปิด http://localhost:8082/api/health

### Frontend (พอร์ต 4200)

```bash
cd frontend
npm install     # ครั้งแรกเท่านั้น
npm start
```
เปิด http://localhost:4200 → ระบบจะเด้งไปหน้า **เข้าสู่ระบบ** ให้ล็อกอินด้วย admin / admin123

> ℹ️ **หมายเหตุ — production build (`npm run build`) ในเครื่องนี้**
> เครื่องนี้เปิด **Smart App Control (Windows)** อยู่ ทำให้ไฟล์ native binary ของ `oxc-parser`
> (`parser.win32-x64-msvc.node` ที่ Angular ใช้ตอน build production) ถูกบล็อก → `npm run build` จะ error
> `Cannot find native binding / Application Control policy has blocked this file`
>
> **การพัฒนาไม่ได้รับผลกระทบ** — `npm start` (dev server) ทำงานปกติเพราะใช้ TypeScript compiler ธรรมดา
>
> ถ้าต้องการ build production บนเครื่องนี้ เลือกอย่างใดอย่างหนึ่ง:
> 1. **Build บน CI/CD (Linux)** — วิธีที่แนะนำสำหรับ deploy จริง (ไม่มีนโยบายนี้)
> 2. ให้ฝ่าย IT อนุญาต (allowlist) ไฟล์ `.node` ใน Application Control policy
> 3. ปิด Smart App Control — *ไม่แนะนำ* (ปิดแล้วเปิดกลับไม่ได้ ต้องลง Windows ใหม่)

---

## สถานะการพัฒนา

- [x] **Phase 1 — Setup:** โครง Angular + Spring Boot, Tailwind/SCSS + ธีม, config MySQL + Flyway, health check
- [x] **Phase 2 — Auth:** Login + JWT + Route Guard + HTTP interceptor + ล็อกดาวน์ API (มี 6 integration tests ผ่านครบ)
- [x] **Phase 3 — Dashboard/เมนู:** หน้าเมนูการ์ด (เผื่อเพิ่มเมนู) + ปุ่มออกจากระบบ
- [x] **Phase 4 — ฟอร์มใบแจ้งหนี้:** กรอกข้อมูล + เพิ่มรายการหลายแถว + คำนวณยอด/ภาษีหัก ณ ที่จ่าย 3% อัตโนมัติ + บันทึกลง DB + หน้ารายงาน (คำนวณยอดฝั่งเซิร์ฟเวอร์, มี 4 integration tests)
- [x] **Phase 5 — ออก PDF:** สร้างฝั่ง client จากหน้ารายงานจริง (html-to-image + jsPDF) → ได้ไฟล์เหมือนบนเว็บ **ภาษาไทยถูกต้อง 100%** (ฟอนต์ Sarabun self-host ที่ `frontend/public/fonts/`) และปุ่ม "พิมพ์" ก็ซ่อน UI ให้เหลือแต่เอกสาร
  > *หมายเหตุ: เดิมลองใช้ OpenPDF ฝั่งเซิร์ฟเวอร์ แต่ OpenPDF/iText เรนเดอร์วรรณยุกต์ซ้อนสระของไทยไม่ได้ (ที่→ที) จึงเปลี่ยนมาสร้างฝั่ง client ที่เบราว์เซอร์จัดวางไทยถูกต้อง*
- [x] **UI premium:** ธีมมิ้น-มัสตาร์ด + โหมด light/soft(ถนอมสายตา)/dark, sidebar + navbar, โลโก้ TaxFlow, login split-screen, stepper, spinner, ตารางค้นหา autocomplete + pagination (10/20/50/100 ต่อหน้า) + แก้ไข/ลบ
- [ ] Phase 6 — รายการย้อนหลัง/แก้ไข

> ⚠️ บัญชี admin เริ่มต้น (`admin` / `admin123`) เป็นค่าตั้งต้นสำหรับพัฒนา — เปลี่ยนรหัสก่อนใช้งานจริง
