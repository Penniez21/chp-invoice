import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { QuotationResponse, QuotationService } from '../quotation.service';
import { Quoter, QuoterService } from '../../settings/quoter.service';
import { Customer, CustomerService } from '../../settings/customer.service';
import { Stepper, Step } from '../../../shared/stepper/stepper';
import { Spinner } from '../../../shared/spinner/spinner';
import { ToastService } from '../../../shared/toast/toast.service';
import { DocumentPage } from '../../../shared/document/document-page';
import { formatDateBE } from '../../../shared/date-format';
import { apiErrorMessage } from '../../../core/api-error';

@Component({
  selector: 'app-quotation-report',
  imports: [RouterLink, Stepper, Spinner, NgTemplateOutlet],
  templateUrl: './quotation-report.html',
  // block — ต้องวัดความกว้างของ host ได้ (ค่าเริ่มต้นของ custom element เป็น inline ซึ่ง clientWidth = 0)
  host: { class: 'block', '(document:keydown.escape)': 'closePreview()' },
})
export class QuotationReport extends DocumentPage {
  private quotationService = inject(QuotationService);
  private quoterService = inject(QuoterService);
  private customerService = inject(CustomerService);
  private toast = inject(ToastService);

  readonly id = input(0, { transform: numberAttribute });

  protected readonly steps: Step[] = [
    { label: 'กรอกข้อมูล', icon: '✎' },
    { label: 'ตรวจสอบ & รายงาน', icon: '📄' },
  ];

  protected readonly quotation = signal<QuotationResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMsg = signal<string | null>(null);

  // ---- บันทึกข้อมูลจากใบนี้ไว้ใช้ครั้งหน้า (ปุ่มขึ้นเฉพาะที่ยังไม่มีในฐานข้อมูล) ----
  protected readonly savedQuoters = signal<Quoter[]>([]);
  protected readonly savedCustomers = signal<Customer[]>([]);
  protected readonly savingQuoter = signal(false);
  protected readonly savingCustomer = signal(false);

  /** ผู้เสนอราคาของใบนี้ถูกบันทึกไว้แล้วหรือยัง (เทียบชื่อบริษัท + เลขภาษี) */
  protected readonly quoterSaved = computed(() => {
    const q = this.quotation();
    if (!q) return true;
    const name = q.sellerName.trim();
    const tax = q.sellerTaxId ?? '';
    return this.savedQuoters().some((s) => s.name.trim() === name && (s.taxId ?? '') === tax);
  });

  protected readonly customerSaved = computed(() => {
    const q = this.quotation();
    if (!q) return true;
    const name = q.customerName.trim();
    const tax = q.customerTaxId ?? '';
    return this.savedCustomers().some((c) => c.name.trim() === name && (c.taxId ?? '') === tax);
  });

  constructor() {
    super();
    queueMicrotask(() => {
      this.load();
      this.quoterService.list().subscribe({
        next: (l) => this.savedQuoters.set(l),
        error: () => this.savedQuoters.set([]),
      });
      this.customerService.list().subscribe({
        next: (l) => this.savedCustomers.set(l),
        error: () => this.savedCustomers.set([]),
      });
    });
  }

  /** ใบเสนอราคาแสดงวันที่เป็น พ.ศ. (ใบแจ้งหนี้ยังเป็น ค.ศ. ตามเดิม) */
  protected override formatDate(iso: string | null | undefined): string {
    return formatDateBE(iso);
  }

  /** รายละเอียดย่อยของรายการ → แยกบรรทัด ตัดบรรทัดว่างและขีดนำหน้าที่ผู้ใช้พิมพ์มาเอง */
  protected detailLines(details: string | null | undefined): string[] {
    return (details ?? '')
      .split('\n')
      .map((l) => l.trim().replace(/^[-•]\s*/, ''))
      .filter(Boolean);
  }

  protected saveQuoter(): void {
    const q = this.quotation();
    if (!q || this.savingQuoter()) return;
    this.savingQuoter.set(true);
    this.quoterService
      .create({
        name: q.sellerName,
        taxId: q.sellerTaxId ?? null,
        address: q.sellerAddress ?? null,
        phone: q.sellerPhone ?? null,
        email: q.sellerEmail ?? null,
      })
      .subscribe({
        next: (created) => {
          this.savingQuoter.set(false);
          this.savedQuoters.update((l) => [...l, created]); // ปุ่มจะหายเองเพราะ quoterSaved() เป็น true
          this.toast.success('บันทึกผู้เสนอราคาแล้ว', q.sellerName);
        },
        error: (e) => {
          this.savingQuoter.set(false);
          this.toast.error('บันทึกผู้เสนอราคาไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
        },
      });
  }

  protected saveCustomer(): void {
    const q = this.quotation();
    if (!q || this.savingCustomer()) return;
    this.savingCustomer.set(true);
    this.customerService
      .create({
        code: q.customerNo ?? null,
        name: q.customerName,
        taxId: q.customerTaxId ?? null,
        address: q.customerAddress ?? null,
        contactName: q.customerAttn ?? null,
        phone: q.customerPhone ?? null,
        email: q.customerEmail ?? null,
      })
      .subscribe({
        next: (created) => {
          this.savingCustomer.set(false);
          this.savedCustomers.update((l) => [...l, created]);
          this.toast.success('บันทึกลูกค้าแล้ว', q.customerName);
        },
        error: (e) => {
          this.savingCustomer.set(false);
          this.toast.error('บันทึกลูกค้าไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
        },
      });
  }

  private load(): void {
    const id = this.id();
    if (!id) {
      this.loading.set(false);
      this.errorMsg.set('ไม่พบรหัสใบเสนอราคา');
      return;
    }
    this.quotationService.get(id).subscribe({
      next: (q) => {
        this.quotation.set(q);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('โหลดข้อมูลใบเสนอราคาไม่สำเร็จ');
      },
    });
  }

  /** เช่น "Quotation-PSPO-001-งานวางท่อรางน้ำ" */
  protected fileBaseName(): string {
    const q = this.quotation();
    return DocumentPage.docFileName('Quotation', q?.quotationNo ?? String(this.id()), q?.project);
  }

  /** PDF หน้าเดียว — ใบเสนอราคาไม่มีสำเนา และไม่มีป้าย (ต้นฉบับ) · กลไกการจับภาพอยู่ใน DocumentPage.exportPdf */
  protected async downloadPdf(): Promise<void> {
    if (this.pdfLoading()) return;
    this.errorMsg.set(null);
    try {
      await this.exportPdf('quotation-doc', ['']);
    } catch {
      this.errorMsg.set('สร้าง PDF ไม่สำเร็จ');
    }
  }
}
