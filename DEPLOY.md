# คู่มือขึ้นระบบ (ฟรี)

เอกสารนี้พาไปทีละขั้นจนเว็บใช้งานได้จริงบนอินเทอร์เน็ต โดยไม่มีค่าใช้จ่ายและไม่ต้องผูกบัตรเครดิต

| ส่วน | บริการ | ทำไมเลือกตัวนี้ |
|------|--------|-----------------|
| เว็บ (หน้าบ้าน + หลังบ้านรวมกัน) | [Koyeb](https://www.koyeb.com) Free | 1 service ฟรีถาวร · **ไม่ต้องใช้บัตร** · ไม่หลับเมื่อไม่มีคนใช้ |
| ฐานข้อมูล | [Neon](https://neon.com) Free (PostgreSQL) | ฟรีถาวร ไม่ต้องใช้บัตร 0.5GB · 100 CU-hours/เดือน |
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

## ขั้นที่ 2 — สร้างฐานข้อมูล PostgreSQL ที่ Neon

1. สมัครที่ https://neon.com (ใช้บัญชี GitHub ล็อกอินได้ ไม่ต้องใส่บัตร)
2. **Create project** ตั้งชื่อ `chp-invoice` เลือก region ที่ใกล้ไทยที่สุด (เช่น Singapore)
3. หน้าถัดมาจะโชว์ **Connection string** หน้าตาแบบนี้

   ```
   postgresql://<user>:<password>@ep-xxxx-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

4. แยกค่าออกมาใส่ตามนี้

   | ส่วนใน connection string | เอาไปใส่เป็น |
   |---|---|
   | หลัง `@` ถึงก่อน `/` | `DB_HOST` |
   | (Neon ใช้ 5432 เสมอ) | `DB_PORT` = `5432` |
   | หลัง `/` ก่อน `?` (ปกติ `neondb`) | `DB_NAME` |
   | หลัง `postgresql://` ก่อน `:` | `DB_USER` |
   | ระหว่าง `:` กับ `@` | `DB_PASSWORD` |

> ตารางทั้งหมดถูกสร้างโดย Flyway อัตโนมัติตอนแอปสตาร์ทครั้งแรก ไม่ต้องรัน SQL เอง

### อยากใช้ MySQL แทนก็ได้

โปรเจกต์รองรับทั้งสองฐานข้อมูล — migration แยกโฟลเดอร์ไว้ที่ `db/migration/mysql` และ `db/migration/postgresql`
Flyway เลือกให้เองตามชนิดฐานข้อมูล ถ้าจะใช้ MySQL แค่ตั้ง env เพิ่ม 2 ตัว **ไม่ต้องแก้โค้ด**

```
DB_URL    = jdbc:mysql://<host>:<port>/<db>?useUnicode=true&characterEncoding=UTF-8&sslMode=REQUIRED
DB_DRIVER = com.mysql.cj.jdbc.Driver
```

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
   DB_HOST         = <host จาก Neon เช่น ep-xxxx.ap-southeast-1.aws.neon.tech>
   DB_PORT         = 5432
   DB_NAME         = neondb
   DB_USER         = <user จาก Neon>
   DB_PASSWORD     = <password จาก Neon>
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
- **ฐานข้อมูลฟรี 0.5GB** — ใบแจ้งหนี้ระดับหลักหมื่นใบยังสบาย
- **Neon หลับหลังไม่มีคนใช้ 5 นาที** — คำขอแรกหลังปลุกจะช้ากว่าปกติเล็กน้อย แล้วกลับมาเร็วเหมือนเดิม
- **100 CU-hours/เดือน** — นับเฉพาะตอนฐานข้อมูลตื่น ระบบที่มีคนใช้ไม่กี่คนใช้ไม่ถึงเพดาน ถ้าเกินจะหยุดจนถึงรอบบิลถัดไป
- Neon free เป็น single node **ไม่มี replica** เหมาะกับงานจริงขนาดเล็ก ไม่เหมาะกับงานที่ห้ามล่มเด็ดขาด

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

## การป้องกันการสุ่มรหัสผ่าน

`/api/auth/login` จำกัดจำนวนครั้งที่ผิดไว้แล้ว นับแยกสองแกน

| แกน | เกณฑ์ | กันอะไร |
|---|---|---|
| ชื่อผู้ใช้ + IP | ผิด 5 ครั้ง / 15 นาที → ล็อก 15 นาที | จ้องเดารหัสบัญชีหนึ่งจากเครื่องหนึ่ง |
| IP | ผิด 20 ครั้ง / 15 นาที → ล็อก 15 นาที | ไล่ยิงหลายชื่อผู้ใช้จากเครื่องเดียว |

ตอบ `429` พร้อมส่วนหัว `Retry-After` และข้อความไทยบอกเวลาที่ต้องรอ ล็อกอินสำเร็จจะล้างตัวนับทันที

**ทำไมล็อกที่ "ชื่อผู้ใช้ + IP" ไม่ใช่ที่ชื่อผู้ใช้อย่างเดียว** — ระบบนี้มีผู้ดูแลคนเดียว ถ้าล็อกทั้งบัญชี ใครก็ตามที่ยิงรหัสผิดรัว ๆ จะล็อกเจ้าของออกจากระบบตัวเองได้ตลอดเวลา กลายเป็นเปิดช่องโจมตีแบบใหม่แทน

ปรับค่าได้ผ่าน env ถ้าต้องการ

```
app.login-throttle.max-per-user   (ค่าเริ่มต้น 5)
app.login-throttle.max-per-ip     (ค่าเริ่มต้น 20)
app.login-throttle.window-minutes (ค่าเริ่มต้น 15)
app.login-throttle.lock-minutes   (ค่าเริ่มต้น 15)
```

> **ข้อจำกัด:** ตัวนับเก็บในหน่วยความจำ เหมาะกับการรัน instance เดียว (แพลนฟรีของ Koyeb)
> ถ้าขยายเป็นหลาย instance ต้องย้ายไปเก็บส่วนกลาง เช่น Redis ไม่งั้นตัวนับจะแยกกันคนละเครื่อง

## ⚠️ เรื่องที่ยังควรตามเก็บ
- `application.yml` (โปรไฟล์ dev) ยังมี JWT secret ค่าเริ่มต้นอยู่ในโค้ด — ปลอดภัยตราบใดที่ deploy ด้วย `SPRING_PROFILES_ACTIVE=prod` เท่านั้น
- `SecurityConfig` เปิด `/h2-console/**` แบบไม่มีเงื่อนไข (ตอนนี้ prod ไม่ได้เปิด console จึงตอบ 404)
- โทเคนเก็บใน `localStorage` อายุ 8 ชั่วโมง และยกเลิกกลางคันไม่ได้
