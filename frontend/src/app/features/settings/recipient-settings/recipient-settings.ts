import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Spinner } from '../../../shared/spinner/spinner';
import { AddressPicker } from '../../../shared/address/address-picker';
import { DigitsOnly } from '../../../shared/digits-only';
import { thaiPhone, thaiTaxId } from '../../../shared/validators';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm/confirm.service';
import { apiErrorMessage } from '../../../core/api-error';
import { Recipient, RecipientService } from '../recipient.service';
import { Pagination } from '../../../shared/pagination/pagination';
import { createPaginator } from '../../../shared/pagination/paginator';

@Component({
  selector: 'app-recipient-settings',
  imports: [ReactiveFormsModule, Spinner, AddressPicker, DigitsOnly, Pagination],
  templateUrl: './recipient-settings.html',
})
export class RecipientSettings {
  private fb = inject(FormBuilder);
  private service = inject(RecipientService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  protected readonly recipients = signal<Recipient[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly search = signal('');

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.recipients();
    return this.recipients().filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.taxId ?? '').includes(q) ||
        (r.phone ?? '').includes(q) ||
        (r.address ?? '').toLowerCase().includes(q)
    );
  });

  protected readonly pager = createPaginator(this.filtered);

  /** เปลี่ยนคำค้น → กลับไปหน้า 1 ไม่งั้นอาจค้างอยู่หน้าที่ไม่มีข้อมูลแล้ว */
  protected onSearch(v: string): void {
    this.search.set(v);
    this.pager.reset();
  }

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    taxId: ['', [thaiTaxId]],
    address: [''],
    phone: ['', [thaiPhone]],
  });

  constructor() {
    queueMicrotask(() => this.load());
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (list) => {
        this.recipients.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.error('โหลดรายชื่อผู้รับไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', taxId: '', address: '', phone: '' });
    this.formOpen.set(true);
  }

  protected openEdit(r: Recipient): void {
    this.editingId.set(r.id);
    this.form.reset({
      name: r.name,
      taxId: r.taxId ?? '',
      address: r.address ?? '',
      phone: r.phone ?? '',
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
      this.toast.error('ข้อมูลยังไม่ถูกต้อง', 'ตรวจชื่อผู้รับ เลขผู้เสียภาษี และเบอร์โทรอีกครั้ง');
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      taxId: raw.taxId || null,
      address: raw.address || null,
      phone: raw.phone || null,
    };

    this.saving.set(true);
    const id = this.editingId();
    const req = id ? this.service.update(id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'แก้ไขผู้รับแล้ว' : 'เพิ่มผู้รับแล้ว', raw.name);
        this.closeForm();
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error('บันทึกไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }

  protected async remove(r: Recipient): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'ลบผู้รับรายนี้?',
      message: 'ใบแจ้งหนี้ที่ออกไปแล้วไม่ได้รับผลกระทบ เพราะเก็บข้อมูลผู้รับไว้ในตัวเอกสารเอง',
      detail: r.name,
      confirmText: 'ลบผู้รับ',
      danger: true,
    });
    if (!ok) return;
    this.service.delete(r.id).subscribe({
      next: () => {
        this.toast.success('ลบผู้รับแล้ว', r.name);
        this.load();
      },
      error: (e) => this.toast.error('ลบไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง')),
    });
  }
}
