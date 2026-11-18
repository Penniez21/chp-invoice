import { excludePercent, percentOf } from '../money';

/** วิธีคิดภาษีมูลค่าเพิ่ม: ราคารวม VAT แล้ว / บวก VAT เพิ่ม / ไม่มี VAT — ใช้ทั้งใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ */
export type VatMode = 'INCLUDED' | 'EXCLUDED' | 'NONE';

export const VAT_MODES: { mode: VatMode; label: string }[] = [
  { mode: 'INCLUDED', label: 'ราคารวม VAT แล้ว' },
  { mode: 'EXCLUDED', label: 'บวก VAT เพิ่ม' },
  { mode: 'NONE', label: 'ไม่มี VAT' },
];

/** อัตรา VAT เริ่มต้นของฟอร์ม — ฝั่ง backend ก็ใช้ 7 เมื่อไม่ได้ระบุ */
export const VAT_RATE = 7;

/** ยอดเงินเป็นสตางค์ ของใบแจ้งหนี้ / ใบเสร็จรับเงิน */
export interface DocumentTotalsSatang {
  beforeVat: bigint;
  vat: bigint;
  grand: bigint;
  wht: bigint;
  net: bigint;
}

/**
 * VAT 3 แบบ + ภาษีหัก ณ ที่จ่ายจากราคาก่อน VAT — กติกาเดียวกับ backend (document/DocumentTotals.java)
 * ยอดบนฟอร์มจึงตรงกับที่บันทึก/พิมพ์ทุกสตางค์
 * - INCLUDED: ก่อน VAT = ยอด × 100 / (100 + อัตรา), VAT = ส่วนต่าง, ทั้งหมด = ยอด
 * - EXCLUDED: VAT = ยอด × อัตรา / 100, ทั้งหมด = ยอด + VAT
 * - NONE:     ทั้งหมด = ยอด
 * ภาษีหัก = ก่อน VAT × อัตราหัก / 100 · ชำระ = ทั้งหมด − ภาษีหัก
 */
export function documentTotals(items: bigint, mode: VatMode | undefined, vatRate: unknown, whtRate: unknown): DocumentTotalsSatang {
  let beforeVat = items;
  let vat = 0n;
  let grand = items;
  if (mode === 'EXCLUDED') {
    vat = percentOf(items, vatRate);
    grand = items + vat;
  } else if (mode !== 'NONE') {
    beforeVat = excludePercent(items, vatRate);
    vat = items - beforeVat;
  }
  const wht = percentOf(beforeVat, whtRate);
  return { beforeVat, vat, grand, wht, net: grand - wht };
}
