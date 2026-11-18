/**
 * รหัสสาขาแบบกรมสรรพากร (5 หลัก) — ใช้บนใบกำกับภาษีเต็มรูป
 * 00000 = สำนักงานใหญ่ · 00001 ขึ้นไป = สาขาที่ … · null / '' = ไม่ระบุ
 */
export const HEAD_OFFICE = '00000';

export function branchLabel(code: string | null | undefined): string {
  if (!code) return '';
  return code === HEAD_OFFICE ? 'สำนักงานใหญ่' : `สาขาที่ ${code}`;
}

/** ชื่อแบบนิติบุคคล (บริษัท / บจก. / หจก. / ... จำกัด) — ใช้ติ๊ก "ใบกำกับภาษี" ให้อัตโนมัติ */
export function looksLikeCompany(name: string | null | undefined): boolean {
  return /บริษัท|บจก\.?|หจก\.?|ห้างหุ้นส่วน|จำกัด|co\.?,?\s*ltd/i.test(name ?? '');
}
