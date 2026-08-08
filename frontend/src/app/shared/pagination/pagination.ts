import { Component, input } from '@angular/core';
import { Paginator } from './paginator';

/**
 * แถบแบ่งหน้าท้ายตาราง — ใช้ร่วมกันทุกตารางในระบบ
 *   <app-pagination [p]="pager" />
 */
@Component({
  selector: 'app-pagination',
  imports: [],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-3 text-sm">
      <div class="flex items-center gap-3">
        <span class="text-ink-soft">
          แสดงทั้ง <span class="font-semibold text-ink">{{ p().items().length }}</span> รายการ
          จากทั้งหมด <span class="font-semibold text-ink">{{ p().total() }}</span> รายการ
        </span>
        <label class="flex items-center gap-1.5 text-ink-soft">
          <span class="hidden sm:inline">แสดง</span>
          <select [value]="p().pageSize()" (change)="p().setPageSize(+$any($event.target).value)"
                  class="rounded-lg border border-line bg-surface px-2 py-1 text-ink outline-none focus:border-primary">
            @for (opt of p().pageSizeOptions; track opt) { <option [value]="opt">{{ opt }}</option> }
          </select>
          <span class="hidden sm:inline">ต่อหน้า</span>
        </label>
      </div>

      <div class="flex items-center gap-1">
        <button type="button" (click)="p().prev()" [disabled]="p().safePage() === 1" aria-label="หน้าก่อนหน้า"
                class="grid h-9 min-w-9 place-items-center rounded-lg border border-line px-2 text-ink transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40">‹</button>
        @for (n of p().pageNumbers(); track n) {
          <button type="button" (click)="p().goToPage(n)"
                  class="grid h-9 min-w-9 place-items-center rounded-lg border px-2 transition"
                  [class]="n === p().safePage()
                    ? 'border-transparent bg-primary text-white'
                    : 'border-line text-ink hover:bg-primary-soft'">{{ n }}</button>
        }
        <button type="button" (click)="p().next()" [disabled]="p().safePage() === p().totalPages()" aria-label="หน้าถัดไป"
                class="grid h-9 min-w-9 place-items-center rounded-lg border border-line px-2 text-ink transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-40">›</button>
      </div>
    </div>
  `,
})
export class Pagination {
  readonly p = input.required<Paginator<unknown>>();
}
