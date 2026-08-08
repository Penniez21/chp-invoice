package com.chp.invoice.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * จำกัดจำนวนครั้งที่ล็อกอินผิด เพื่อกันการสุ่มรหัสผ่าน
 *
 * นับแยกสองแกน เพราะกันคนละรูปแบบการโจมตี
 *   - ต่อ "ชื่อผู้ใช้ + IP" (5 ครั้ง) — กันการจ้องเดารหัสของบัญชีหนึ่งจากเครื่องหนึ่ง
 *   - ต่อ "IP" (20 ครั้ง)             — กันการไล่ยิงหลายชื่อผู้ใช้จากเครื่องเดียว
 *
 * ทำไมไม่ล็อกที่ "ชื่อผู้ใช้" อย่างเดียว: ระบบนี้มีผู้ดูแลคนเดียว ถ้าล็อกทั้งบัญชี
 * ใครก็ตามที่ยิงรหัสผิดรัว ๆ จะล็อกเจ้าของออกจากระบบตัวเองได้ตลอดเวลา
 * กลายเป็นเปิดช่องโจมตีแบบใหม่แทน จึงผูกกับ IP ต้นทางด้วย
 *
 * เก็บสถานะไว้ในหน่วยความจำ เหมาะกับการรัน instance เดียว (แพลนฟรีของ Koyeb)
 * ถ้าวันหน้าขยายเป็นหลาย instance ต้องย้ายไปเก็บที่ส่วนกลาง เช่น Redis
 * ไม่งั้นตัวนับจะแยกกันคนละเครื่องและกันได้ไม่จริง
 */
@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    /** กันหน่วยความจำบวมถ้าโดนยิงถล่มด้วย IP/ชื่อผู้ใช้มั่ว ๆ จำนวนมาก */
    private static final int MAX_TRACKED_KEYS = 10_000;

    private final int maxPerUser;
    private final int maxPerIp;
    private final Duration window;
    private final Duration lockDuration;

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();

    public LoginAttemptService(
            @Value("${app.login-throttle.max-per-user:5}") int maxPerUser,
            @Value("${app.login-throttle.max-per-ip:20}") int maxPerIp,
            @Value("${app.login-throttle.window-minutes:15}") long windowMinutes,
            @Value("${app.login-throttle.lock-minutes:15}") long lockMinutes) {
        this.maxPerUser = maxPerUser;
        this.maxPerIp = maxPerIp;
        this.window = Duration.ofMinutes(windowMinutes);
        this.lockDuration = Duration.ofMinutes(lockMinutes);
    }

    /** เรียกก่อนตรวจรหัสผ่าน — โยน TooManyAttemptsException ถ้ายังติดล็อกอยู่ */
    public void checkAllowed(String username, String clientIp) {
        assertNotLocked(userKey(username, clientIp));
        assertNotLocked(ipKey(clientIp));
    }

    public void recordFailure(String username, String clientIp) {
        register(userKey(username, clientIp), maxPerUser);
        register(ipKey(clientIp), maxPerIp);
    }

    /** ล็อกอินสำเร็จ = ล้างประวัติทั้งสองแกน */
    public void recordSuccess(String username, String clientIp) {
        entries.remove(userKey(username, clientIp));
        entries.remove(ipKey(clientIp));
    }

    // ---- ภายใน ----

    private void assertNotLocked(String key) {
        Entry e = entries.get(key);
        if (e == null || e.lockedUntil == null) return;

        Instant now = Instant.now();
        if (e.lockedUntil.isAfter(now)) {
            long secondsLeft = Duration.between(now, e.lockedUntil).getSeconds();
            throw new TooManyAttemptsException(Math.max(1, secondsLeft));
        }
    }

    private void register(String key, int max) {
        if (entries.size() > MAX_TRACKED_KEYS) {
            sweepExpired();
        }
        entries.compute(key, (k, e) -> {
            Instant now = Instant.now();
            Entry entry = (e == null) ? new Entry() : e;

            // ทิ้งความพยายามที่เก่ากว่าช่วงเวลาที่นับ
            entry.failures.removeIf(t -> t.isBefore(now.minus(window)));
            entry.failures.addLast(now);

            if (entry.failures.size() >= max) {
                entry.lockedUntil = now.plus(lockDuration);
                entry.failures.clear();
                log.warn("ล็อกการเข้าสู่ระบบชั่วคราวสำหรับ {} เป็นเวลา {} นาที", k, lockDuration.toMinutes());
            }
            return entry;
        });
    }

    /** ลบรายการที่หมดอายุทั้งหมดทิ้ง เรียกเมื่อ map ใหญ่เกินกำหนด */
    private void sweepExpired() {
        Instant now = Instant.now();
        entries.entrySet().removeIf(en -> {
            Entry v = en.getValue();
            boolean lockExpired = v.lockedUntil == null || v.lockedUntil.isBefore(now);
            boolean noRecentFailures = v.failures.stream().noneMatch(t -> t.isAfter(now.minus(window)));
            return lockExpired && noRecentFailures;
        });
    }

    private static String userKey(String username, String clientIp) {
        String u = (username == null) ? "" : username.trim().toLowerCase();
        return "user:" + u + "@" + (clientIp == null ? "unknown" : clientIp);
    }

    private static String ipKey(String clientIp) {
        return "ip:" + (clientIp == null ? "unknown" : clientIp);
    }

    private static final class Entry {
        private final Deque<Instant> failures = new ArrayDeque<>();
        private Instant lockedUntil;
    }
}
