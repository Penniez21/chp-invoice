import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuotationResponse, QuotationService } from '../quotation.service';
import { Spinner } from '../../../shared/spinner/spinner';
import { Pagination } from '../../../shared/pagination/pagination';
import { createPaginator } from '../../../shared/pagination/paginator';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm/confirm.service';
import { apiErrorMessage } from '../../../core/api-error';
import { formatDateBE } from '../../../shared/date-format';

/**
 * ตารางใบเสนอราคา (ค้นหา + แบ่งหน้า + ลบ) — ใช้ทั้งในแท็บของแดชบอร์ดและหน้า "รายการใบเสนอราคา"
 * คนเรียกเป็นเจ้าของรายการ: โหลดเอง แล้วเอาออกจากรายการเองเมื่อได้ (deleted)
 */
@Component({
  selector: 'app-quotation-table',
  imports: [RouterLink, Spinner, Pagination],
  templateUrl: './quotation-table.html',
})
export class QuotationTable {
  private quotationService = inject(QuotationService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly quotations = input.required<QuotationResponse[]>();
  readonly loading = input(false);
  readonly deleted = output<number>();

  protected readonly deletingId = signal<number | null>(null);

  protected readonly query = signal('');
  protected readonly showSuggest = signal(false);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.quotations();
    return this.quotations().filter(
      (x) =>
        x.quotationNo.toLowerCase().includes(q) ||
        x.customerName.toLowerCase().includes(q) ||
        (x.project ?? '').toLowerCase().includes(q) ||
        (x.customerNo ?? '').toLowerCase().includes(q)
    );
  });

  protected readonly pager = createPaginator(this.filtered);

  protected readonly suggestions = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    return this.filtered().slice(0, 6);
  });

  protected pick(x: QuotationResponse): void {
    this.showSuggest.set(false);
    this.query.set('');
    this.router.navigate(['/quotations', x.id, 'edit']);
  }

  protected onQuery(v: string): void {
    this.query.set(v);
    this.showSuggest.set(!!v);
    this.pager.reset();
  }

  protected async remove(x: QuotationResponse, ev: Event): Promise<void> {
    ev.stopPropagation();
    const ok = await this.confirm.ask({
      title: 'ลบใบเสนอราคานี้?',
      message: 'ลบแล้วกู้คืนไม่ได้',
      detail: `เลขที่ ${x.quotationNo} · ${x.customerName}`,
      confirmText: 'ลบใบเสนอราคา',
      danger: true,
    });
    if (!ok) return;

    this.deletingId.set(x.id);
    this.quotationService.delete(x.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.deleted.emit(x.id);
        this.toast.success('ลบใบเสนอราคาแล้ว', `เลขที่ ${x.quotationNo}`);
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

  /** ใบเสนอราคาแสดงวันที่เป็น พ.ศ. */
  protected formatDate(iso: string | null | undefined): string {
    return formatDateBE(iso);
  }
}
