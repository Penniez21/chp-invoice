/**
 * คณิตเงินแบบแม่นตรงเป็น "จำนวนเต็มสตางค์" (bigint) ให้ตรงกับ BigDecimal ฝั่ง backend ทุกสตางค์
 *
 * ใช้ float ตรง ๆ ไม่ได้ เช่น 112.545 ใน float คือ 112.5449999… ปัดแล้วได้ 112.54
 * แต่ backend (setScale(2, HALF_UP)) ได้ 112.55 — ยอดบนฟอร์มจะคลาดจากที่บันทึก/พิมพ์ 1 สตางค์
 */

/** ทศนิยมแบบแม่นตรง: ค่า = units × 10^-scale */
export interface Decimal {
  units: bigint;
  scale: number;
}

function num(v: unknown): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

/**
 * ตัวเลขจากฟอร์ม → ทศนิยมแบบแม่นตรง (เช่น 250.5 → 2505n, 1)
 * อ่านจาก String(num) ซึ่งเป็นข้อความเดียวกับที่ JSON ส่งไปให้ BigDecimal ฝั่ง backend
 */
export function decimal(v: unknown): Decimal {
  const m = /^(-?\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(num(v)));
  if (!m) return { units: 0n, scale: 0 };
  const [, int, frac = '', exp = '0'] = m;
  const scale = frac.length - Number(exp);
  const units = BigInt(int + frac);
  return scale >= 0 ? { units, scale } : { units: units * 10n ** BigInt(-scale), scale: 0 };
}

/** n / d ปัด HALF_UP (เท่ากันพอดีปัดออกจากศูนย์) — d ต้องมากกว่า 0 */
export function divHalfUp(n: bigint, d: bigint): bigint {
  const q = n / d; // bigint หารแล้วตัดเศษเข้าหาศูนย์
  const r = n % d;
  return (r < 0n ? -r : r) * 2n >= d ? q + (n < 0n ? -1n : 1n) : q;
}

/** units × 10^-scale → สตางค์ ปัดแบบ BigDecimal.setScale(2, HALF_UP) */
export function toSatang(units: bigint, scale: number): bigint {
  if (scale <= 2) return units * 10n ** BigInt(2 - scale);
  return divHalfUp(units, 10n ** BigInt(scale - 2));
}

/** ยอดบรรทัด = จำนวน × ราคาต่อหน่วย ปัดเป็นสตางค์ */
export function lineSatang(qty: unknown, price: unknown): bigint {
  const q = decimal(qty);
  const p = decimal(price);
  return toSatang(q.units * p.units, q.scale + p.scale);
}

/** ยอด (สตางค์) × อัตรา% / 100 ปัดเป็นสตางค์ — แบบ amount.multiply(rate).divide(100, 2, HALF_UP) */
export function percentOf(satang: bigint, rate: unknown): bigint {
  const r = decimal(rate);
  return toSatang(satang * r.units, 2 + r.scale + 2); // +2 = หาร 100
}

/**
 * ถอดมูลค่าก่อน VAT ออกจากยอดที่รวม VAT แล้ว: ยอด × 100 / (100 + อัตรา) ปัด HALF_UP
 * แบบ amount.multiply(100).divide(100 + rate, 2, HALF_UP)
 */
export function excludePercent(satang: bigint, rate: unknown): bigint {
  const r = decimal(rate);
  const ten = 10n ** BigInt(r.scale);
  return divHalfUp(satang * 100n * ten, 100n * ten + r.units);
}

export function baht(satang: bigint): number {
  return Number(satang) / 100;
}
