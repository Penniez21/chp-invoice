import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

/** ที่วาง toast ทั้งหมด — ใส่ไว้ครั้งเดียวใน shell */
@Component({
  selector: 'app-toast-host',
  imports: [],
  template: `
    <div class="toast-host print:hidden" aria-live="polite" aria-atomic="true">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast--' + t.kind" role="status">
          <span class="toast__icon" aria-hidden="true">
            @switch (t.kind) {
              @case ('success') { ✓ }
              @case ('error') { ! }
              @default { i }
            }
          </span>
          <div class="min-w-0 flex-1">
            <p class="toast__title">{{ t.title }}</p>
            @if (t.detail) { <p class="toast__detail">{{ t.detail }}</p> }
          </div>
          <button type="button" class="toast__close" (click)="toast.dismiss(t.id)" aria-label="ปิด">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected toast = inject(ToastService);
}
