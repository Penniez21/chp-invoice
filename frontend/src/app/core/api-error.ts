import { HttpErrorResponse } from '@angular/common/http';

/**
 * ดึงข้อความไทยจาก backend มาขึ้น toast
 * ApiExceptionHandler ฝั่ง Java ตอบเป็น {"message": "..."} เสมอ
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const msg = err.error?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (err.status === 0) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้';
  }
  return fallback;
}
