import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvoiceResponse, InvoiceService } from '../invoice.service';
import { BankAccount, BankAccountService } from '../../settings/bank-account.service';
import { Issuer, IssuerService } from '../../settings/issuer.service';
import { Recipient, RecipientService } from '../../settings/recipient.service';
import { Stepper, Step } from '../../../shared/stepper/stepper';
import { Spinner } from '../../../shared/spinner/spinner';
import { ToastService } from '../../../shared/toast/toast.service';
import { DocumentPage } from '../../../shared/document/document-page';
import { apiErrorMessage } from '../../../core/api-error';

@Component({
  selector: 'app-invoice-report',
  imports: [RouterLink, Stepper, Spinner, NgTemplateOutlet, NgClass],
  templateUrl: './invoice-report.html',
  // block — ต้องวัดความกว้างของ host ได้ (ค่าเริ่มต้นของ custom element เป็น inline ซึ่ง clientWidth = 0)
  host: { class: 'block', '(document:keydown.escape)': 'closePreview()' },
})
export class InvoiceReport extends DocumentPage {
  private invoiceService = inject(InvoiceService);
  private bankService = inject(BankAccountService);
  private issuerService = inject(IssuerService);
  private recipientService = inject(RecipientService);
  private toast = inject(ToastService);

  // ---- บันทึกข้อมูลจากใบนี้ไว้ใช้ครั้งหน้า (ปุ่มขึ้นเฉพาะที่ยังไม่มีในฐานข้อมูล) ----
  protected readonly savedIssuers = signal<Issuer[]>([]);
  protected readonly savedRecipients = signal<Recipient[]>([]);
  /** มีบัญชีธนาคารในระบบแล้วหรือยัง — true ไว้ก่อนกันปุ่มกระพริบตอนยังโหลดไม่เสร็จ */
  protected readonly hasAnyBank = signal(true);
  protected readonly savingIssuer = signal(false);
  protected readonly savingRecipient = signal(false);

  /** ผู้ออกของใบนี้ถูกบันทึกไว้แล้วหรือยัง (เทียบชื่อ + เลขภาษี) */
  protected readonly issuerSaved = computed(() => {
    const inv = this.invoice();
    if (!inv) return true;
    const name = (inv.issuerName ?? '').trim();
    const tax = inv.issuerTaxId ?? '';
    return this.savedIssuers().some((i) => i.name.trim() === name && (i.taxId ?? '') === tax);
  });

  protected readonly recipientSaved = computed(() => {
    const inv = this.invoice();
    if (!inv) return true;
    const name = (inv.recipientName ?? '').trim();
    const tax = inv.recipientTaxId ?? '';
    return this.savedRecipients().some((r) => r.name.trim() === name && (r.taxId ?? '') === tax);
  });

  readonly id = input(0, { transform: numberAttribute });

  protected readonly steps: Step[] = [
    { label: 'กรอกข้อมูล', icon: '✎' },
    { label: 'ตรวจสอบ & รายงาน', icon: '📄' },
  ];

  /** บัญชีธนาคารที่เลือกไว้ใน "ตั้งค่า → บัญชีธนาคาร" (สูงสุด 3 บัญชี) */
  protected readonly banks = signal<BankAccount[]>([]);

  protected readonly invoice = signal<InvoiceResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMsg = signal<string | null>(null);

  constructor() {
    super();
    queueMicrotask(() => {
      this.load();
      // บัญชีธนาคารที่เลือกให้แสดง — โหลดล้มเหลวก็แค่ไม่มีส่วน "ชำระเงิน" ในเอกสาร
      this.bankService.listShown().subscribe({
        next: (list) => this.banks.set(list),
        error: () => this.banks.set([]),
      });
      // โหลดรายการที่บันทึกไว้ เพื่อตัดสินใจว่าจะโชว์ปุ่ม "บันทึกไว้ใช้ครั้งหน้า" ไหม
      this.issuerService.list().subscribe({
        next: (l) => this.savedIssuers.set(l),
        error: () => this.savedIssuers.set([]),
      });
      this.recipientService.list().subscribe({
        next: (l) => this.savedRecipients.set(l),
        error: () => this.savedRecipients.set([]),
      });
      // เช็คว่ามีบัญชีธนาคาร "สักบัญชี" ในระบบไหม (ไม่เฉพาะที่เลือกแสดง)
      this.bankService.list().subscribe({
        next: (l) => this.hasAnyBank.set(l.length > 0),
        error: () => this.hasAnyBank.set(true), // พลาดก็ไม่ต้องตื๊อให้เพิ่ม
      });
    });
  }

  /** บันทึกผู้ออกของใบนี้เข้าสู่รายการผู้ออกที่บันทึกไว้ */
  protected saveIssuer(): void {
    const inv = this.invoice();
    if (!inv || this.savingIssuer()) return;
    this.savingIssuer.set(true);
    this.issuerService
      .create({
        name: inv.issuerName,
        taxId: inv.issuerTaxId ?? null,
        address: inv.issuerAddress ?? null,
        email: inv.issuerEmail ?? null,
        phone: inv.issuerPhone ?? null,
      })
      .subscribe({
        next: (created) => {
          this.savingIssuer.set(false);
          this.savedIssuers.update((l) => [...l, created]); // ปุ่มจะหายเองเพราะ issuerSaved() เป็น true
          this.toast.success('บันทึกผู้ออกแล้ว', inv.issuerName);
        },
        error: (e) => {
          this.savingIssuer.set(false);
          this.toast.error('บันทึกผู้ออกไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
        },
      });
  }

  /** บันทึกผู้รับของใบนี้เข้าสู่รายการผู้รับที่บันทึกไว้ */
  protected saveRecipient(): void {
    const inv = this.invoice();
    if (!inv || this.savingRecipient()) return;
    this.savingRecipient.set(true);
    this.recipientService
      .create({
        name: inv.recipientName,
        taxId: inv.recipientTaxId ?? null,
        address: inv.recipientAddress ?? null,
        phone: inv.recipientPhone ?? null,
      })
      .subscribe({
        next: (created) => {
          this.savingRecipient.set(false);
          this.savedRecipients.update((l) => [...l, created]);
          this.toast.success('บันทึกผู้รับแล้ว', inv.recipientName);
        },
        error: (e) => {
          this.savingRecipient.set(false);
          this.toast.error('บันทึกผู้รับไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
        },
      });
  }

  private load(): void {
    const id = this.id();
    if (!id) {
      this.loading.set(false);
      this.errorMsg.set('ไม่พบรหัสใบแจ้งหนี้');
      return;
    }
    this.invoiceService.get(id).subscribe({
      next: (inv) => {
        this.invoice.set(inv);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('โหลดข้อมูลใบแจ้งหนี้ไม่สำเร็จ');
      },
    });
  }

  /** PDF 2 หน้า (ต้นฉบับ + สำเนา) — กลไกการจับภาพอยู่ใน DocumentPage.exportPdf */
  protected async downloadPdf(): Promise<void> {
    if (this.pdfLoading()) return;
    this.errorMsg.set(null);
    try {
      await this.exportPdf('invoice-doc', `invoice-${this.invoice()?.invoiceNo ?? this.id()}.pdf`);
    } catch {
      this.errorMsg.set('สร้าง PDF ไม่สำเร็จ');
    }
  }
}
