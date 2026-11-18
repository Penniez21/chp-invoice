package com.chp.invoice.quoter.dto;

import com.chp.invoice.quoter.Quoter;
import com.chp.invoice.quoter.QuoterService;

public record QuoterResponse(
        Long id,
        String name,
        String taxId,
        String address,
        String phone,
        String email,
        String logo,
        String contactName,
        String contactPhone,
        String contactEmail,
        /** มีค่าเฉพาะตอนบันทึก: จำนวนใบเสนอราคาเดิมที่เพิ่งได้โลโก้นี้ไป (หน้าเว็บแจ้งผู้ใช้) */
        Integer logoAppliedToQuotations
) {
    public static QuoterResponse from(QuoterService.SaveResult saved) {
        return from(saved.quoter(), saved.logoAppliedToQuotations());
    }

    public static QuoterResponse from(Quoter q) {
        return from(q, null);
    }

    private static QuoterResponse from(Quoter q, Integer logoAppliedToQuotations) {
        return new QuoterResponse(
                q.getId(),
                q.getName(),
                q.getTaxId(),
                q.getAddress(),
                q.getPhone(),
                q.getEmail(),
                q.getLogo(),
                q.getContactName(),
                q.getContactPhone(),
                q.getContactEmail(),
                logoAppliedToQuotations);
    }
}
