package com.chp.invoice.account;

import com.chp.invoice.account.dto.ChangePasswordRequest;
import com.chp.invoice.account.dto.ChangeUsernameRequest;
import com.chp.invoice.auth.dto.LoginResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * จัดการบัญชีของผู้ใช้ที่ล็อกอินอยู่เท่านั้น — ชื่อผู้ใช้มาจาก token ไม่ใช่จาก body
 * จึงแก้บัญชีคนอื่นไม่ได้แม้จะยิง request เอง
 */
@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService service;

    public AccountController(AccountService service) {
        this.service = service;
    }

    @PutMapping("/password")
    public LoginResponse changePassword(Authentication auth,
                                        @Valid @RequestBody ChangePasswordRequest req) {
        return service.changePassword(auth.getName(), req);
    }

    @PutMapping("/username")
    public LoginResponse changeUsername(Authentication auth,
                                        @Valid @RequestBody ChangeUsernameRequest req) {
        return service.changeUsername(auth.getName(), req);
    }
}
