import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * ตรวจเลขประจำตัวผู้เสียภาษี / เลขบัตรประชาชนไทย 13 หลัก รวม check digit
 *
 * หลักที่ 13 เป็นตัวตรวจสอบ คำนวณจาก 12 หลักแรกโดยถ่วงน้ำหนัก 13 ลงมาถึง 2
 *   check = (11 − (Σ digit[i] × (13 − i)) mod 11) mod 10
 *
 * ปล่อยผ่านเมื่อเว้นว่าง เพราะเป็นฟิลด์ที่ไม่บังคับกรอก
 */
export function thaiTaxId(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '').trim();
  if (!v) return null;
  if (!/^\d{13}$/.test(v)) return { taxIdFormat: true };

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(v[i]) * (13 - i);
  const check = (11 - (sum % 11)) % 10;

  return check === Number(v[12]) ? null : { taxIdCheckDigit: true };
}

/**
 * เบอร์โทรศัพท์ — ตัวเลขล้วน 10 หลักพอดี
 * ปล่อยผ่านเมื่อเว้นว่าง เพราะเป็นฟิลด์ที่ไม่บังคับกรอก
 */
export function thaiPhone(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '').trim();
  if (!v) return null;
  return /^\d{10}$/.test(v) ? null : { phone: true };
}
