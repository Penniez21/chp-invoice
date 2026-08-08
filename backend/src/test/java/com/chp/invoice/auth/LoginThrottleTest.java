package com.chp.invoice.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ยืนยันว่าการจำกัดจำนวนครั้งล็อกอินผิดทำงานจริง
 *
 * ใช้ context แยก (มี @TestPropertySource เป็นของตัวเอง) เพื่อไม่ให้ตัวนับ
 * ไปปนกับ AuthControllerTest ซึ่งมีการล็อกอินผิดอยู่ 1 ครั้ง
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "app.login-throttle.max-per-user=3",
        "app.login-throttle.max-per-ip=100",
        "app.login-throttle.window-minutes=15",
        "app.login-throttle.lock-minutes=15",
})
class LoginThrottleTest {

    @Autowired
    private MockMvc mvc;

    private org.springframework.test.web.servlet.ResultActions attempt(String username, String password, String ip)
            throws Exception {
        return mvc.perform(post("/api/auth/login")
                .header("X-Forwarded-For", ip)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"));
    }

    @Test
    void lockedOut_afterTooManyWrongPasswords() throws Exception {
        String user = "throttle-victim";
        String ip = "203.0.113.10";

        // ผิดครบโควตา — ยังตอบ 401 ตามปกติ
        for (int i = 0; i < 3; i++) {
            attempt(user, "wrong" + i, ip).andExpect(status().isUnauthorized());
        }

        // ครั้งถัดไปต้องโดนล็อก แม้จะยังเป็นรหัสผิดเหมือนเดิม
        attempt(user, "wrong-again", ip)
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void lockIsPerUsername_notGlobal() throws Exception {
        String ip = "203.0.113.20";

        for (int i = 0; i < 3; i++) {
            attempt("locked-user", "nope" + i, ip).andExpect(status().isUnauthorized());
        }
        attempt("locked-user", "nope", ip).andExpect(status().isTooManyRequests());

        // ผู้ใช้อื่นจาก IP เดิมต้องยังล็อกอินได้ (โควตาต่อ IP ตั้งไว้สูงในเทสนี้)
        attempt("admin", "admin123", ip).andExpect(status().isOk());
    }

    /**
     * สำคัญที่สุด: ผู้โจมตีต้องล็อกเจ้าของออกจากระบบตัวเองไม่ได้
     * ระบบนี้มีผู้ดูแลคนเดียว ถ้าล็อกทั้งบัญชีจะกลายเป็นช่องโจมตีแบบ denial of service
     */
    @Test
    void lockDoesNotSpreadToOtherIps() throws Exception {
        String attackerIp = "198.51.100.66";
        String ownerIp = "198.51.100.77";

        for (int i = 0; i < 3; i++) {
            attempt("admin", "guess" + i, attackerIp).andExpect(status().isUnauthorized());
        }
        attempt("admin", "guess", attackerIp).andExpect(status().isTooManyRequests());

        // เจ้าของยังเข้าจาก IP ของตัวเองได้ตามปกติ
        attempt("admin", "admin123", ownerIp).andExpect(status().isOk());
    }

    @Test
    void successfulLogin_clearsFailureCount() throws Exception {
        String ip = "203.0.113.30";

        // ผิด 2 ครั้ง (ยังไม่ถึงเกณฑ์ 3)
        attempt("admin", "wrong1", ip).andExpect(status().isUnauthorized());
        attempt("admin", "wrong2", ip).andExpect(status().isUnauthorized());

        // ล็อกอินถูก → ตัวนับต้องถูกล้าง
        attempt("admin", "admin123", ip).andExpect(status().isOk());

        // ผิดอีก 2 ครั้งต้องยังไม่โดนล็อก เพราะเริ่มนับใหม่
        attempt("admin", "wrong3", ip).andExpect(status().isUnauthorized());
        attempt("admin", "wrong4", ip).andExpect(status().isUnauthorized());
    }
}
