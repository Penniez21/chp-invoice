/** ช่องทางการชำระของใบแจ้งหนี้ / ใบเสร็จรับเงิน — ไม่ระบุ = null */
export type PaymentMethod = 'CASH' | 'CHEQUE' | 'TRANSFER';

export const PAYMENT_METHODS: { value: PaymentMethod | ''; label: string }[] = [
  { value: '', label: 'ไม่ระบุ' },
  { value: 'CASH', label: 'เงินสด' },
  { value: 'CHEQUE', label: 'เช็ค' },
  { value: 'TRANSFER', label: 'โอนเงิน' },
];

/** ช่องติ๊กบนเอกสาร — ทุกช่องทาง (ไม่รวม "ไม่ระบุ") ติ๊กเฉพาะที่เลือก */
export const PAYMENT_CHOICES = PAYMENT_METHODS.filter(
  (p): p is { value: PaymentMethod; label: string } => p.value !== '',
);

/**
 * เอกสารแสดงรายละเอียดเฉพาะช่องทางที่เลือก (แสดงหมดทุกแบบแล้วรก — ความต้องการของผู้ใช้)
 * เช็ค → รายละเอียดเช็ค · โอนเงิน → บัญชีธนาคาร · เงินสด → ไม่มี
 * ไม่ระบุ → เว้นทั้งสองส่วนไว้ให้เขียนเองเหมือนแบบฟอร์มเปล่า
 */
export function showsCheque(method: PaymentMethod | null | undefined): boolean {
  return !method || method === 'CHEQUE';
}

export function showsTransfer(method: PaymentMethod | null | undefined): boolean {
  return !method || method === 'TRANSFER';
}

/** คำอธิบายใต้ปุ่มเลือกในฟอร์ม (เช็ค = ช่องกรอกรายละเอียด · โอนเงิน = รายการบัญชี ฟอร์มแสดงแทนคำอธิบาย) */
export function paymentHint(method: PaymentMethod | '' | null): string {
  return method === 'CASH'
    ? 'เอกสารจะติ๊กช่อง "เงินสด" ให้'
    : 'ไม่ระบุ — เอกสารเว้นช่องติ๊กไว้ และแสดงทั้งส่วนเช็คและบัญชีสำหรับโอน ให้ผู้จ่ายเลือกเอง';
}

/**
 * ชื่อบัญชีที่ทุกบัญชีใช้ร่วมกัน (ปกติเป็นชื่อผู้ออกทั้งหมด) — แสดงบรรทัดเดียวท้ายรายการบัญชีบนเอกสาร
 * ถ้าแต่ละบัญชีชื่อต่างกันคืน null แล้วเอกสารแสดงชื่อใต้แต่ละบัญชีแทน
 */
export function sharedAccountName(
  banks: readonly { accountName?: string | null }[],
  fallback: string,
): string | null {
  const names = new Set(banks.map((b) => b.accountName || fallback));
  return names.size === 1 ? [...names][0] : null;
}
