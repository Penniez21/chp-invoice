package com.chp.invoice.config;

import com.chp.invoice.user.User;
import com.chp.invoice.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * สร้างผู้ใช้ admin เริ่มต้นถ้ายังไม่มี (idempotent)
 * - โปรไฟล์ MySQL: Flyway seed ให้แล้ว → ตัวนี้จะข้าม
 * - โปรไฟล์ H2 (dev): Flyway ปิด, Hibernate สร้างตาราง → ตัวนี้จะ seed ให้
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    /** รหัสสำหรับ dev เท่านั้น — โปรไฟล์ prod บังคับให้ตั้ง ADMIN_PASSWORD เอง */
    private static final String DEV_PASSWORD = "admin123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:" + DEV_PASSWORD + "}")
    private String adminPassword;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername(adminUsername)) {
            User admin = new User(
                    adminUsername,
                    passwordEncoder.encode(adminPassword),
                    "ADMIN");
            userRepository.save(admin);
            log.info("Seeded admin user '{}'", adminUsername);
        }
        if (DEV_PASSWORD.equals(adminPassword)) {
            log.warn("!! ใช้รหัสผ่าน admin ค่าเริ่มต้นอยู่ — ห้ามใช้แบบนี้บนเซิร์ฟเวอร์จริง ตั้ง ADMIN_PASSWORD ด้วย");
        }
    }
}
