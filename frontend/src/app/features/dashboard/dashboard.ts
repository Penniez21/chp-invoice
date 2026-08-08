import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InvoiceResponse, InvoiceService } from '../invoice/invoice.service';
import { Spinner } from '../../shared/spinner/spinner';
import { Pagination } from '../../shared/pagination/pagination';
import { createPaginator } from '../../shared/pagination/paginator';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm/confirm.service';
import { apiErrorMessage } from '../../core/api-error';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Spinner, Pagination],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  protected readonly invoices = signal<InvoiceResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly deletingId = signal<number | null>(null);

  // ค้นหาแบบ autocomplete
  protected readonly query = signal('');
  protected readonly showSuggest = signal(false);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.invoices();
    return this.invoices().filter(
      (inv) =>
        inv.invoiceNo.toLowerCase().includes(q) ||
        (inv.recipientName ?? '').toLowerCase().includes(q) ||
        (inv.issuerName ?? '').toLowerCase().includes(q)
    );
  });

  protected readonly pager = createPaginator(this.filtered);

  protected readonly suggestions = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.filtered().slice(0, 6);
  });

  protected readonly totalNet = computed(() =>
    this.invoices().reduce((s, i) => s + (i.netTotal ?? 0), 0)
  );

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.invoiceService.list().subscribe({
      next: (list) => {
        this.invoices.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected pick(inv: InvoiceResponse): void {
    this.showSuggest.set(false);
    this.query.set('');
    this.router.navigate(['/invoices', inv.id, 'edit']);
  }

  protected onQuery(v: string): void {
    this.query.set(v);
    this.showSuggest.set(!!v);
    this.pager.reset();
  }

  protected async remove(inv: InvoiceResponse, ev: Event): Promise<void> {
    ev.stopPropagation();
    const ok = await this.confirm.ask({
      title: 'ลบใบแจ้งหนี้นี้?',
      message: 'ลบแล้วกู้คืนไม่ได้',
      detail: `เลขที่ ${inv.invoiceNo} · ${inv.recipientName}`,
      confirmText: 'ลบใบแจ้งหนี้',
      danger: true,
    });
    if (!ok) return;

    this.deletingId.set(inv.id);
    this.invoiceService.delete(inv.id).subscribe({
      next: () => {
        this.invoices.update((list) => list.filter((x) => x.id !== inv.id));
        this.deletingId.set(null);
        this.toast.success('ลบใบแจ้งหนี้แล้ว', `เลขที่ ${inv.invoiceNo}`);
      },
      error: (e) => {
        this.deletingId.set(null);
        this.toast.error('ลบไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }

  protected money(v: number | null | undefined): string {
    return (v ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
