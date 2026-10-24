package com.chp.invoice.quotation;

/** วิธีคิดภาษีมูลค่าเพิ่มของใบเสนอราคา */
public enum VatMode {
    /** ราคาที่กรอกรวม VAT แล้ว — ถอด VAT ออกมาแสดง (แบบใบตัวอย่าง: 32,500 = 30,373.83 + 2,126.17) */
    INCLUDED,
    /** ราคาที่กรอกยังไม่รวม VAT — บวก VAT เพิ่มจากยอดรวม */
    EXCLUDED,
    /** ไม่คิด VAT */
    NONE
}
