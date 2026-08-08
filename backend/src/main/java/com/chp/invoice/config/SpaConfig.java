package com.chp.invoice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * เสิร์ฟไฟล์ Angular ที่ถูก build ไว้ใน classpath:/static/ และรองรับ deep link ของ SPA
 *
 * เปิด /invoices/1/report ตรง ๆ หรือกด refresh เซิร์ฟเวอร์จะไม่มีไฟล์ชื่อนั้น
 * จึงต้องส่ง index.html กลับไปให้ Angular router จัดการเส้นทางเอง
 */
@Configuration
public class SpaConfig implements WebMvcConfigurer {

    private static final String STATIC_DIR = "classpath:/static/";
    private static final Resource INDEX = new ClassPathResource("static/index.html");

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC_DIR)
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        // ห้าม fallback ให้ API และ h2-console — ต้องปล่อยให้ตอบ 404 ตามจริง
                        // ไม่งั้น endpoint ที่พิมพ์ผิดจะได้ index.html พร้อมสถานะ 200
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("h2-console")) {
                            return null;
                        }
                        return INDEX.exists() ? INDEX : null;
                    }
                });
    }
}
