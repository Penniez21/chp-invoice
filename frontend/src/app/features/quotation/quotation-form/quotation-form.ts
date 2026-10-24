import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuotationRequest, QuotationResponse, QuotationService, VatMode } from '../quotation.service';
import { QuotationDraftService } from '../quotation-draft.service';
import { Stepper, Step } from '../../../shared/stepper/stepper';
import { Spinner } from '../../../shared/spinner/spinner';
import { AddressPicker } from '../../../shared/address/address-picker';
import { DatePicker } from '../../../shared/date-picker/date-picker';
import { DigitsOnly } from '../../../shared/digits-only';
import { thaiPhone, thaiTaxId } from '../../../shared/validators';
import { ToastService } from '../../../shared/toast/toast.service';
import { apiErrorMessage } from '../../../core/api-error';
import { Quoter, QuoterService } from '../../settings/quoter.service';
import { Customer, CustomerService } from '../../settings/customer.service';
import { Combobox, ComboOption } from '../../../shared/combobox/combobox';
import { baht, excludePercent, lineSatang, percentOf } from '../../../shared/money';

@Component({
  selector: 'app-quotation-form',
  imports: [ReactiveFormsModule, RouterLink, Stepper, Spinner, AddressPicker, DatePicker, DigitsOnly, Combobox],
  templateUrl: './quotation-form.html',
})
export class QuotationForm implements OnInit {
  private fb = inject(FormBuilder);
  private quotationService = inject(QuotationService);
  private draftService = inject(QuotationDraftService);
  private router = inject(Router);
  private quoterService = inject(QuoterService);
  private customerService = inject(CustomerService);
  private toast = inject(ToastService);

  /** ผู้เสนอราคาที่บันทึกไว้ใน "ใบเสนอราคา → ผู้เสนอราคา" */
  protected readonly savedQuoters = signal<Quoter[]>([]);
  protected readonly pickedQuoterId = signal('');
  protected readonly quoterOptions = computed<ComboOption[]>(() =>
    this.savedQuoters().map((q) => ({
      value: String(q.id),
      label: q.name,
      hint: [q.taxId, q.phone].filter(Boolean).join(' · '),
    }))
  );

  /** ลูกค้าที่บันทึกไว้ใน "ใบเสนอราคา → ลูกค้า" — ค้นได้ทั้งรหัส ชื่อ เลขภาษี เบอร์โทร */
  protected readonly savedCustomers = signal<Customer[]>([]);
  protected readonly pickedCustomerId = signal('');
  protected readonly customerOptions = computed<ComboOption[]>(() =>
    this.savedCustomers().map((c) => ({
      value: String(c.id),
      label: c.name,
      hint: [c.code, c.taxId, c.phone].filter(Boolean).join(' · '),
    }))
  );

  // route param (มีเมื่อเป็นโหมดแก้ไข /quotations/:id/edit)
  readonly id = input<string>();

  protected readonly steps: Step[] = [
    { label: 'กรอกข้อมูล', icon: '✎' },
    { label: 'ตรวจสอบ & รายงาน', icon: '📄' },
  ];

  protected readonly vatModes: { mode: VatMode; label: string }[] = [
    { mode: 'INCLUDED', label: 'ราคารวม VAT แล้ว' },
    { mode: 'EXCLUDED', label: 'บวก VAT เพิ่ม' },
    { mode: 'NONE', label: 'ไม่มี VAT' },
  ];

  protected readonly saving = signal(false);
  protected readonly loadingQuotation = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    quotationNo: ['', Validators.required],
    issueDate: [this.today(), Validators.required],
    customerNo: [''],
    project: [''],
    location: [''],
    sellerName: ['', Validators.required],
    sellerTaxId: ['', [thaiTaxId]],
    sellerAddress: [''],
    sellerPhone: ['', [thaiPhone]],
    sellerEmail: ['', [Validators.email]],
    customerName: ['', Validators.required],
    customerTaxId: ['', [thaiTaxId]],
    customerAddress: [''],
    customerAttn: [''],
    customerPhone: ['', [thaiPhone]],
    customerEmail: ['', [Validators.email]],
    remark: [''],
    vatMode: ['INCLUDED' as VatMode],
    vatRate: [7, [Validators.required, Validators.min(0), Validators.max(100)]],
    items: this.fb.array([this.newItem()]),
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  // คิดยอดเป็นจำนวนเต็มสตางค์ตามกฎเดียวกับ backend (QuotationService.apply) เพื่อให้ตรงกับที่บันทึก/พิมพ์เสมอ
  private readonly itemsSatang = computed(() =>
    (this.value().items ?? []).reduce((s, it) => s + lineSatang(it?.quantity, it?.unitPrice), 0n)
  );
  private readonly vatSatang = computed(() => {
    const items = this.itemsSatang();
    const rate = this.value().vatRate;
    switch (this.value().vatMode) {
      case 'INCLUDED': return items - excludePercent(items, rate); // ส่วนต่าง ให้ ก่อน VAT + VAT = ยอดรวม พอดี
      case 'EXCLUDED': return percentOf(items, rate);
      default: return 0n;
    }
  });
  private readonly grandSatang = computed(() =>
    this.value().vatMode === 'EXCLUDED' ? this.itemsSatang() + this.vatSatang() : this.itemsSatang()
  );

  protected readonly vatMode = computed(() => this.value().vatMode ?? 'INCLUDED');
  protected readonly itemsTotal = computed(() => baht(this.itemsSatang()));
  protected readonly beforeVat = computed(() => baht(this.grandSatang() - this.vatSatang()));
  protected readonly vatAmount = computed(() => baht(this.vatSatang()));
  protected readonly grandTotal = computed(() => baht(this.grandSatang()));

  /** รายการที่ผู้ใช้กดเปิดช่อง "รายละเอียดย่อย" ไว้ (รายการที่มีรายละเอียดอยู่แล้วเปิดเองเสมอ) */
  private readonly detailsOpened = signal(new Set<AbstractControl>());

  ngOnInit(): void {
    const idVal = this.id();
    if (idVal) {
      this.loadForEdit(+idVal);
    } else {
      const draft = this.draftService.get();
      if (draft) this.restore(draft);
      this.autoFillNumber();
    }
    // เก็บ draft เฉพาะโหมดสร้างใหม่ — โหมดแก้ไขโหลดจาก DB จึงไม่แตะ draft
    this.form.valueChanges.subscribe(() => {
      if (this.editingId() === null) this.draftService.save(this.form.getRawValue());
    });

    // รายชื่อที่บันทึกไว้ — ล้มเหลวก็ไม่เป็นไร ยังกรอกเองได้ จึงไม่ต้องรบกวนด้วย toast
    this.quoterService.list().subscribe({
      next: (list) => this.savedQuoters.set(list),
      error: () => this.savedQuoters.set([]),
    });
    this.customerService.list().subscribe({
      next: (list) => this.savedCustomers.set(list),
      error: () => this.savedCustomers.set([]),
    });
  }

  /**
   * เติมเลขที่ใบเสนอราคาถัดไป (PSPO- + เลขรัน 3 หลัก) เป็นค่าเริ่มต้นให้ — ผู้ใช้แก้ทับได้
   * เติมเฉพาะตอนช่องยังว่าง ไม่ทับค่าที่ผู้ใช้กรอกหรือค่าจาก draft
   */
  private autoFillNumber(): void {
    this.quotationService.nextNumber().subscribe({
      next: (n) => {
        if (!this.form.controls.quotationNo.value.trim()) this.form.patchValue({ quotationNo: n.quotationNo });
      },
      error: () => {}, // ล้มเหลวก็ไม่เป็นไร ยังกรอกเองได้
    });
  }

  /** เลือกผู้เสนอราคาจาก dropdown → เติมข้อมูลลงฟอร์ม (ยังแก้ทับได้ตามปกติ) */
  protected applySavedQuoter(idValue: string): void {
    this.pickedQuoterId.set(idValue);
    if (!idValue) return;
    const q = this.savedQuoters().find((x) => String(x.id) === idValue);
    if (!q) return;
    this.form.patchValue({
      sellerName: q.name,
      sellerTaxId: q.taxId ?? '',
      sellerAddress: q.address ?? '',
      sellerPhone: q.phone ?? '',
      sellerEmail: q.email ?? '',
    });
    this.toast.info('เติมข้อมูลผู้เสนอราคาแล้ว', q.name);
  }

  /** เลือกลูกค้าจาก dropdown → เติมข้อมูลลงฟอร์ม รวมถึงเลขที่ลูกค้าถ้ามีรหัส */
  protected applySavedCustomer(idValue: string): void {
    this.pickedCustomerId.set(idValue);
    if (!idValue) return;
    const c = this.savedCustomers().find((x) => String(x.id) === idValue);
    if (!c) return;
    this.form.patchValue({
      customerName: c.name,
      customerTaxId: c.taxId ?? '',
      customerAddress: c.address ?? '',
      customerAttn: c.contactName ?? '',
      customerPhone: c.phone ?? '',
      customerEmail: c.email ?? '',
      ...(c.code ? { customerNo: c.code } : {}),
    });
    this.toast.info('เติมข้อมูลลูกค้าแล้ว', c.name);
  }

  protected setVatMode(mode: VatMode): void {
    this.form.controls.vatMode.setValue(mode);
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  protected lineTotal(index: number): number {
    const it = this.items.at(index).getRawValue();
    return baht(lineSatang(it.quantity, it.unitPrice));
  }

  protected showDetails(item: AbstractControl): boolean {
    return !!item.value?.details || this.detailsOpened().has(item);
  }

  protected openDetails(item: AbstractControl): void {
    this.detailsOpened.update((s) => new Set(s).add(item));
  }

  protected newItem(desc = '', qty = 1, price = 0, unit = '', details = '') {
    return this.fb.nonNullable.group({
      description: [desc, Validators.required],
      details: [details],
      quantity: [qty, [Validators.required, Validators.min(0)]],
      unit: [unit],
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
    const orNull = (v: string) => (v.trim() ? v : null);
    const payload: QuotationRequest = {
      quotationNo: raw.quotationNo,
      issueDate: raw.issueDate,
      customerNo: orNull(raw.customerNo),
      project: orNull(raw.project),
      location: orNull(raw.location),
      sellerName: raw.sellerName,
      sellerTaxId: orNull(raw.sellerTaxId),
      sellerAddress: orNull(raw.sellerAddress),
      sellerPhone: orNull(raw.sellerPhone),
      sellerEmail: orNull(raw.sellerEmail),
      customerName: raw.customerName,
      customerTaxId: orNull(raw.customerTaxId),
      customerAddress: orNull(raw.customerAddress),
      customerAttn: orNull(raw.customerAttn),
      customerPhone: orNull(raw.customerPhone),
      customerEmail: orNull(raw.customerEmail),
      remark: orNull(raw.remark),
      vatMode: raw.vatMode,
      vatRate: this.n(raw.vatRate),
      items: raw.items.map((it) => ({
        description: it.description,
        details: orNull(it.details),
        quantity: this.n(it.quantity),
        unit: orNull(it.unit),
        unitPrice: this.n(it.unitPrice),
      })),
    };

    const id = this.editingId();
    const req$ = id
      ? this.quotationService.update(id, payload)
      : this.quotationService.create(payload);

    req$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.draftService.clear();
        this.toast.success(id ? 'แก้ไขใบเสนอราคาแล้ว' : 'บันทึกใบเสนอราคาแล้ว', `เลขที่ ${res.quotationNo}`);
        this.router.navigate(['/quotations', res.id, 'report']);
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
    this.loadingQuotation.set(true);
    this.editingId.set(id);
    this.draftService.clear();
    this.quotationService.get(id).subscribe({
      next: (q) => {
        this.patchFrom(q);
        this.loadingQuotation.set(false);
      },
      error: () => {
        this.loadingQuotation.set(false);
        this.errorMsg.set('โหลดข้อมูลใบเสนอราคาไม่สำเร็จ');
      },
    });
  }

  private patchFrom(q: QuotationResponse): void {
    this.form.patchValue({
      quotationNo: q.quotationNo,
      issueDate: q.issueDate,
      customerNo: q.customerNo ?? '',
      project: q.project ?? '',
      location: q.location ?? '',
      sellerName: q.sellerName,
      sellerTaxId: q.sellerTaxId ?? '',
      sellerAddress: q.sellerAddress ?? '',
      sellerPhone: q.sellerPhone ?? '',
      sellerEmail: q.sellerEmail ?? '',
      customerName: q.customerName,
      customerTaxId: q.customerTaxId ?? '',
      customerAddress: q.customerAddress ?? '',
      customerAttn: q.customerAttn ?? '',
      customerPhone: q.customerPhone ?? '',
      customerEmail: q.customerEmail ?? '',
      remark: q.remark ?? '',
      vatMode: q.vatMode,
      vatRate: q.vatRate,
    });
    this.setItems(
      q.items.map((it) => this.newItem(it.description, it.quantity, it.unitPrice, it.unit ?? '', it.details ?? ''))
    );
  }

  private restore(draft: Record<string, unknown>): void {
    const items = (draft['items'] as any[]) ?? [];
    if (items.length) {
      this.setItems(items.map((it) => this.newItem(it.description, it.quantity, it.unitPrice, it.unit, it.details)));
    }
    this.form.patchValue(draft as any);
  }

  private setItems(groups: ReturnType<QuotationForm['newItem']>[]): void {
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
