# ระบบทำรายงานผู้เสียภาษี (Taxpayer Report System)

เอกสารสรุปแผนงาน / Design Document — ฉบับร่างเพื่อพิจารณา

> เป้าหมายเฟสแรก: ระบบมี **หน้า Login (admin 1 คน)** → **เมนูเลือกประเภทรายงาน** → เมนูแรกคือ **ใบแจ้งหนี้ (Invoice)** ที่กรอกข้อมูล บันทึกลงฐานข้อมูล และออกรายงานที่จัดหน้าตาสวยงาม/เป็นทางการ พร้อมสั่งพิมพ์ได้

---

## 1. ภาพรวมระบบ (Overview)

```
[ Admin ] → Login → Dashboard (เลือกเมนู)
                         │
                         └── เมนู "ใบแจ้งหนี้"
                                 ├── หน้าฟอร์มกรอกข้อมูล  (Invoice Form)
                                 ├── กดบันทึก → เก็บลงฐานข้อมูล
                                 ├── กดถัดไป → หน้ารายงาน (Report Preview)
                                 └── กดพิมพ์ → พิมพ์ / ออก PDF
```

- ผู้ใช้งานมีคนเดียว (admin) — ไม่มีระบบสมัครสมาชิก
- ออกแบบให้ **ขยายเมนูเพิ่มในอนาคตได้ง่าย** (ตอนนี้มีแค่ "ใบแจ้งหนี้")
- รายงานเรนเดอร์จาก **หลังบ้าน (backend)** ตามที่ต้องการ โดยใช้ฟิลด์เดียวกับไฟล์ตัวอย่าง แต่จัดวางให้เป็นทางการและอ่านง่ายกว่าเดิม

---

## 2. Tech Stack & เวอร์ชัน

| ส่วน | เทคโนโลยี | เวอร์ชันที่แนะนำ (ใหม่/LTS) |
|------|-----------|------------------------------|
| Frontend | **Angular + TypeScript** (standalone components, signals) | Angular **20**, TypeScript **5.6+** |
| Runtime/Build tool | **Node.js** | **22 LTS** (npm 10+) |
| UI Styling | **Tailwind CSS** + **SCSS** (ผสมกัน) | Tailwind **3.4+** |
| Backend | **Java + Spring Boot** | Java **21 (LTS)**, Spring Boot **3.5.x** |
| Database | **MySQL** ✅ | MySQL **8.x** |
| ORM | Spring Data JPA + Hibernate | มากับ Spring Boot |
| Auth | Spring Security + JWT | มากับ Spring Boot |
| PDF รายงาน | **OpenPDF** (สร้าง PDF จากหลังบ้าน) ✅ | OpenPDF 2.x + ฟอนต์ไทย (Sarabun) |
| Build (backend) | Maven หรือ Gradle | Maven 3.9+ |

> **หมายเหตุเรื่อง UI:** ใช้ **Tailwind** เป็นหลักสำหรับ layout/spacing/utility และใช้ **SCSS** สำหรับตัวแปรสีธีม (design tokens) + สไตล์เฉพาะของหน้ารายงานเพื่อให้พิมพ์สวย

---

## 3. ธีมสี (Color Theme) — เขียวพาสเทล + เหลืองพาสเทล

กำหนดเป็น design tokens (SCSS variables / Tailwind config) เพื่อใช้ทั้งระบบ:

| Token | ชื่อ | ค่า HEX (เสนอ) | ใช้กับ |
|-------|------|----------------|--------|
| `--color-primary` | เขียวพาสเทล | `#A8D5BA` | ปุ่มหลัก, header, แถบสรุปยอด |
| `--color-primary-dark` | เขียวเข้ม (ตัวหนังสือ/hover) | `#6FBF95` | hover, ข้อความเน้น |
| `--color-secondary` | เหลืองพาสเทล | `#FCE8A6` | แถบเน้น, badge, พื้นหลังหัวข้อ |
| `--color-secondary-dark` | เหลืองเข้ม | `#F5D06F` | เส้นขอบ/เน้นรอง |
| `--color-bg` | พื้นหลังอ่อน | `#F7FBF8` | พื้นหลังหน้า |
| `--color-surface` | การ์ด/กล่อง | `#FFFFFF` | การ์ด, ตาราง |
| `--color-text` | ตัวอักษรหลัก | `#2E3A32` | เนื้อหา |
| `--color-border` | เส้นขอบ | `#E3EDE7` | เส้นแบ่ง/ตาราง |

> ปรับค่า HEX ได้ตามใจภายหลัง — โครงสร้าง token เดิมไม่ต้องแก้

**สไตล์ที่วางไว้:** โทนอ่อน สะอาดตา, ปุ่มมุมโค้ง, การ์ดมีเงาอ่อน ๆ, หน้ารายงานเน้นความเป็นทางการ (หัวกระดาษ, ตารางเส้นชัด, แถบยอดรวมสีเขียวพาสเทล)

---

## 4. รายละเอียดฟีเจอร์ (Features)

### 4.1 หน้า Login (Admin)
- ช่องกรอก: `username`, `password`
- มี admin 1 คน (สร้างไว้ล่วงหน้าใน DB, รหัสผ่านเข้ารหัสด้วย BCrypt)
- ล็อกอินสำเร็จ → ได้ **JWT token** → เก็บใน memory/localStorage → เข้าหน้า Dashboard
- ทุกหน้าใน (ยกเว้น login) ต้องมี token — ป้องกันด้วย Route Guard (frontend) + Spring Security (backend)

### 4.2 หน้า Dashboard / เมนู
- แสดงเมนูแบบการ์ด — ตอนนี้มี 1 เมนู: **"ใบแจ้งหนี้"**
- ออกแบบเป็น grid ให้เพิ่มเมนูใหม่ในอนาคตได้ (เช่น ใบเสร็จ, รายงานภาษี ฯลฯ)

### 4.3 หน้าฟอร์มใบแจ้งหนี้ (Invoice Form)
ช่องกรอกตามไฟล์แนบ แบ่งเป็นกลุ่ม:

**ก) ข้อมูลใบแจ้งหนี้ (Invoice Info)**
- เลขที่ใบแจ้งหนี้ (invoiceNo)
- หมายเลขสั่งซื้อ (poNo)
- วันที่ (issueDate)
- กำหนดส่ง (dueDate)

**ข) ผู้ออก (Issuer)**
- ชื่อ (issuerName)
- เลขประจำตัวผู้เสียภาษี / เลขบัตร ปชช. 13 หลัก (issuerTaxId)
- ที่อยู่ (issuerAddress)
- อีเมล (issuerEmail)
- เบอร์โทร (issuerPhone)

**ค) ผู้รับ (Recipient)**
- ชื่อ/บริษัท (recipientName)
- เลขประจำตัวผู้เสียภาษี (recipientTaxId)
- ที่อยู่ (recipientAddress)
- เบอร์โทร (recipientPhone)

**ง) รายการสินค้า/บริการ (Line Items) — เพิ่มได้หลายแถว**
- คำอธิบาย (description)
- ปริมาณ (quantity)
- ราคาต่อหน่วย (unitPrice)
- ทั้งหมด (lineTotal = quantity × unitPrice, คำนวณอัตโนมัติ)

**จ) สรุปยอด (Totals) — คำนวณอัตโนมัติ**
- ยอดรวมย่อย (subTotal)
- **ภาษีหัก ณ ที่จ่าย 3% (withholdingTax)** = subTotal × 3% *(อัตราตั้งค่าได้ ค่าเริ่มต้น 3%)*
- **ยอดชำระสุทธิ (netTotal)** = subTotal − withholdingTax
- *ไม่มี VAT ตามไฟล์ตัวอย่าง (โครงสร้าง DB เผื่อฟิลด์ VAT ไว้ได้ แต่ UI ไม่แสดง)*

  ```
  ยอดรวมย่อย            50,000.00
  หัก ภาษี ณ ที่จ่าย 3%  −1,500.00
  ─────────────────────────────────
  ยอดชำระสุทธิ          48,500.00
  ```

**การทำงานบนฟอร์ม**
- Validation ทุกช่องที่จำเป็น (เลขผู้เสียภาษี 13 หลัก, วันที่, ตัวเลข ≥ 0)
- คำนวณยอดแบบ real-time ด้วย Angular signals
- ปุ่ม: **บันทึก** (Save) → **ถัดไป/ดูรายงาน** (Next → Report) → **พิมพ์** (Print)

### 4.4 หน้ารายงาน (Report / Preview)
- ดึงข้อมูลที่บันทึกจากหลังบ้านมาเรนเดอร์เป็นเอกสารทางการ
- เค้าโครง: หัวกระดาษ "ใบแจ้งหนี้" + ผู้ออก/ผู้รับ + ตารางรายการ + แถบสรุปยอด (โทนเขียวพาสเทล)
- ปุ่ม **พิมพ์/ดาวน์โหลด PDF** → เรียก API `GET /api/invoices/{id}/report` → หลังบ้านสร้าง **ไฟล์ PDF ด้วย OpenPDF** (ฝังฟอนต์ไทย Sarabun ให้ตัวอักษรไทยไม่เพี้ยน) แล้วส่งกลับให้ดาวน์โหลด/พิมพ์
- หน้า preview บนเว็บใช้ธีมเดียวกับ PDF เพื่อให้เห็นตรงกับที่พิมพ์ออกมา

### 4.5 บันทึกลงฐานข้อมูล
- กด "บันทึก" → เรียก API → เก็บลงตาราง `invoices` + `invoice_items`
- แก้ไข/ดูย้อนหลังได้ (ในเฟสถัดไปเพิ่มหน้า "รายการใบแจ้งหนี้ทั้งหมด")

---

## 5. โครงสร้างฐานข้อมูล (Database Schema)

```sql
-- ผู้ใช้งาน admin
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,      -- BCrypt
  role          VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
  created_at    TIMESTAMP DEFAULT now()
);

-- ใบแจ้งหนี้ (หัวเอกสาร)
CREATE TABLE invoices (
  id                BIGSERIAL PRIMARY KEY,
  invoice_no        VARCHAR(50) NOT NULL,
  po_no             VARCHAR(50),
  issue_date        DATE NOT NULL,
  due_date          DATE,

  issuer_name       VARCHAR(255) NOT NULL,
  issuer_tax_id     VARCHAR(13),
  issuer_address    TEXT,
  issuer_email      VARCHAR(120),
  issuer_phone      VARCHAR(30),

  recipient_name    VARCHAR(255) NOT NULL,
  recipient_tax_id  VARCHAR(13),
  recipient_address TEXT,
  recipient_phone   VARCHAR(30),

  sub_total          NUMERIC(14,2) NOT NULL DEFAULT 0,
  wht_rate           NUMERIC(5,2)  NOT NULL DEFAULT 3.00,   -- ภาษีหัก ณ ที่จ่าย (%)
  wht_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,      -- จำนวนเงินที่หัก
  net_total          NUMERIC(14,2) NOT NULL DEFAULT 0,      -- ยอดชำระสุทธิ (subTotal − wht)
  grand_total        NUMERIC(14,2) NOT NULL DEFAULT 0,      -- คงไว้เผื่อ VAT อนาคต (ตอนนี้ = sub_total)

  created_at         TIMESTAMP DEFAULT now(),
  updated_at         TIMESTAMP DEFAULT now()
);

-- รายการในใบแจ้งหนี้
CREATE TABLE invoice_items (
  id           BIGSERIAL PRIMARY KEY,
  invoice_id   BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description  VARCHAR(500) NOT NULL,
  quantity     NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price   NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total   NUMERIC(14,2) NOT NULL DEFAULT 0,
  sort_order   INT DEFAULT 0
);
```

---

## 6. API Endpoints (Spring Boot REST)

| Method | Path | หน้าที่ | Auth |
|--------|------|---------|------|
| `POST` | `/api/auth/login` | ล็อกอิน คืน JWT | ไม่ต้อง |
| `GET`  | `/api/invoices` | รายการใบแจ้งหนี้ทั้งหมด | ต้อง |
| `GET`  | `/api/invoices/{id}` | ดูใบเดียว (สำหรับหน้ารายงาน) | ต้อง |
| `POST` | `/api/invoices` | สร้าง + บันทึก | ต้อง |
| `PUT`  | `/api/invoices/{id}` | แก้ไข | ต้อง |
| `DELETE` | `/api/invoices/{id}` | ลบ | ต้อง |
| `GET`  | `/api/invoices/{id}/report` | (ตัวเลือก) ออก PDF จากหลังบ้าน | ต้อง |

**ตัวอย่าง JSON บันทึกใบแจ้งหนี้**
```json
{
  "invoiceNo": "001",
  "poNo": "001",
  "issueDate": "2026-07-24",
  "dueDate": "2026-07-24",
  "issuer": {
    "name": "สุพัตรา เพ็งแจ่ม",
    "taxId": "1321000389206",
    "address": "96 หมู่ที่ 2 ต.ทับทัน อ.สังขะ จ.สุรินทร์ 32150",
    "email": "chatchapol1998@gmail.com",
    "phone": "061-5188790"
  },
  "recipient": {
    "name": "ห้างหุ้นส่วนจำกัด แม็กซ์ แอนด์ ซัน เฟอร์นิเจอร์ (สำนักงานใหญ่)",
    "taxId": "0103545021199",
    "address": "50/246 หมู่ที่ 14 ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ 10540",
    "phone": "062 8232394"
  },
  "items": [
    { "description": "งานรื้อถอน", "quantity": 1, "unitPrice": 50000.00, "lineTotal": 50000.00 }
  ],
  "subTotal": 50000.00,
  "whtRate": 3.00,
  "whtAmount": 1500.00,
  "netTotal": 48500.00,
  "grandTotal": 50000.00
}
```

---

## 7. โครงสร้างโปรเจค (Folder Structure)

```
chp-invoice/
├── frontend/                      # Angular 20
│   ├── src/app/
│   │   ├── core/                  # services, guards, interceptors (JWT)
│   │   ├── auth/                  # หน้า login
│   │   ├── dashboard/             # หน้าเมนู
│   │   ├── features/invoice/
│   │   │   ├── invoice-form/      # ฟอร์มกรอก
│   │   │   ├── invoice-report/    # หน้ารายงาน/พิมพ์
│   │   │   └── invoice.service.ts
│   │   └── shared/                # components, models, ui
│   ├── src/styles/                # SCSS tokens ธีมเขียว/เหลืองพาสเทล
│   └── tailwind.config.js
│
└── backend/                       # Spring Boot 3.5 (Java 21)
    ├── src/main/java/.../
    │   ├── config/                # SecurityConfig, CORS
    │   ├── auth/                  # controller, jwt
    │   ├── invoice/               # controller, service, repository, entity, dto
    │   └── user/
    ├── src/main/resources/
    │   ├── application.yml
    │   └── db/migration/          # Flyway SQL (สร้างตาราง + seed admin)
    └── pom.xml
```

---

## 8. แผนการพัฒนา (Development Phases)

| เฟส | งาน | ผลลัพธ์ |
|-----|-----|---------|
| **1. Setup** | สร้างโปรเจค Angular + Spring Boot, ตั้ง Tailwind/SCSS, ต่อ DB, ธีมสี | โปรเจครันได้ หน้าเปล่า |
| **2. Auth** | Login + JWT + Guard + seed admin | ล็อกอินเข้าระบบได้ |
| **3. Dashboard** | หน้าเมนูการ์ด | เข้าเมนู "ใบแจ้งหนี้" ได้ |
| **4. Invoice Form** | ฟอร์มกรอก + validation + คำนวณยอด + บันทึก API | กรอกแล้วบันทึกลง DB ได้ |
| **5. Report/Print** | หน้ารายงานสวยงาม + พิมพ์ | ดู/พิมพ์รายงานได้ |
| **6. เก็บกวาด** | รายการย้อนหลัง, แก้ไข, (ตัวเลือก) PDF หลังบ้าน | ครบ flow |

---

## 9. ข้อสรุปที่ยืนยันแล้ว ✅

| หัวข้อ | สรุป |
|--------|------|
| **ฐานข้อมูล** | **MySQL 8** |
| **การออกรายงาน** | **สร้าง PDF จากหลังบ้าน** (OpenPDF + ฟอนต์ไทย Sarabun) |
| **VAT/ส่วนลด** | **ไม่มี VAT** (ตามไฟล์) |
| **ภาษีหัก ณ ที่จ่าย** | **มี — หัก 3%** จากยอดรวมย่อย แสดงยอดชำระสุทธิ |
| **UI (ค่าเริ่มต้น)** | Tailwind + SCSS ผสม (ยังปรับได้) |
| **ธีมสี (ค่าเริ่มต้น)** | เขียวพาสเทล `#A8D5BA` + เหลืองพาสเทล `#FCE8A6` (ปรับ HEX ได้ภายหลัง) |

> รอปรับ 2 ข้อ (UI แบบผสม/ล้วน และค่าสี HEX) หากไม่แจ้ง จะใช้ค่าเริ่มต้นด้านบน แล้วเริ่มลงมือสร้างโครงโปรเจคจริงตามเฟสในข้อ 8 ได้เลย
