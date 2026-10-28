package com.chp.invoice.receipt;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class ReceiptControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    private String sampleReceiptJson(String receiptNo) throws Exception {
        return om.writeValueAsString(Map.of(
                "receiptNo", receiptNo,
                "issueDate", "2026-10-27",
                "issuerName", "ผู้ออก ตัวอย่าง",
                "recipientName", "ผู้รับ ตัวอย่าง",
                "whtRate", 3.00,
                "items", List.of(
                        Map.of("description", "งาน A", "quantity", 2, "unitPrice", 1500),
                        Map.of("description", "งาน B", "quantity", 3, "unitPrice", 250.5)
                )
        ));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void create_computesTotalsLikeAnInvoice() throws Exception {
        // 3,000 + 751.50 = 3,751.50 ; หัก 3% = 112.545 → 112.55 ; สุทธิ 3,638.95
        mvc.perform(post("/api/receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sampleReceiptJson("001")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.receiptNo").value("001"))
                .andExpect(jsonPath("$.subTotal").value(3751.50))
                .andExpect(jsonPath("$.whtAmount").value(112.55))
                .andExpect(jsonPath("$.netTotal").value(3638.95))
                .andExpect(jsonPath("$.items.length()").value(2));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void nextNumbers_startAtPS032_thenFollowHighestPSNumber() throws Exception {
        // ระบบเดิมใช้ถึง PS-031 — ยังไม่มีใบ PS- ในระบบนี้ (เลขรูปแบบอื่น เช่น 001 ไม่นับ) → PS-032
        mvc.perform(get("/api/receipts/next-numbers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptNo").value("PS-032"));

        // เลขต่ำกว่า 032 ที่พิมพ์เองไม่ดึงเลขรันถอยหลัง
        mvc.perform(post("/api/receipts").contentType(MediaType.APPLICATION_JSON).content(sampleReceiptJson("PS-005")))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/receipts/next-numbers"))
                .andExpect(jsonPath("$.receiptNo").value("PS-032"));

        mvc.perform(post("/api/receipts").contentType(MediaType.APPLICATION_JSON).content(sampleReceiptJson("PS-040")))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/receipts/next-numbers"))
                .andExpect(jsonPath("$.receiptNo").value("PS-041"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void create_withoutReceiptNo_returns400WithThaiMessage() throws Exception {
        String body = om.writeValueAsString(Map.of(
                "receiptNo", "",
                "issueDate", "2026-10-27",
                "issuerName", "A",
                "recipientName", "B",
                "whtRate", 3.00,
                "items", List.of(Map.of("description", "x", "quantity", 1, "unitPrice", 1))
        ));
        mvc.perform(post("/api/receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("กรุณากรอกเลขที่ใบเสร็จรับเงิน"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void project_isSavedAndReturned() throws Exception {
        String body = om.writeValueAsString(Map.of(
                // เลขที่ไม่ใช่ตัวเลขล้วน — เลขรันข้ามไป จึงไม่ไปรบกวน nextNumbers_runSeparatelyFromInvoices
                "receiptNo", "R-PROJECT", "project", "งานวางท่อ", "issueDate", "2026-10-27",
                "issuerName", "A", "recipientName", "B", "whtRate", 3.00,
                "items", List.of(Map.of("description", "x", "quantity", 1, "unitPrice", 1))
        ));
        String created = mvc.perform(post("/api/receipts").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = om.readTree(created).get("id").asLong();

        mvc.perform(get("/api/receipts/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project").value("งานวางท่อ"));
    }

    @Test
    void list_withoutAuth_returns401() throws Exception {
        mvc.perform(get("/api/receipts"))
                .andExpect(status().isUnauthorized());
    }
}
