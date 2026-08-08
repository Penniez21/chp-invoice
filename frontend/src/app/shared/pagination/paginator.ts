import { Signal, computed, signal } from '@angular/core';

/** สถานะ + คำสั่งของการแบ่งหน้า ใช้ร่วมกับ <app-pagination [p]="pager" /> */
export interface Paginator<T> {
  /** รายการเฉพาะหน้าปัจจุบัน — เอาไปวนใน @for แทนรายการทั้งหมด */
  readonly items: Signal<T[]>;
  readonly total: Signal<number>;
  readonly pageSize: Signal<number>;
  readonly totalPages: Signal<number>;
  /** หน้าปัจจุบันที่บีบให้อยู่ในช่วงที่ถูกต้องเสมอ (กันค้างหน้าเกินตอนรายการลดลง) */
  readonly safePage: Signal<number>;
  /** เลขหน้าที่จะโชว์ในแถบ (ไม่เกิน 5 หน้ารอบ ๆ หน้าปัจจุบัน) */
  readonly pageNumbers: Signal<number[]>;
  readonly pageSizeOptions: number[];

  setPageSize(size: number): void;
  goToPage(page: number): void;
  prev(): void;
  next(): void;
  /** กลับไปหน้า 1 — เรียกตอนเปลี่ยนคำค้นหรือกรองใหม่ */
  reset(): void;
}

/**
 * สร้างตัวแบ่งหน้าจาก signal ของรายการทั้งหมด
 *
 *   protected readonly pager = createPaginator(this.filtered);
 *   ...
 *   @for (row of pager.items(); track row.id) { … }
 *   <app-pagination [p]="pager" />
 */
export function createPaginator<T>(
  source: Signal<T[]>,
  options: { pageSize?: number; pageSizeOptions?: number[] } = {}
): Paginator<T> {
  const pageSizeOptions = options.pageSizeOptions ?? [10, 20, 50, 100];
  const pageSize = signal(options.pageSize ?? pageSizeOptions[0]);
  const page = signal(1);

  const total = computed(() => source().length);
  const totalPages = computed(() => Math.max(1, Math.ceil(total() / pageSize())));
  const safePage = computed(() => Math.min(page(), totalPages()));

  const items = computed(() => {
    const start = (safePage() - 1) * pageSize();
    return source().slice(start, start + pageSize());
  });

  const pageNumbers = computed(() => {
    const span = 2;
    const from = Math.max(1, safePage() - span);
    const to = Math.min(totalPages(), safePage() + span);
    const arr: number[] = [];
    for (let i = from; i <= to; i++) arr.push(i);
    return arr;
  });

  const goToPage = (p: number) => page.set(Math.min(Math.max(1, p), totalPages()));

  return {
    items,
    total,
    pageSize,
    totalPages,
    safePage,
    pageNumbers,
    pageSizeOptions,
    setPageSize: (size) => {
      pageSize.set(size);
      page.set(1);
    },
    goToPage,
    prev: () => goToPage(safePage() - 1),
    next: () => goToPage(safePage() + 1),
    reset: () => page.set(1),
  };
}
