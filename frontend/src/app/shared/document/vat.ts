/**
 * ภาษีมูลค่าเพิ่ม 7% ของใบแจ้งหนี้/ใบเสร็จรับเงิน — ราคาที่กรอกในรายการถือว่ารวม VAT แล้ว
 * ต้องตรงกับ VAT_RATE ฝั่ง backend (InvoiceService / ReceiptService) ไม่งั้นยอดบนฟอร์มจะคลาดจากที่บันทึก
 */
export const VAT_RATE = 7;
