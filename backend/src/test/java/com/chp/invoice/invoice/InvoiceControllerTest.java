package com.chp.invoice.invoice;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class InvoiceControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    private String sampleInvoiceJson() throws Exception {
        Map<String, Object> body = Map.of(
                "invoiceNo", "001",
                "poNo", "001",
                "issueDate", "2026-07-24",
                "dueDate", "2026-07-24",
                "issuerName", "สุพัตรา เพ็งแจ่ม",
                "issuerTaxId", "1321000389206",
                "recipientName", "ห้างหุ้นส่วนจำกัด แม็กซ์ แอนด์ ซัน",
                "recipientTaxId", "0103545021199",
                "whtRate", 3.00,
                "items", java.util.List.of(
                        Map.of("description", "งานรื้อถอน", "quantity", 2, "unitPrice", 100),
                        Map.of("description", "ค่าขนย้าย", "quantity", 1, "unitPrice", 50)
                )
        );
        return om.writeValueAsString(body);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void create_computesTotalsAndWht3Percent() throws Exception {
        // subTotal = 2*100 + 1*50 = 250 (รวม VAT แล้ว) ; ก่อน VAT = 250×100/107 = 233.64 ; VAT = 16.36
        // wht 3% ของ 233.64 = 7.0092 → 7.01 ; net = 250 − 7.01 = 242.99
        mvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sampleInvoiceJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.subTotal").value(250.00))
                .andExpect(jsonPath("$.beforeVat").value(233.64))
                .andExpect(jsonPath("$.vatRate").value(7.00))
                .andExpect(jsonPath("$.vatAmount").value(16.36))
                .andExpect(jsonPath("$.whtRate").value(3.00))
                .andExpect(jsonPath("$.whtAmount").value(7.01))
                .andExpect(jsonPath("$.netTotal").value(242.99))
                .andExpect(jsonPath("$.grandTotal").value(250.00))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].lineTotal").value(200.00));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createThenGet_returnsSavedInvoice() throws Exception {
        String location = mvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sampleInvoiceJson()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long id = om.readTree(location).get("id").asLong();

        mvc.perform(get("/api/invoices/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceNo").value("001"))
                .andExpect(jsonPath("$.issuerName").value("สุพัตรา เพ็งแจ่ม"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void project_isTrimmed_andBlankBecomesNull() throws Exception {
        String withProject = om.writeValueAsString(Map.of(
                "invoiceNo", "P-1", "project", "  งานวางท่อ  ", "issueDate", "2026-07-24",
                "issuerName", "A", "recipientName", "B", "whtRate", 3.00,
                "items", java.util.List.of(Map.of("description", "x", "quantity", 1, "unitPrice", 1))
        ));
        mvc.perform(post("/api/invoices").contentType(MediaType.APPLICATION_JSON).content(withProject))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.project").value("งานวางท่อ"));

        String blankProject = om.writeValueAsString(Map.of(
                "invoiceNo", "P-2", "project", "   ", "issueDate", "2026-07-24",
                "issuerName", "A", "recipientName", "B", "whtRate", 3.00,
                "items", java.util.List.of(Map.of("description", "x", "quantity", 1, "unitPrice", 1))
        ));
        mvc.perform(post("/api/invoices").contentType(MediaType.APPLICATION_JSON).content(blankProject))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.project").doesNotExist());
    }

    /** ใบแจ้งหนี้ 1 รายการ 1,000 บาท หัก ณ ที่จ่าย 3% — ใช้ทดสอบ VAT แต่ละแบบ */
    private Map<String, Object> thousandBaht(String vatMode) {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("invoiceNo", "VAT-" + vatMode);
        body.put("issueDate", "2026-11-18");
        body.put("issuerName", "A");
        body.put("recipientName", "B");
        body.put("whtRate", 3.00);
        body.put("vatMode", vatMode);
        body.put("vatRate", 7);
        body.put("items", java.util.List.of(Map.of("description", "งาน", "quantity", 1, "unitPrice", 1000)));
        return body;
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void vatModes_likeTheQuotation_withWhtFromThePriceBeforeVat() throws Exception {
        // รวม VAT แล้ว: ก่อน VAT 934.58 · VAT 65.42 · ทั้งหมด 1,000 · หัก 3% ของ 934.58 = 28.04 · ชำระ 971.96
        mvc.perform(post("/api/invoices").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(thousandBaht("INCLUDED"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.beforeVat").value(934.58))
                .andExpect(jsonPath("$.vatAmount").value(65.42))
                .andExpect(jsonPath("$.grandTotal").value(1000.00))
                .andExpect(jsonPath("$.whtAmount").value(28.04))
                .andExpect(jsonPath("$.netTotal").value(971.96));

        // บวก VAT เพิ่ม: ก่อน VAT 1,000 · VAT 70 · ทั้งหมด 1,070 · หัก 3% ของ 1,000 = 30 · ชำระ 1,040
        mvc.perform(post("/api/invoices").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(thousandBaht("EXCLUDED"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vatMode").value("EXCLUDED"))
                .andExpect(jsonPath("$.beforeVat").value(1000.00))
                .andExpect(jsonPath("$.vatAmount").value(70.00))
                .andExpect(jsonPath("$.grandTotal").value(1070.00))
                .andExpect(jsonPath("$.whtAmount").value(30.00))
                .andExpect(jsonPath("$.netTotal").value(1040.00));

        // ไม่มี VAT: ทั้งหมด 1,000 · หัก 30 · ชำระ 970
        mvc.perform(post("/api/invoices").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(thousandBaht("NONE"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vatAmount").value(0.00))
                .andExpect(jsonPath("$.grandTotal").value(1000.00))
                .andExpect(jsonPath("$.whtAmount").value(30.00))
                .andExpect(jsonPath("$.netTotal").value(970.00));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void chequeDetails_areKeptOnlyWhenPaidByCheque() throws Exception {
        Map<String, Object> body = thousandBaht("INCLUDED");
        body.put("paymentMethod", "CHEQUE");
        body.put("chequeBank", " กสิกรไทย ");
        body.put("chequeBranch", "สีลม");
        body.put("chequeNo", "1234567");
        body.put("chequeDate", "2026-11-20");
        mvc.perform(post("/api/invoices").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethod").value("CHEQUE"))
                .andExpect(jsonPath("$.chequeBank").value("กสิกรไทย"))
                .andExpect(jsonPath("$.chequeDate").value("2026-11-20"));

        body.put("paymentMethod", "CASH");
        mvc.perform(post("/api/invoices").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.chequeBank").doesNotExist())
                .andExpect(jsonPath("$.chequeNo").doesNotExist());

        // โอนเงิน: เอกสารแสดงบัญชีธนาคารจากเมนูบัญชีธนาคาร — รายละเอียดเช็คที่ค้างมาในคำขอต้องไม่ถูกเก็บ
        body.put("paymentMethod", "TRANSFER");
        mvc.perform(post("/api/invoices").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethod").value("TRANSFER"))
                .andExpect(jsonPath("$.chequeBank").doesNotExist())
                .andExpect(jsonPath("$.chequeDate").doesNotExist());
    }

    @Test
    void create_withoutAuth_returns401() throws Exception {
        mvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sampleInvoiceJson()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void create_withNoItems_returns400() throws Exception {
        String body = om.writeValueAsString(Map.of(
                "invoiceNo", "002",
                "issueDate", "2026-07-24",
                "issuerName", "A",
                "recipientName", "B",
                "whtRate", 3.00,
                "items", java.util.List.of()
        ));
        mvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
