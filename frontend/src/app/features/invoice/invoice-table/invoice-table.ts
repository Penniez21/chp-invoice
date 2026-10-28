import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InvoiceResponse, InvoiceService } from '../invoice.service';
import { Spinner } from '../../../shared/spinner/spinner';
import { Pagination } from '../../../shared/pagination/pagination';
import { createPaginator } from '../../../shared/pagination/paginator';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm/confirm.service';
import { apiErrorMessage } from '../../../core/api-error';

/**
 * ตารางใบแจ้งหนี้ (ค้นหา + แบ่งหน้า + ลบ) — ใช้ทั้งในแท็บของแดชบอร์ดและหน้า "รายการใบแจ้งหนี้"
 * คนเรียกเป็นเจ้าของรายการ: โหลดเอง แล้วเอาออกจากรายการเองเมื่อได้ (deleted)
 * ช่องซ้ายของแถบเครื่องมือรับเนื้อหาจากคนเรียกผ่าน [toolbarStart] (หัวข้อ หรือแท็บ)
 */
@Component({
  selector: 'app-invoice-table',
  imports: [RouterLink, Spinner, Pagination],
  templateUrl: './invoice-table.html',
})
export class InvoiceTable {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly invoices = input.required<InvoiceResponse[]>();
  readonly loading = input(false);
  readonly deleted = output<number>();

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
        (inv.issuerName ?? '').toLowerCase().includes(q) ||
        (inv.project ?? '').toLowerCase().includes(q)
    );
  });

  protected readonly pager = createPaginator(this.filtered);

  protected readonly suggestions = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.filtered().slice(0, 6);
  });

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
        this.deletingId.set(null);
        this.deleted.emit(inv.id);
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
