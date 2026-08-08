package com.chp.invoice.auth.dto;

public record LoginResponse(
        String token,
        String username,
        String role
) {
}
