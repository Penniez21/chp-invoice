import { Injectable, signal } from '@angular/core';

/**
 * เก็บค่าฟอร์มใบแจ้งหนี้ไว้ชั่วคราว (ในหน่วยความจำ)
 * เพื่อคงข้อมูลเมื่อผู้ใช้กดกลับมาหน้ากรอกข้อมูลหลังจากไปหน้าสรุป
 */
@Injectable({ providedIn: 'root' })
export class InvoiceDraftService {
  private readonly _draft = signal<Record<string, unknown> | null>(null);

  save(value: Record<string, unknown>): void {
    this._draft.set(value);
  }

  get(): Record<string, unknown> | null {
    return this._draft();
  }

  clear(): void {
    this._draft.set(null);
  }
}
