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
        // subTotal = 2*100 + 1*50 = 250 ; wht 3% = 7.50 ; net = 242.50
        mvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sampleInvoiceJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.subTotal").value(250.00))
                .andExpect(jsonPath("$.whtRate").value(3.00))
                .andExpect(jsonPath("$.whtAmount").value(7.50))
                .andExpect(jsonPath("$.netTotal").value(242.50))
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
