/** ปี ค.ศ. → พ.ศ. */
export const BE_OFFSET = 543;

/**
 * ISO `yyyy-MM-dd` (ค.ศ. ตามที่เก็บในฐานข้อมูล) → วว/ดด/ปปปป แบบ พ.ศ. เช่น 2026-10-20 → 20/10/2569
 * แปลงเฉพาะตอนแสดงผล — ค่าที่เก็บ/ส่ง backend ยังเป็น ค.ศ. เสมอ
 */
export function formatDateBE(iso: string | null | undefined): string {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + BE_OFFSET}`;
}
