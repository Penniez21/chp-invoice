import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InvoiceResponse, InvoiceService } from '../invoice.service';
import { InvoiceTable } from '../invoice-table/invoice-table';

/** หน้า "ใบแจ้งหนี้ → รายการใบแจ้งหนี้" */
@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, InvoiceTable],
  template: `
    <div class="mx-auto max-w-6xl">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="page-head">
          <h1 class="page-head__title">รายการใบแจ้งหนี้</h1>
          <p class="page-head__sub">ค้นหา ดูรายงาน แก้ไข หรือลบใบแจ้งหนี้ที่บันทึกไว้</p>
        </div>
        <a routerLink="/invoices/new" class="btn btn--primary">＋ สร้างใบแจ้งหนี้</a>
      </div>

      <section class="card animate-in overflow-visible">
        <app-invoice-table [invoices]="invoices()" [loading]="loading()" (deleted)="onDeleted($event)">
          <h2 toolbarStart class="text-base font-semibold text-ink">ใบแจ้งหนี้ทั้งหมด {{ invoices().length }} ใบ</h2>
        </app-invoice-table>
      </section>
    </div>
  `,
})
export class InvoiceList {
  private invoiceService = inject(InvoiceService);

  protected readonly invoices = signal<InvoiceResponse[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.invoiceService.list().subscribe({
      next: (list) => {
        this.invoices.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onDeleted(id: number): void {
    this.invoices.update((list) => list.filter((x) => x.id !== id));
  }
}
