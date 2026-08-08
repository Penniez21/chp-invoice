import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

/**
 * แจ้งเตือนแบบ toast — เรียกจากที่ไหนก็ได้
 *   toast.success('บันทึกแล้ว')
 *   toast.error('บันทึกไม่สำเร็จ', 'ลองใหม่อีกครั้ง')
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = signal<Toast[]>([]);

  success(title: string, detail?: string): void {
    this.push('success', title, detail);
  }
  error(title: string, detail?: string): void {
    this.push('error', title, detail, 6000); // ข้อความผิดพลาดค้างนานกว่าให้อ่านทัน
  }
  info(title: string, detail?: string): void {
    this.push('info', title, detail);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, title: string, detail: string | undefined, ttl = 3800): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, kind, title, detail }]);
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), ttl)
    );
  }
}
