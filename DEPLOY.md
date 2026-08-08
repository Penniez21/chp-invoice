# คู่มือขึ้นระบบ (ฟรี)

เอกสารนี้พาไปทีละขั้นจนเว็บใช้งานได้จริงบนอินเทอร์เน็ต โดยไม่มีค่าใช้จ่ายและไม่ต้องผูกบัตรเครดิต

| ส่วน | บริการ | ทำไมเลือกตัวนี้ |
|------|--------|-----------------|
| เว็บ (หน้าบ้าน + หลังบ้านรวมกัน) | [Koyeb](https://www.koyeb.com) Free | 1 service ฟรีถาวร · **ไม่ต้องใช้บัตร** · ไม่หลับเมื่อไม่มีคนใช้ |
| ฐานข้อมูล | [Aiven for MySQL](https://aiven.io/free-mysql-database) Free | MySQL จริง ฟรีถาวร ไม่ต้องใช้บัตร → ใช้ Flyway เดิมได้เลย ไม่ต้องแก้ SQL |
| Pipeline | GitHub Actions | ฟรีไม่จำกัดสำหรับ public repo |
| ที่เก็บ image | GitHub Container Registry | ฟรีสำหรับ public repo |

> **ทำไมรวมเป็น container เดียว** — Angular ถูก build แล้วฝังเข้าไปใน jar ของ Spring Boot
> จึงใช้ service ฟรีแค่ตัวเดียว ไม่ต้องตั้งค่า CORS และมี URL เดียวให้จำ

---

## ภาพรวมการทำงาน

```
push ขึ้น main
      │
      ├─ CI ────────► เทสหลังบ้าน (mvn verify) + build หน้าบ้าน
      │
      └─ Deploy ────► build Docker image ──► ดันขึ้น ghcr.io ──► Koyeb ดึง image ใหม่
```

---

## ขั้นที่ 1 — เอาโค้ดขึ้น GitHub

โปรเจกต์ถูก `git init` และ commit แรกไว้ให้แล้ว เหลือแค่สร้าง repo แล้ว push

1. สร้าง repo ใหม่ที่ https://github.com/new ตั้งชื่อ `chp-invoice` เลือก **Public** และ **อย่า** ติ๊กเพิ่ม README
2. กลับมาที่เครื่อง รันตามนี้ (แทน `<ชื่อผู้ใช้>` ด้วยของคุณ)

```bash
git remote add origin https://github.com/<ชื่อผู้ใช้>/chp-invoice.git
git branch -M main
git push -u origin main
```

พอ push เสร็จ แท็บ **Actions** จะเริ่มรัน CI ให้เองทันที

---

## ขั้นที่ 2 — สร้างฐานข้อมูล MySQL ที่ Aiven

1. สมัครที่ https://aiven.io (ใช้บัญชี GitHub ล็อกอินได้ ไม่ต้องใส่บัตร)
2. **Create service → MySQL** เลือกแพลน **Free** แล้วเลือก region ที่ใกล้ไทยที่สุด
3. รอสถานะเปลี่ยนเป็น *Running* (ประมาณ 2–5 นาที)
4. เข้าไปที่แท็บ **Overview** จดค่าต่อไปนี้ไว้

   | ค่าที่เห็นบน Aiven | เอาไปใส่เป็น |
   |---|---|
   | Host | `DB_HOST` |
   | Port | `DB_PORT` |
   | User | `DB_USER` |
   | Password | `DB_PASSWORD` |
   | Database name (`defaultdb`) | `DB_NAME` |

> ตารางทั้งหมดถูกสร้างโดย Flyway อัตโนมัติตอนแอปสตาร์ทครั้งแรก ไม่ต้องรัน SQL เอง

---

## ขั้นที่ 3 — เตรียมค่าลับ 2 ตัว

รันคำสั่งนี้เพื่อสุ่มค่า (หรือคิดเองก็ได้ แต่ JWT ต้องยาวอย่างน้อย 32 ตัวอักษร)

```bash
openssl rand -base64 48
```

- `JWT_SECRET` — เอาผลลัพธ์ที่ได้ไปใช้
- `ADMIN_PASSWORD` — ตั้งรหัสผู้ดูแลระบบใหม่ **ห้ามใช้ `admin123`**

> ทั้งสองตัว**ไม่มีค่าเริ่มต้นในโปรไฟล์ prod โดยตั้งใจ** ถ้าลืมตั้ง แอปจะไม่ยอมสตาร์ท
> ดีกว่าปล่อยให้ขึ้นระบบไปพร้อมรหัสที่ใคร ๆ ก็เดาได้

---

## ขั้นที่ 4 — deploy ขึ้น Koyeb

1. สมัครที่ https://www.koyeb.com ด้วยบัญชี GitHub
2. **Create Web Service → GitHub** แล้วเลือก repo `chp-invoice`
3. ตั้งค่าตามนี้

   | หัวข้อ | ค่า |
   |---|---|
   | Builder | **Dockerfile** |
   | Instance | **Free** (0.1 vCPU / 512MB) |
   | Port | `8000` |
   | Health check path | `/api/health` |

4. หัวข้อ **Environment variables** ใส่ให้ครบตามนี้

   ```
   SPRING_PROFILES_ACTIVE = prod
   DB_HOST         = <host จาก Aiven>
   DB_PORT         = <port จาก Aiven>
   DB_NAME         = defaultdb
   DB_USER         = avnadmin
   DB_PASSWORD     = <password จาก Aiven>
   JWT_SECRET      = <ค่าที่สุ่มไว้>
   ADMIN_PASSWORD  = <รหัสผู้ดูแลที่ตั้งเอง>
   ```

   > Koyeb กำหนด `PORT` มาให้เอง แอปอ่านค่านั้นอยู่แล้ว ไม่ต้องตั้งเพิ่ม

5. กด **Deploy** แล้วรอประมาณ 5–8 นาที (ครั้งแรกต้อง build ทั้ง Angular และ Maven)

เสร็จแล้วจะได้ URL หน้าตาแบบ `https://chp-invoice-<org>.koyeb.app`

---

## ขั้นที่ 5 — ตรวจว่าใช้งานได้จริง

```bash
curl https://<url-ของคุณ>/api/health
```

ต้องได้ `{"status":"UP",...}` จากนั้นเปิด URL ในเบราว์เซอร์แล้วไล่เช็ก

- [ ] หน้า login ขึ้นปกติ
- [ ] ล็อกอินด้วย `admin` + รหัสที่ตั้งใน `ADMIN_PASSWORD`
- [ ] **เข้าเมนู "บัญชีผู้ใช้" แล้วเปลี่ยนชื่อผู้ใช้จาก `admin` เป็นอย่างอื่น** — ชื่อ `admin` เดาง่ายและอยู่ในโค้ดที่เปิดสาธารณะ
- [ ] สร้างใบแจ้งหนี้ได้ 1 ใบ
- [ ] **กด refresh ที่หน้า `/invoices/1/report`** แล้วยังอยู่หน้าเดิม (พิสูจน์ว่า SPA fallback ทำงาน)
- [ ] ดาวน์โหลด PDF ได้ 2 หน้า
- [ ] เพิ่มบัญชีธนาคาร แล้วขึ้นบนใบแจ้งหนี้

---

## (ทางเลือก) ให้ deploy อัตโนมัติทุกครั้งที่ push

ค่าเริ่มต้น Koyeb จะ build ใหม่เองเมื่อ main เปลี่ยนอยู่แล้ว ถ้าอยากให้ Koyeb ดึง image ที่ CI build ไว้แทน (เร็วกว่า เพราะไม่ต้อง build ซ้ำ)

1. Koyeb → **Settings → API** สร้าง token
2. ที่ repo บน GitHub → **Settings → Secrets and variables → Actions**
   - **Secret** ชื่อ `KOYEB_API_TOKEN` = token ที่ได้
   - **Variable** ชื่อ `KOYEB_SERVICE_ID` = service id จาก Koyeb

`.github/workflows/deploy.yml` จะข้ามขั้นตอนนี้ไปเองถ้ายังไม่ได้ตั้งค่า จึงไม่ทำให้ workflow แดง

---

## ข้อจำกัดที่ควรรู้

- **RAM 512MB** — ตั้ง `-XX:MaxRAMPercentage=70` และใช้ SerialGC ไว้แล้วใน Dockerfile พอสำหรับผู้ใช้ไม่กี่คน ถ้าคนใช้เยอะขึ้นต้องอัปแพลน
- **0.1 vCPU** — request แรกหลังปลุกเครื่องอาจช้าสัก 2–3 วินาที
- **ฐานข้อมูลฟรี 1GB** — ใบแจ้งหนี้ระดับหลักหมื่นใบยังสบาย
- Aiven free tier เป็น single node **ไม่มี replica** เหมาะกับงานจริงขนาดเล็ก ไม่เหมาะกับงานที่ห้ามล่มเด็ดขาด

---

## แก้ปัญหาที่เจอบ่อย

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| แอปไม่สตาร์ท ขึ้น `Could not resolve placeholder 'JWT_SECRET'` | ลืมตั้ง env — ตั้งใจให้พังตั้งแต่ต้น ไม่ใช่บั๊ก |
| `Communications link failure` | `DB_HOST`/`DB_PORT` ผิด หรือ Aiven ยังไม่ *Running* |
| `Access denied for user` | `DB_USER`/`DB_PASSWORD` ผิด |
| เปิดหน้าเว็บได้แต่ refresh แล้ว 404 | ไฟล์ Angular ไม่ได้ถูกฝังลง jar — ดู log ของ stage `frontend` ใน Docker build |
| ล็อกอินไม่ผ่าน | `ADMIN_PASSWORD` จะมีผลเฉพาะตอนสร้าง user **ครั้งแรก** ถ้าจะเปลี่ยนทีหลังให้ใช้เมนู **บัญชีผู้ใช้** ในเว็บ (ไม่ต้องยุ่งกับฐานข้อมูล) |

---

## ⚠️ ช่องโหว่ที่ยังเปิดอยู่ — อ่านก่อนเปิดให้คนนอกใช้

**ยังไม่มีการจำกัดจำนวนครั้งที่ลองรหัสผ่านที่ `/api/auth/login`**

โค้ดเป็น public ใครก็เห็นว่า endpoint คืออะไร รูปแบบ JSON เป็นยังไง และชื่อผู้ใช้เริ่มต้นคือ `admin`
ตอนนี้ยิงสุ่มรหัสกี่ครั้งก็ได้ ไม่มีอะไรหยุด **ควรปิดช่องนี้ก่อนใช้งานจริงกับข้อมูลจริง**

สิ่งที่พอช่วยได้ทันทีระหว่างยังไม่ได้แก้
- เปลี่ยนชื่อผู้ใช้จาก `admin` (ผ่านเมนูบัญชีผู้ใช้)
- ตั้งรหัสผ่านยาว ๆ สุ่มจริง ไม่ใช่คำที่เดาได้

เรื่องอื่นที่ควรตามเก็บ
- `application.yml` (โปรไฟล์ dev) ยังมี JWT secret ค่าเริ่มต้นอยู่ในโค้ด — ปลอดภัยตราบใดที่ deploy ด้วย `SPRING_PROFILES_ACTIVE=prod` เท่านั้น
- `SecurityConfig` เปิด `/h2-console/**` แบบไม่มีเงื่อนไข (ตอนนี้ prod ไม่ได้เปิด console จึงตอบ 404)
- โทเคนเก็บใน `localStorage` อายุ 8 ชั่วโมง และยกเลิกกลางคันไม่ได้
