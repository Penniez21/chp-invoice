import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReceiptResponse, ReceiptService } from '../receipt.service';
import { Spinner } from '../../../shared/spinner/spinner';
import { Pagination } from '../../../shared/pagination/pagination';
import { createPaginator } from '../../../shared/pagination/paginator';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm/confirm.service';
import { apiErrorMessage } from '../../../core/api-error';

/**
 * ตารางใบเสร็จรับเงิน (ค้นหา + แบ่งหน้า + ลบ) — ใช้ทั้งในแท็บของแดชบอร์ดและหน้า "รายการใบเสร็จรับเงิน"
 * คนเรียกเป็นเจ้าของรายการ: โหลดเอง แล้วเอาออกจากรายการเองเมื่อได้ (deleted)
 * ช่องซ้ายของแถบเครื่องมือรับเนื้อหาจากคนเรียกผ่าน [toolbarStart] (หัวข้อ หรือแท็บ)
 */
@Component({
  selector: 'app-receipt-table',
  imports: [RouterLink, Spinner, Pagination],
  templateUrl: './receipt-table.html',
})
export class ReceiptTable {
  private receiptService = inject(ReceiptService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  readonly receipts = input.required<ReceiptResponse[]>();
  readonly loading = input(false);
  readonly deleted = output<number>();

  protected readonly deletingId = signal<number | null>(null);

  // ค้นหาแบบ autocomplete
  protected readonly query = signal('');
  protected readonly showSuggest = signal(false);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.receipts();
    return this.receipts().filter(
      (inv) =>
        inv.receiptNo.toLowerCase().includes(q) ||
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

  protected pick(inv: ReceiptResponse): void {
    this.showSuggest.set(false);
    this.query.set('');
    this.router.navigate(['/receipts', inv.id, 'edit']);
  }

  protected onQuery(v: string): void {
    this.query.set(v);
    this.showSuggest.set(!!v);
    this.pager.reset();
  }

  protected async remove(inv: ReceiptResponse, ev: Event): Promise<void> {
    ev.stopPropagation();
    const ok = await this.confirm.ask({
      title: 'ลบใบเสร็จรับเงินนี้?',
      message: 'ลบแล้วกู้คืนไม่ได้',
      detail: `เลขที่ ${inv.receiptNo} · ${inv.recipientName}`,
      confirmText: 'ลบใบเสร็จรับเงิน',
      danger: true,
    });
    if (!ok) return;

    this.deletingId.set(inv.id);
    this.receiptService.delete(inv.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.deleted.emit(inv.id);
        this.toast.success('ลบใบเสร็จรับเงินแล้ว', `เลขที่ ${inv.receiptNo}`);
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
