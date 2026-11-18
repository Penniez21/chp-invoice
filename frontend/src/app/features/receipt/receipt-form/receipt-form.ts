import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReceiptRequest, ReceiptResponse, ReceiptService } from '../receipt.service';
import { ReceiptDraftService } from '../receipt-draft.service';
import { Stepper, Step } from '../../../shared/stepper/stepper';
import { Spinner } from '../../../shared/spinner/spinner';
import { AddressPicker } from '../../../shared/address/address-picker';
import { DatePicker } from '../../../shared/date-picker/date-picker';
import { DigitsOnly } from '../../../shared/digits-only';
import { thaiPhone, thaiTaxId } from '../../../shared/validators';
import { ToastService } from '../../../shared/toast/toast.service';
import { apiErrorMessage } from '../../../core/api-error';
import { Recipient, RecipientService } from '../../settings/recipient.service';
import { Issuer, IssuerService } from '../../settings/issuer.service';
import { Combobox, ComboOption } from '../../../shared/combobox/combobox';
import { baht, lineSatang } from '../../../shared/money';
import { VAT_MODES, VAT_RATE, VatMode, documentTotals } from '../../../shared/document/vat';
import { PAYMENT_METHODS, PaymentMethod, paymentHint } from '../../../shared/document/payment';
import { looksLikeCompany } from '../../../shared/document/branch';
import { BranchInput } from '../../../shared/branch-input/branch-input';
import { Switch } from '../../../shared/switch/switch';
import { TransferAccounts } from '../../../shared/document/transfer-accounts';

@Component({
  selector: 'app-receipt-form',
  imports: [ReactiveFormsModule, RouterLink, Stepper, Spinner, AddressPicker, DatePicker, DigitsOnly, Combobox, BranchInput, Switch, TransferAccounts],
  templateUrl: './receipt-form.html',
})
export class ReceiptForm implements OnInit {
  private fb = inject(FormBuilder);
  private receiptService = inject(ReceiptService);
  private draftService = inject(ReceiptDraftService);
  private router = inject(Router);
  private recipientService = inject(RecipientService);
  private issuerService = inject(IssuerService);
  private toast = inject(ToastService);

  /** ผู้รับที่บันทึกไว้ใน "ตั้งค่า → ผู้รับ" สำหรับเลือกเติมอัตโนมัติ */
  protected readonly savedRecipients = signal<Recipient[]>([]);

  /** ผู้รับที่เลือกจาก dropdown — เก็บไว้เพื่อให้ช่องยังโชว์ชื่อที่เลือกหลังเติมข้อมูลแล้ว */
  protected readonly pickedRecipientId = signal('');

  /** ค้นหาได้ทั้งชื่อ เลขภาษี และเบอร์โทร (hint ถูกใช้ในการค้นด้วย) */
  protected readonly recipientOptions = computed<ComboOption[]>(() =>
    this.savedRecipients().map((r) => ({
      value: String(r.id),
      label: r.name,
      hint: [r.taxId, r.phone].filter(Boolean).join(' · '),
    }))
  );

  /** ผู้ออกที่บันทึกไว้ใน "ตั้งค่า → ผู้ออก" สำหรับเลือกเติมอัตโนมัติ */
  protected readonly savedIssuers = signal<Issuer[]>([]);
  protected readonly pickedIssuerId = signal('');
  protected readonly issuerOptions = computed<ComboOption[]>(() =>
    this.savedIssuers().map((i) => ({
      value: String(i.id),
      label: i.name,
      hint: [i.taxId, i.phone].filter(Boolean).join(' · '),
    }))
  );

  // route param (มีเมื่อเป็นโหมดแก้ไข /receipts/:id/edit)
  readonly id = input<string>();

  protected readonly steps: Step[] = [
    { label: 'กรอกข้อมูล', icon: '✎' },
    { label: 'ตรวจสอบ & รายงาน', icon: '📄' },
  ];

  protected readonly saving = signal(false);
  protected readonly loadingReceipt = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    receiptNo: ['', Validators.required],
    poNo: [''],
    project: [''],
    issueDate: [this.today(), Validators.required],
    dueDate: [this.today()],
    issuerName: ['', Validators.required],
    issuerTaxId: ['', [thaiTaxId]],
    issuerBranch: [null as string | null],
    issuerAddress: [''],
    issuerEmail: ['', [Validators.email]],
    issuerPhone: ['', [thaiPhone]],
    recipientName: ['', Validators.required],
    recipientTaxId: ['', [thaiTaxId]],
    recipientBranch: [null as string | null],
    recipientAddress: [''],
    recipientPhone: ['', [thaiPhone]],
    whtRate: [3, [Validators.required, Validators.min(0), Validators.max(100)]],
    vatMode: ['INCLUDED' as VatMode],
    vatRate: [VAT_RATE, [Validators.required, Validators.min(0), Validators.max(100)]],
    taxInvoice: [false],
    paymentMethod: ['' as PaymentMethod | ''],
    chequeBank: [''],
    chequeBranch: [''],
    chequeNo: [''],
    chequeDate: [''],
    items: this.fb.array([this.newItem()]),
  });

  protected readonly vatModes = VAT_MODES;
  protected readonly paymentMethods = PAYMENT_METHODS;
  protected readonly paymentHint = paymentHint;

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  // คิดยอดเป็นจำนวนเต็มสตางค์ตามกฎเดียวกับ backend (DocumentTotals) เพื่อให้ตรงกับที่บันทึก/พิมพ์เสมอ:
  // แต่ละบรรทัดปัด 2 ตำแหน่ง HALF_UP → รวม → VAT ตามแบบที่เลือก → ภาษีหักจากราคาก่อน VAT → ชำระ = ทั้งหมด − ภาษีหัก
  private readonly subTotalSatang = computed(() =>
    (this.value().items ?? []).reduce((s, it) => s + lineSatang(it?.quantity, it?.unitPrice), 0n)
  );
  private readonly totals = computed(() =>
    documentTotals(this.subTotalSatang(), this.value().vatMode, this.value().vatRate, this.value().whtRate)
  );

  protected readonly vatMode = computed(() => this.value().vatMode ?? 'INCLUDED');
  protected readonly paymentMethod = computed(() => this.value().paymentMethod ?? '');
  protected readonly subTotal = computed(() => baht(this.subTotalSatang()));
  protected readonly beforeVat = computed(() => baht(this.totals().beforeVat));
  protected readonly vatAmount = computed(() => baht(this.totals().vat));
  protected readonly grandTotal = computed(() => baht(this.totals().grand));
  protected readonly whtAmount = computed(() => baht(this.totals().wht));
  protected readonly netTotal = computed(() => baht(this.totals().net));

  /**
   * ผู้ใช้กดสวิตช์ "ใบกำกับภาษี" เองแล้วหรือยัง — ถ้ายัง ระบบติ๊กให้ตามชื่อผู้ออก
   * (กรณีออกในนาม บจก. ต้องออกใบกำกับภาษีด้วย — ความต้องการของผู้ใช้) · โหมดแก้ไขใช้ค่าที่บันทึกไว้เสมอ
   */
  private taxInvoiceTouched = false;

  ngOnInit(): void {
    const idVal = this.id();
    if (idVal) {
      this.loadForEdit(+idVal);
    } else {
      const draft = this.draftService.get();
      if (draft) this.restore(draft);
      this.autoFillNumbers(); // เติมเลขรันถัดไปให้ช่องที่ยังว่าง
    }
    // เก็บ draft เฉพาะโหมดสร้างใหม่ (คงข้อมูลเมื่อกดกลับ) — โหมดแก้ไขโหลดจาก DB จึงไม่แตะ draft
    this.form.valueChanges.subscribe(() => {
      if (this.editingId() === null) this.draftService.save(this.form.getRawValue());
    });

    // ใบกำกับภาษี: ไม่มี VAT ออกไม่ได้ (ปิดสวิตช์) · ยังไม่ได้กดเอง → ติ๊กตามชื่อผู้ออก
    this.form.controls.vatMode.valueChanges.subscribe(() => this.syncTaxInvoice());
    this.form.controls.issuerName.valueChanges.subscribe(() => this.syncTaxInvoice());
    this.syncTaxInvoice();

    // รายชื่อผู้รับที่บันทึกไว้ — ล้มเหลวก็ไม่เป็นไร ยังกรอกเองได้ จึงไม่ต้องรบกวนด้วย toast
    this.recipientService.list().subscribe({
      next: (list) => this.savedRecipients.set(list),
      error: () => this.savedRecipients.set([]),
    });

    // รายชื่อผู้ออกที่บันทึกไว้ — เช่นเดียวกัน ล้มเหลวก็ยังกรอกเองได้
    this.issuerService.list().subscribe({
      next: (list) => this.savedIssuers.set(list),
      error: () => this.savedIssuers.set([]),
    });
  }

  /**
   * เติม "เลขที่ใบเสร็จรับเงิน" และ "หมายเลขสั่งซื้อ" เป็นเลขรันถัดไปที่ยังไม่ซ้ำในฐานข้อมูล
   * เติมเฉพาะช่องที่ยังว่าง (ไม่ทับค่าที่ผู้ใช้กรอก/ค่าจาก draft) และยังแก้เองได้
   */
  private autoFillNumbers(): void {
    this.receiptService.nextNumbers().subscribe({
      next: (n) => {
        const patch: Partial<{ receiptNo: string; poNo: string }> = {};
        if (!this.form.controls.receiptNo.value.trim()) patch.receiptNo = n.receiptNo;
        if (!this.form.controls.poNo.value.trim()) patch.poNo = n.poNo;
        if (Object.keys(patch).length) this.form.patchValue(patch);
      },
      error: () => {}, // ล้มเหลวก็ไม่เป็นไร ยังกรอกเองได้
    });
  }

  protected setVatMode(mode: VatMode): void {
    this.form.controls.vatMode.setValue(mode);
  }

  protected setPaymentMethod(method: PaymentMethod | ''): void {
    this.form.controls.paymentMethod.setValue(method);
  }

  /** ผู้ใช้กดสวิตช์ใบกำกับภาษีเอง → เลิกติ๊กอัตโนมัติตามชื่อผู้ออก */
  protected onTaxInvoiceToggled(): void {
    this.taxInvoiceTouched = true;
  }

  /** ค่าสวิตช์ก่อนถูกบังคับปิดเพราะเลือก "ไม่มี VAT" — เปลี่ยนกลับเป็นมี VAT แล้วคืนค่าเดิมให้ */
  private taxInvoiceBeforeNone: boolean | null = null;

  private syncTaxInvoice(): void {
    const ctrl = this.form.controls.taxInvoice;
    if (this.form.controls.vatMode.value === 'NONE') {
      if (ctrl.enabled) {
        this.taxInvoiceBeforeNone = ctrl.value;
        ctrl.disable({ emitEvent: false });
      }
      if (ctrl.value) ctrl.setValue(false, { emitEvent: false });
      return;
    }
    if (ctrl.disabled) {
      ctrl.enable({ emitEvent: false });
      if (this.taxInvoiceBeforeNone !== null) ctrl.setValue(this.taxInvoiceBeforeNone, { emitEvent: false });
      this.taxInvoiceBeforeNone = null;
    }
    if (!this.taxInvoiceTouched && this.editingId() === null) {
      const auto = looksLikeCompany(this.form.controls.issuerName.value);
      if (ctrl.value !== auto) ctrl.setValue(auto, { emitEvent: false });
    }
  }

  /** เลือกผู้ออกจาก dropdown → เติมข้อมูลลงฟอร์ม (ยังแก้ทับได้ตามปกติ) */
  protected applySavedIssuer(idValue: string): void {
    this.pickedIssuerId.set(idValue);
    if (!idValue) return;
    const i = this.savedIssuers().find((x) => String(x.id) === idValue);
    if (!i) return;
    this.form.patchValue({
      issuerName: i.name,
      issuerTaxId: i.taxId ?? '',
      issuerBranch: i.branch ?? null,
      issuerAddress: i.address ?? '',
      issuerEmail: i.email ?? '',
      issuerPhone: i.phone ?? '',
    });
    this.toast.info('เติมข้อมูลผู้ออกแล้ว', i.name);
  }

  /** เลือกผู้รับจาก dropdown → เติมข้อมูลลงฟอร์ม (ยังแก้ทับได้ตามปกติ) */
  protected applySavedRecipient(idValue: string): void {
    this.pickedRecipientId.set(idValue);
    if (!idValue) return; // กดล้างค่า = แค่เลิกอ้างอิงผู้รับที่บันทึกไว้ ไม่ล้างข้อมูลที่กรอกไปแล้ว
    const r = this.savedRecipients().find((x) => String(x.id) === idValue);
    if (!r) return;
    this.form.patchValue({
      recipientName: r.name,
      recipientTaxId: r.taxId ?? '',
      recipientBranch: r.branch ?? null,
      recipientAddress: r.address ?? '',
      recipientPhone: r.phone ?? '',
    });
    this.toast.info('เติมข้อมูลผู้รับแล้ว', r.name);
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  protected lineTotal(index: number): number {
    const it = this.items.at(index).getRawValue();
    return baht(lineSatang(it.quantity, it.unitPrice));
  }

  protected newItem(desc = '', qty = 1, price = 0) {
    return this.fb.nonNullable.group({
      description: [desc, Validators.required],
      quantity: [qty, [Validators.required, Validators.min(0)]],
      unitPrice: [price, [Validators.required, Validators.min(0)]],
    });
  }

  protected addItem(): void {
    this.items.push(this.newItem());
  }

  protected removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }

  protected save(): void {
    this.errorMsg.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg.set('กรุณากรอกข้อมูลให้ครบและถูกต้อง');
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const cheque = raw.paymentMethod === 'CHEQUE';
    const payload: ReceiptRequest = {
      ...raw,
      poNo: raw.poNo || null,
      project: raw.project.trim() || null,
      dueDate: raw.dueDate || null,
      issuerBranch: raw.issuerBranch || null,
      recipientBranch: raw.recipientBranch || null,
      vatRate: this.n(raw.vatRate),
      taxInvoice: raw.taxInvoice && raw.vatMode !== 'NONE',
      paymentMethod: raw.paymentMethod || null,
      chequeBank: cheque ? raw.chequeBank.trim() || null : null,
      chequeBranch: cheque ? raw.chequeBranch.trim() || null : null,
      chequeNo: cheque ? raw.chequeNo.trim() || null : null,
      chequeDate: cheque ? raw.chequeDate || null : null,
      items: raw.items.map((it) => ({
        description: it.description,
        quantity: this.n(it.quantity),
        unitPrice: this.n(it.unitPrice),
      })),
    };

    const id = this.editingId();
    const req$ = id
      ? this.receiptService.update(id, payload)
      : this.receiptService.create(payload);

    req$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.draftService.clear();
        this.toast.success(id ? 'แก้ไขใบเสร็จรับเงินแล้ว' : 'บันทึกใบเสร็จรับเงินแล้ว', `เลขที่ ${res.receiptNo}`);
        this.router.navigate(['/receipts', res.id, 'report']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = apiErrorMessage(err, 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
        this.errorMsg.set(msg);
        this.toast.error('บันทึกไม่สำเร็จ', msg);
      },
    });
  }

  private loadForEdit(id: number): void {
    this.loadingReceipt.set(true);
    this.editingId.set(id);
    this.draftService.clear();
    this.receiptService.get(id).subscribe({
      next: (inv) => {
        this.patchFrom(inv);
        this.loadingReceipt.set(false);
      },
      error: () => {
        this.loadingReceipt.set(false);
        this.errorMsg.set('โหลดข้อมูลใบเสร็จรับเงินไม่สำเร็จ');
      },
    });
  }

  private patchFrom(inv: ReceiptResponse): void {
    this.form.patchValue({
      receiptNo: inv.receiptNo,
      poNo: inv.poNo ?? '',
      project: inv.project ?? '',
      issueDate: inv.issueDate,
      dueDate: inv.dueDate ?? '',
      issuerName: inv.issuerName,
      issuerTaxId: inv.issuerTaxId ?? '',
      issuerBranch: inv.issuerBranch ?? null,
      issuerAddress: inv.issuerAddress ?? '',
      issuerEmail: inv.issuerEmail ?? '',
      issuerPhone: inv.issuerPhone ?? '',
      recipientName: inv.recipientName,
      recipientTaxId: inv.recipientTaxId ?? '',
      recipientBranch: inv.recipientBranch ?? null,
      recipientAddress: inv.recipientAddress ?? '',
      recipientPhone: inv.recipientPhone ?? '',
      whtRate: inv.whtRate,
      vatMode: inv.vatMode ?? 'INCLUDED',
      vatRate: inv.vatRate ?? VAT_RATE,
      taxInvoice: inv.taxInvoice ?? false,
      paymentMethod: inv.paymentMethod ?? '',
      chequeBank: inv.chequeBank ?? '',
      chequeBranch: inv.chequeBranch ?? '',
      chequeNo: inv.chequeNo ?? '',
      chequeDate: inv.chequeDate ?? '',
    });
    this.syncTaxInvoice();
    this.setItems(inv.items.map((it) => this.newItem(it.description, it.quantity, it.unitPrice)));
  }

  private restore(draft: Record<string, unknown>): void {
    const items = (draft['items'] as any[]) ?? [];
    if (items.length) {
      this.setItems(items.map((it) => this.newItem(it.description, it.quantity, it.unitPrice)));
    }
    this.form.patchValue(draft as any);
    // draft คือสิ่งที่ผู้ใช้เลือกไว้เองก่อนหน้า — ไม่ติ๊กสวิตช์ใบกำกับภาษีทับ
    this.taxInvoiceTouched = true;
  }

  private setItems(groups: ReturnType<ReceiptForm['newItem']>[]): void {
    const arr = this.items;
    arr.clear();
    groups.forEach((g) => arr.push(g));
    if (arr.length === 0) arr.push(this.newItem());
  }

  protected formatMoney(v: number): string {
    return v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private n(v: unknown): number {
    const num = Number(v);
    return isFinite(num) ? num : 0;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
