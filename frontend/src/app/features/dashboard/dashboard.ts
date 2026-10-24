import { Component, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceResponse, InvoiceService } from '../invoice/invoice.service';
import { QuotationResponse, QuotationService } from '../quotation/quotation.service';
import { InvoiceTable } from '../invoice/invoice-table/invoice-table';
import { QuotationTable } from '../quotation/quotation-table/quotation-table';

type Tab = 'invoices' | 'quotations';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgTemplateOutlet, InvoiceTable, QuotationTable],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private invoiceService = inject(InvoiceService);
  private quotationService = inject(QuotationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected readonly invoices = signal<InvoiceResponse[]>([]);
  protected readonly quotations = signal<QuotationResponse[]>([]);
  protected readonly loadingInvoices = signal(true);
  protected readonly loadingQuotations = signal(true);

  /** แท็บที่เลือก ผูกกับ ?tab=quotations — กดย้อนกลับจากหน้าอื่นแล้วยังอยู่แท็บเดิม */
  readonly tab = input<string>();
  protected readonly activeTab = computed<Tab>(() => (this.tab() === 'quotations' ? 'quotations' : 'invoices'));

  protected readonly totalNet = computed(() =>
    this.invoices().reduce((s, i) => s + (i.netTotal ?? 0), 0)
  );
  protected readonly totalQuoted = computed(() =>
    this.quotations().reduce((s, q) => s + (q.grandTotal ?? 0), 0)
  );

  constructor() {
    this.invoiceService.list().subscribe({
      next: (list) => {
        this.invoices.set(list);
        this.loadingInvoices.set(false);
      },
      error: () => this.loadingInvoices.set(false),
    });
    this.quotationService.list().subscribe({
      next: (list) => {
        this.quotations.set(list);
        this.loadingQuotations.set(false);
      },
      error: () => this.loadingQuotations.set(false),
    });
  }

  protected selectTab(tab: Tab): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'quotations' ? tab : null },
      replaceUrl: true,
    });
  }

  protected onInvoiceDeleted(id: number): void {
    this.invoices.update((list) => list.filter((x) => x.id !== id));
  }

  protected onQuotationDeleted(id: number): void {
    this.quotations.update((list) => list.filter((x) => x.id !== id));
  }

  protected money(v: number | null | undefined): string {
    return (v ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
