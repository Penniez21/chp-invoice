import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** ข้อความเน้นย้ำ เช่น ชื่อรายการที่กำลังจะลบ */
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  /** true = การกระทำที่ย้อนกลับไม่ได้ → ปุ่มยืนยันเป็นสีแดง */
  danger?: boolean;
}

/**
 * กล่องยืนยันของระบบ ใช้แทน confirm() ของเบราว์เซอร์
 *
 *   if (!(await this.confirm.ask({ title: 'ลบรายการ?', danger: true }))) return;
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<ConfirmOptions | null>(null);
  private resolver: ((v: boolean) => void) | null = null;

  ask(options: ConfirmOptions): Promise<boolean> {
    this.resolve(false); // มีกล่องเก่าค้างอยู่ก็ปิดแล้วตอบว่าไม่ยืนยัน
    this.request.set(options);
    return new Promise<boolean>((res) => (this.resolver = res));
  }

  /** เรียกซ้ำได้ไม่มีผลข้างเคียง — ครั้งแรกเท่านั้นที่ตอบ promise */
  resolve(value: boolean): void {
    const resolver = this.resolver;
    this.resolver = null;
    this.request.set(null);
    resolver?.(value);
  }
}
