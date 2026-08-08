import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Spinner } from '../../../shared/spinner/spinner';
import { DigitsOnly } from '../../../shared/digits-only';
import { Switch } from '../../../shared/switch/switch';
import { Pagination } from '../../../shared/pagination/pagination';
import { createPaginator } from '../../../shared/pagination/paginator';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm/confirm.service';
import { apiErrorMessage } from '../../../core/api-error';
import {
  BankAccount,
  BankAccountService,
  MAX_SHOWN_BANKS,
} from '../bank-account.service';

/** ธนาคารไทยที่ใช้บ่อย — เลือกจาก dropdown หรือพิมพ์ชื่ออื่นเองก็ได้ */
const THAI_BANKS = [
  'ธนาคารกสิกรไทย',
  'ธนาคารไทยพาณิชย์',
  'ธนาคารกรุงเทพ',
  'ธนาคารกรุงไทย',
  'ธนาคารกรุงศรีอยุธยา',
  'ธนาคารทหารไทยธนชาต (ttb)',
  'ธนาคารออมสิน',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
  'ธนาคารอาคารสงเคราะห์',
  'ธนาคารเกียรตินาคินภัทร',
  'ธนาคารซีไอเอ็มบี ไทย',
  'ธนาคารยูโอบี',
];

@Component({
  selector: 'app-bank-settings',
  imports: [ReactiveFormsModule, Spinner, DigitsOnly, Switch, Pagination],
  templateUrl: './bank-settings.html',
})
export class BankSettings {
  private fb = inject(FormBuilder);
  private service = inject(BankAccountService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  protected readonly maxShown = MAX_SHOWN_BANKS;
  protected readonly bankNames = THAI_BANKS;

  protected readonly accounts = signal<BankAccount[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formOpen = signal(false);

  protected readonly pager = createPaginator(this.accounts);

  protected readonly shownCount = computed(
    () => this.accounts().filter((a) => a.showOnInvoice).length
  );
  protected readonly shownFull = computed(() => this.shownCount() >= this.maxShown);

  protected readonly form = this.fb.nonNullable.group({
    bankName: ['', Validators.required],
    accountType: ['ออมทรัพย์'],
    accountNo: ['', Validators.required],
    accountName: [''],
    showOnInvoice: [false],
  });

  constructor() {
    queueMicrotask(() => this.load());
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (list) => {
        this.accounts.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.error('โหลดบัญชีธนาคารไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      bankName: '',
      accountType: 'ออมทรัพย์',
      accountNo: '',
      accountName: '',
      showOnInvoice: false,
    });
    this.formOpen.set(true);
  }

  protected openEdit(a: BankAccount): void {
    this.editingId.set(a.id);
    this.form.reset({
      bankName: a.bankName,
      accountType: a.accountType ?? '',
      accountNo: a.accountNo,
      accountName: a.accountName ?? '',
      showOnInvoice: a.showOnInvoice,
    });
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('กรอกข้อมูลไม่ครบ', 'ต้องมีชื่อธนาคารและเลขที่บัญชี');
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      bankName: raw.bankName,
      accountType: raw.accountType || null,
      accountNo: raw.accountNo,
      accountName: raw.accountName || null,
      showOnInvoice: raw.showOnInvoice,
      sortOrder: 0,
    };

    this.saving.set(true);
    const id = this.editingId();
    const req = id ? this.service.update(id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'แก้ไขบัญชีแล้ว' : 'เพิ่มบัญชีแล้ว', raw.bankName);
        this.closeForm();
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error('บันทึกไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }

  /** สลับสถานะ "แสดงบนใบแจ้งหนี้" — backend เป็นคนบังคับเพดาน 3 บัญชี */
  protected toggleShow(a: BankAccount): void {
    const next = !a.showOnInvoice;
    if (next && this.shownFull()) {
      this.toast.error(
        `เลือกได้สูงสุด ${this.maxShown} บัญชี`,
        'เอาบัญชีอื่นออกจากใบแจ้งหนี้ก่อน แล้วค่อยเลือกบัญชีนี้'
      );
      return;
    }
    this.service
      .update(a.id, {
        bankName: a.bankName,
        accountType: a.accountType,
        accountNo: a.accountNo,
        accountName: a.accountName,
        showOnInvoice: next,
        sortOrder: a.sortOrder,
      })
      .subscribe({
        next: () => {
          this.toast.success(next ? 'เพิ่มลงใบแจ้งหนี้แล้ว' : 'เอาออกจากใบแจ้งหนี้แล้ว', a.bankName);
          this.load();
        },
        error: (e) => this.toast.error('เปลี่ยนสถานะไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง')),
      });
  }

  protected async remove(a: BankAccount): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'ลบบัญชีธนาคารนี้?',
      message: 'บัญชีนี้จะถูกลบออกจากระบบ และหายไปจากใบแจ้งหนี้ที่ยังไม่ได้ออก',
      detail: `${a.bankName} · เลขที่ ${a.accountNo}`,
      confirmText: 'ลบบัญชี',
      danger: true,
    });
    if (!ok) return;
    this.service.delete(a.id).subscribe({
      next: () => {
        this.toast.success('ลบบัญชีแล้ว', a.bankName);
        this.load();
      },
      error: (e) => this.toast.error('ลบไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง')),
    });
  }
}
