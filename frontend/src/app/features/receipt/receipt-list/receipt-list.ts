import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReceiptResponse, ReceiptService } from '../receipt.service';
import { ReceiptTable } from '../receipt-table/receipt-table';

/** หน้า "ใบเสร็จรับเงิน → รายการใบเสร็จรับเงิน" */
@Component({
  selector: 'app-receipt-list',
  imports: [RouterLink, ReceiptTable],
  template: `
    <div class="mx-auto max-w-6xl">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div class="page-head">
          <h1 class="page-head__title">รายการใบเสร็จรับเงิน</h1>
          <p class="page-head__sub">ค้นหา ดูรายงาน แก้ไข หรือลบใบเสร็จรับเงินที่บันทึกไว้</p>
        </div>
        <a routerLink="/receipts/new" class="btn btn--primary">＋ สร้างใบเสร็จรับเงิน</a>
      </div>

      <section class="card animate-in overflow-visible">
        <app-receipt-table [receipts]="receipts()" [loading]="loading()" (deleted)="onDeleted($event)">
          <h2 toolbarStart class="text-base font-semibold text-ink">ใบเสร็จรับเงินทั้งหมด {{ receipts().length }} ใบ</h2>
        </app-receipt-table>
      </section>
    </div>
  `,
})
export class ReceiptList {
  private receiptService = inject(ReceiptService);

  protected readonly receipts = signal<ReceiptResponse[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.receiptService.list().subscribe({
      next: (list) => {
        this.receipts.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onDeleted(id: number): void {
    this.receipts.update((list) => list.filter((x) => x.id !== id));
  }
}
