package com.chp.invoice.web;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.*;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * รูปภาพแบบ data URL (เช่น โลโก้) — รับเฉพาะ PNG / JPG / WEBP ที่เข้ารหัส base64 และไม่ใหญ่เกินไป
 * ไม่รับ SVG เพราะ SVG ฝังสคริปต์ได้ · ค่าว่าง/null ผ่าน (ไม่บังคับใส่)
 * ฝั่ง frontend ย่อรูปก่อนส่งอยู่แล้ว ขนาดจริงจึงมักไม่ถึงหนึ่งในสิบของเพดานนี้
 */
@Documented
@Constraint(validatedBy = {})
@Target({FIELD, METHOD, PARAMETER, ANNOTATION_TYPE})
@Retention(RUNTIME)
@Pattern(regexp = "^$|^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$",
        message = "โลโก้ต้องเป็นรูป PNG, JPG หรือ WEBP")
@Size(max = 700_000, message = "ไฟล์โลโก้ใหญ่เกินไป (ไม่เกินประมาณ 500 KB)")
public @interface ImageDataUrl {
    String message() default "รูปภาพไม่ถูกต้อง";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
