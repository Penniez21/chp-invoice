package com.chp.invoice.quotation;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class QuotationControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper om;

    /** ใบเสนอราคาตามไฟล์ตัวอย่าง: งานวางท่อรางน้ำตัวยู 1 งาน 32,500 บาท ราคารวม VAT 7% แล้ว */
    private Map<String, Object> sampleQuotation(String vatMode, List<Map<String, Object>> items) {
        Map<String, Object> body = new HashMap<>();
        body.put("quotationNo", "PSPO-066");
        body.put("issueDate", "2026-10-20");
        body.put("customerNo", "07");
        body.put("project", "งานวางท่อน้ำสำเร็จรูปตัวยู");
        body.put("location", "จ.กรุงเทพมหานคร");
        body.put("sellerName", "บริษัท ตัวอย่าง จำกัด");
        body.put("customerName", "บริษัท ลูกค้า จำกัด");
        body.put("vatMode", vatMode);
        body.put("vatRate", 7);
        body.put("items", items);
        return body;
    }

    private static Map<String, Object> item(String description, Object qty, Object price) {
        Map<String, Object> it = new HashMap<>();
        it.put("description", description);
        it.put("quantity", qty);
        it.put("unit", "งาน");
        it.put("unitPrice", price);
        return it;
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void vatIncluded_splitsVatOutOfThePrice_likeTheSampleDocument() throws Exception {
        Map<String, Object> line = item("งานวางท่อรางน้ำตัวยู สำเร็จรูป", 1, 32500);
        line.put("details", "เทลีน\nวางท่อรางตัวยูสำเร็จรูป\nเก็บฉาบรอยต่อ");

        mvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(sampleQuotation("INCLUDED", List.of(line)))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemsTotal").value(32500.00))
                .andExpect(jsonPath("$.beforeVat").value(30373.83))
                .andExpect(jsonPath("$.vatAmount").value(2126.17))
                .andExpect(jsonPath("$.grandTotal").value(32500.00))
                .andExpect(jsonPath("$.items[0].details").value("เทลีน\nวางท่อรางตัวยูสำเร็จรูป\nเก็บฉาบรอยต่อ"))
                .andExpect(jsonPath("$.items[0].unit").value("งาน"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void vatExcluded_addsVatOnTop() throws Exception {
        // 3 × 333.33 = 999.99 ; VAT 7% = 69.9993 → 70.00 ; รวม 1,069.99
        mvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(sampleQuotation("EXCLUDED", List.of(item("ค่าแรง", 3, 333.33))))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemsTotal").value(999.99))
                .andExpect(jsonPath("$.beforeVat").value(999.99))
                .andExpect(jsonPath("$.vatAmount").value(70.00))
                .andExpect(jsonPath("$.grandTotal").value(1069.99));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void noVat_grandTotalEqualsItems() throws Exception {
        mvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(sampleQuotation("NONE",
                                List.of(item("ค่าวัสดุ", 2, 1500), item("ค่าขนส่ง", 1, 250.5))))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itemsTotal").value(3250.50))
                .andExpect(jsonPath("$.vatAmount").value(0.00))
                .andExpect(jsonPath("$.grandTotal").value(3250.50));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void createThenGet_returnsSavedQuotation() throws Exception {
        String created = mvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(sampleQuotation("INCLUDED", List.of(item("งาน", 1, 100))))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = om.readTree(created).get("id").asLong();

        mvc.perform(get("/api/quotations/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quotationNo").value("PSPO-066"))
                .andExpect(jsonPath("$.customerNo").value("07"))
                .andExpect(jsonPath("$.vatMode").value("INCLUDED"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void create_withoutCustomer_returns400WithThaiMessage() throws Exception {
        Map<String, Object> body = sampleQuotation("INCLUDED", List.of(item("งาน", 1, 100)));
        body.put("customerName", "");
        mvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("กรุณากรอกชื่อลูกค้า"));
    }

    /** PNG ขนาด 1×1 พิกเซล — พอสำหรับทดสอบว่าโลโก้ถูกเก็บและส่งกลับ */
    private static final String TINY_PNG = "data:image/png;base64,"
            + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void sellerLogo_isReturnedOnTheDocument_butNotInTheList() throws Exception {
        Map<String, Object> body = sampleQuotation("INCLUDED", List.of(item("งาน", 1, 100)));
        body.put("quotationNo", "LOGO-1");
        body.put("sellerLogo", TINY_PNG);
        String created = mvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sellerLogo").value(TINY_PNG))
                .andReturn().getResponse().getContentAsString();
        long id = om.readTree(created).get("id").asLong();

        mvc.perform(get("/api/quotations/{id}", id))
                .andExpect(jsonPath("$.sellerLogo").value(TINY_PNG));
        // หน้ารายการไม่ส่งโลโก้ — data URL หลายสิบ KB ต่อใบ และตารางไม่ได้ใช้
        mvc.perform(get("/api/quotations"))
                .andExpect(jsonPath("$[?(@.quotationNo == 'LOGO-1')].sellerLogo").value(org.hamcrest.Matchers.contains((Object) null)));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void sellerContactPerson_isSavedOnQuoterAndQuotation() throws Exception {
        Map<String, Object> quoter = new HashMap<>();
        quoter.put("name", "บริษัท ผู้เสนอ ทดสอบ จำกัด");
        quoter.put("contactName", "  นายทดสอบ ผู้ดูแล  ");
        quoter.put("contactPhone", "0812345678");
        quoter.put("contactEmail", "sales@example.com");
        mvc.perform(post("/api/quoters").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(quoter)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contactName").value("นายทดสอบ ผู้ดูแล"))
                .andExpect(jsonPath("$.contactPhone").value("0812345678"));

        quoter.put("contactPhone", "081-234");
        mvc.perform(post("/api/quoters").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(quoter)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("เบอร์โทรผู้เสนอราคา (บุคคล) ต้องเป็นตัวเลข 10 หลัก"));

        Map<String, Object> body = sampleQuotation("INCLUDED", List.of(item("งาน", 1, 100)));
        body.put("sellerContactName", "นายทดสอบ ผู้ดูแล");
        body.put("sellerContactEmail", "sales@example.com");
        mvc.perform(post("/api/quotations").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sellerContactName").value("นายทดสอบ ผู้ดูแล"))
                .andExpect(jsonPath("$.sellerContactEmail").value("sales@example.com"))
                .andExpect(jsonPath("$.sellerContactPhone").doesNotExist());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void savingQuoterLogo_fillsOnlyItsOldQuotationsThatHaveNoLogo() throws Exception {
        String name = "บริษัท เติมโลโก้ย้อนหลัง จำกัด";
        String taxId = "0105559000018";
        String ownLogo = TINY_PNG;
        String quoterLogo = "data:image/png;base64,QUJDRA==";

        long noLogo = createQuotation(name, taxId, null);
        long hasOwnLogo = createQuotation(name, taxId, ownLogo);
        long otherTaxId = createQuotation(name, "0105559000026", null);

        Map<String, Object> quoter = new HashMap<>();
        quoter.put("name", name);
        quoter.put("taxId", taxId);
        quoter.put("logo", quoterLogo);
        mvc.perform(post("/api/quoters").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(quoter)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.logoAppliedToQuotations").value(1));

        mvc.perform(get("/api/quotations/{id}", noLogo)).andExpect(jsonPath("$.sellerLogo").value(quoterLogo));
        mvc.perform(get("/api/quotations/{id}", hasOwnLogo)).andExpect(jsonPath("$.sellerLogo").value(ownLogo));
        mvc.perform(get("/api/quotations/{id}", otherTaxId)).andExpect(jsonPath("$.sellerLogo").doesNotExist());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void quotationWithoutLogo_takesTheSavedQuotersLogo() throws Exception {
        // ฟอร์มไม่มีช่องโลโก้แล้ว — พิมพ์ชื่อผู้เสนอราคาเองก็ยังได้โลโก้จากเมนูผู้เสนอราคา
        String name = "บริษัท โลโก้จากเมนู จำกัด";
        String taxId = "0105559000034";
        String quoterLogo = "data:image/png;base64,TUVOVQ==";
        Map<String, Object> quoter = new HashMap<>();
        quoter.put("name", name);
        quoter.put("taxId", taxId);
        quoter.put("logo", quoterLogo);
        mvc.perform(post("/api/quoters").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(quoter)))
                .andExpect(status().isCreated());

        long withoutLogo = createQuotation(name, taxId, null);
        mvc.perform(get("/api/quotations/{id}", withoutLogo)).andExpect(jsonPath("$.sellerLogo").value(quoterLogo));

        // ใบที่ส่งโลโก้ของตัวเองมา (เช่น แก้ไขใบเดิม) ใช้โลโก้นั้น ไม่ถูกแทน
        long ownLogo = createQuotation(name, taxId, TINY_PNG);
        mvc.perform(get("/api/quotations/{id}", ownLogo)).andExpect(jsonPath("$.sellerLogo").value(TINY_PNG));
    }

    private long createQuotation(String sellerName, String sellerTaxId, String sellerLogo) throws Exception {
        Map<String, Object> body = sampleQuotation("INCLUDED", List.of(item("งาน", 1, 100)));
        body.put("sellerName", sellerName);
        body.put("sellerTaxId", sellerTaxId);
        body.put("sellerLogo", sellerLogo);
        String created = mvc.perform(post("/api/quotations").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(created).get("id").asLong();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void quoterLogo_mustBeAPngJpgOrWebpDataUrl() throws Exception {
        Map<String, Object> quoter = new HashMap<>();
        quoter.put("name", "ผู้เสนอราคา ทดสอบโลโก้");
        quoter.put("logo", TINY_PNG);
        mvc.perform(post("/api/quoters").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(quoter)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.logo").value(TINY_PNG));

        // SVG ฝังสคริปต์ได้ จึงไม่รับ · ข้อความธรรมดาก็ไม่รับ
        for (String bad : List.of("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", "https://example.com/logo.png")) {
            quoter.put("logo", bad);
            mvc.perform(post("/api/quoters").contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsString(quoter)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("โลโก้ต้องเป็นรูป PNG, JPG หรือ WEBP"));
        }
    }

    @Test
    void create_withoutAuth_returns401() throws Exception {
        mvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(om.writeValueAsString(sampleQuotation("INCLUDED", List.of(item("งาน", 1, 100))))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void nextRunning_isPspoWithThreeDigits() {
        assertThat(QuotationService.nextRunning(List.of())).isEqualTo("PSPO-001");
        assertThat(QuotationService.nextRunning(List.of("PSPO-066"))).isEqualTo("PSPO-067");
        // ต่อจากเลขมากสุด ไม่ใช่ใบล่าสุด
        assertThat(QuotationService.nextRunning(List.of("PSPO-010", "PSPO-003"))).isEqualTo("PSPO-011");
        // เลขรูปแบบอื่นที่ผู้ใช้พิมพ์เองไม่ถูกนับ
        assertThat(QuotationService.nextRunning(List.of("ABC-500", "พิเศษ", "PSPO-004"))).isEqualTo("PSPO-005");
        // เติมศูนย์ให้ครบ 3 หลักเสมอ แม้เลขเดิมจะพิมพ์ไว้ไม่ครบ · ตัวพิมพ์เล็กก็นับ
        assertThat(QuotationService.nextRunning(List.of("pspo-7"))).isEqualTo("PSPO-008");
        // เกิน 999 ก็รันต่อได้
        assertThat(QuotationService.nextRunning(List.of("PSPO-999"))).isEqualTo("PSPO-1000");
    }
}
