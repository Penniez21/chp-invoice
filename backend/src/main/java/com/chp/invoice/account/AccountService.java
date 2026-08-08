package com.chp.invoice.account;

import com.chp.invoice.account.dto.ChangePasswordRequest;
import com.chp.invoice.account.dto.ChangeUsernameRequest;
import com.chp.invoice.auth.JwtService;
import com.chp.invoice.auth.dto.LoginResponse;
import com.chp.invoice.user.User;
import com.chp.invoice.user.UserRepository;
import com.chp.invoice.web.BadRequestException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * แก้ไขบัญชีผู้ใช้ของตัวเอง — ทุกคำสั่งต้องยืนยันด้วยรหัสผ่านปัจจุบัน
 *
 * เปลี่ยนชื่อผู้ใช้แล้วโทเคนเดิมใช้ไม่ได้ เพราะ JWT ใช้ username เป็น subject
 * จึงต้องออกโทเคนใหม่คืนไปให้ frontend เก็บแทนของเดิม ผู้ใช้จะได้ไม่หลุดออกจากระบบ
 */
@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AccountService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public LoginResponse changePassword(String currentUsername, ChangePasswordRequest req) {
        User user = requireUser(currentUsername);
        requireCurrentPassword(user, req.currentPassword());

        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        return issueToken(user);
    }

    @Transactional
    public LoginResponse changeUsername(String currentUsername, ChangeUsernameRequest req) {
        User user = requireUser(currentUsername);
        requireCurrentPassword(user, req.currentPassword());

        String next = req.newUsername().trim();
        if (next.equals(user.getUsername())) {
            throw new BadRequestException("ชื่อผู้ใช้ใหม่ต้องไม่ซ้ำกับชื่อเดิม");
        }
        if (userRepository.existsByUsername(next)) {
            throw new BadRequestException("ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว");
        }

        user.setUsername(next);
        userRepository.save(user);

        return issueToken(user);
    }

    private User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("ไม่พบบัญชีผู้ใช้"));
    }

    /** ข้อความเดียวกันทุกกรณีที่รหัสผิด — ไม่บอกใบ้ว่าพลาดตรงไหน */
    private void requireCurrentPassword(User user, String rawPassword) {
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadRequestException("รหัสผ่านปัจจุบันไม่ถูกต้อง");
        }
    }

    private LoginResponse issueToken(User user) {
        String token = jwtService.generateToken(user.getUsername(), user.getRole());
        return new LoginResponse(token, user.getUsername(), user.getRole());
    }
}
