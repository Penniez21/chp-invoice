import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from './confirm.service';

/**
 * กล่องยืนยันกลาง — ใส่ไว้ครั้งเดียวใน shell
 *
 * ใช้ <dialog> + showModal() จึงได้ top layer, ดักโฟกัส และปิดด้วย Esc มาให้ฟรี
 * ไม่ต้องทำ backdrop/focus trap เอง
 */
@Component({
  selector: 'app-confirm-host',
  imports: [],
  template: `
    <dialog #dlg class="confirm print:hidden"
            (close)="onClose()"
            (click)="onBackdrop($event)"
            (keydown.escape)="svc.resolve(false)">
      @if (svc.request(); as r) {
        <div class="confirm__card">
          <div class="flex items-start gap-3.5">
            <span class="confirm__icon" [class.confirm__icon--danger]="r.danger" aria-hidden="true">
              {{ r.danger ? '🗑' : '?' }}
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="confirm__title">{{ r.title }}</h2>
              @if (r.message) { <p class="confirm__message">{{ r.message }}</p> }
              @if (r.detail) { <p class="confirm__detail">{{ r.detail }}</p> }
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-2.5">
            <button type="button" class="btn btn--ghost" (click)="svc.resolve(false)">
              {{ r.cancelText || 'ยกเลิก' }}
            </button>
            <button type="button" autofocus
                    [class]="r.danger ? 'btn btn--danger' : 'btn btn--primary'"
                    (click)="svc.resolve(true)">
              {{ r.confirmText || 'ยืนยัน' }}
            </button>
          </div>
        </div>
      }
    </dialog>
  `,
})
export class ConfirmHost {
  protected svc = inject(ConfirmService);
  private dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const open = !!this.svc.request();
      const el = this.dlg()?.nativeElement;
      if (!el) return;
      if (open && !el.open) el.showModal();
      else if (!open && el.open) el.close();
    });
  }

  /**
   * ปิดเอง = ไม่ยืนยัน (resolve ซ้ำไม่มีผล ถ้ากดปุ่มไปแล้ว)
   * มี (keydown.escape) ในเทมเพลตดักไว้อีกชั้น เพราะ CloseWatcher ของ Chrome
   * ที่ปิด <dialog> ด้วย Esc ต้องการ user activation ซึ่งบางบริบทไม่มีให้
   */
  protected onClose(): void {
    this.svc.resolve(false);
  }

  /** คลิกนอกการ์ด (บนตัว dialog ซึ่งกินพื้นที่ backdrop) = ยกเลิก */
  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.dlg()?.nativeElement) this.svc.resolve(false);
  }
}
