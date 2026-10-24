import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuotationResponse, QuotationService } from '../quotation.service';
import { QuotationTable } from '../quotation-table/quotation-table';

/** หน้า "ใบเสนอราคา → รายการใบเสนอราคา" */
@Component({
  selector: 'app-quotation-list',
  imports: [RouterLink, QuotationTable],
  template: `
    <div class="mx-auto max-w-6xl">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="page-head">
          <h1 class="page-head__title">รายการใบเสนอราคา</h1>
          <p class="page-head__sub">ค้นหา ดูรายงาน แก้ไข หรือลบใบเสนอราคาที่บันทึกไว้</p>
        </div>
        <a routerLink="/quotations/new" class="btn btn--primary">＋ สร้างใบเสนอราคา</a>
      </div>

      <section class="card animate-in overflow-visible">
        <app-quotation-table [quotations]="quotations()" [loading]="loading()" (deleted)="onDeleted($event)">
          <h2 toolbarStart class="text-base font-semibold text-ink">ใบเสนอราคาทั้งหมด {{ quotations().length }} ใบ</h2>
        </app-quotation-table>
      </section>
    </div>
  `,
})
export class QuotationList {
  private quotationService = inject(QuotationService);

  protected readonly quotations = signal<QuotationResponse[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.quotationService.list().subscribe({
      next: (list) => {
        this.quotations.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onDeleted(id: number): void {
    this.quotations.update((list) => list.filter((x) => x.id !== id));
  }
}
