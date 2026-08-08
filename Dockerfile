# ===== Stage 1: build หน้าบ้าน (Angular) =====
# ต้อง build บน Linux เพราะเครื่อง Windows ของผู้พัฒนาเปิด Smart App Control อยู่
# ทำให้ native binary ของ oxc-parser ที่ Angular ใช้ตอน production build ถูกบล็อก
FROM node:22-alpine AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ===== Stage 2: build หลังบ้าน (Spring Boot) พร้อมฝังไฟล์หน้าบ้านเข้าไปใน jar =====
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app/backend

# คัดลอก pom ก่อนเพื่อให้ layer ของ dependency ถูก cache ไว้
COPY backend/pom.xml ./
RUN mvn -B -q dependency:go-offline

COPY backend/src ./src
# Angular ที่ build แล้วไปอยู่ใน classpath:/static/ → Spring Boot เสิร์ฟเป็นหน้าเว็บได้เลย
COPY --from=frontend /app/frontend/dist/frontend/browser ./src/main/resources/static

RUN mvn -B -q clean package -DskipTests

# ===== Stage 3: runtime =====
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# ไม่รันด้วย root
RUN addgroup -S app && adduser -S -G app app
COPY --from=backend /app/backend/target/*.jar app.jar
RUN chown -R app:app /app
USER app

ENV SPRING_PROFILES_ACTIVE=prod
# instance ฟรีของ Koyeb มี RAM 512MB — จำกัด heap ไว้ที่ 70% กันโดน OOM kill
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
