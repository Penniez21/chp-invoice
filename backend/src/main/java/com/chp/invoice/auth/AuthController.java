package com.chp.invoice.auth;

import com.chp.invoice.auth.dto.LoginRequest;
import com.chp.invoice.auth.dto.LoginResponse;
import com.chp.invoice.user.User;
import com.chp.invoice.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final LoginAttemptService loginAttempts;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          UserRepository userRepository,
                          LoginAttemptService loginAttempts) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.loginAttempts = loginAttempts;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                   HttpServletRequest httpRequest) {
        String clientIp = clientIp(httpRequest);

        // ตรวจก่อนแตะฐานข้อมูล — ติดล็อกอยู่ก็ไม่ต้องเสียแรงตรวจรหัส
        loginAttempts.checkAllowed(request.username(), clientIp);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (BadCredentialsException e) {
            loginAttempts.recordFailure(request.username(), clientIp);
            return ResponseEntity.status(401)
                    .body(Map.of("message", "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"));
        }

        loginAttempts.recordSuccess(request.username(), clientIp);

        User user = userRepository.findByUsername(request.username()).orElseThrow();
        String token = jwtService.generateToken(user.getUsername(), user.getRole());
        return ResponseEntity.ok(new LoginResponse(token, user.getUsername(), user.getRole()));
    }

    /**
     * บน Koyeb/Render คำขอผ่าน proxy — getRemoteAddr() จะได้ IP ของ proxy เหมือนกันหมด
     * ต้องอ่าน X-Forwarded-For ตัวแรกซึ่งเป็น IP ของผู้ใช้จริง
     */
    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /** คืนข้อมูลผู้ใช้ปัจจุบันจาก token (ใช้เช็คสถานะล็อกอินฝั่ง frontend) */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "ยังไม่ได้เข้าสู่ระบบ"));
        }
        return ResponseEntity.ok(Map.of(
                "username", authentication.getName(),
                "authorities", authentication.getAuthorities()
        ));
    }
}
