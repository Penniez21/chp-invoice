import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Spinner } from '../../../shared/spinner/spinner';
import { AddressPicker } from '../../../shared/address/address-picker';
import { DigitsOnly } from '../../../shared/digits-only';
import { thaiPhone, thaiTaxId } from '../../../shared/validators';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm/confirm.service';
import { apiErrorMessage } from '../../../core/api-error';
import { Customer, CustomerService } from '../customer.service';
import { Pagination } from '../../../shared/pagination/pagination';
import { createPaginator } from '../../../shared/pagination/paginator';

@Component({
  selector: 'app-customer-settings',
  imports: [ReactiveFormsModule, Spinner, AddressPicker, DigitsOnly, Pagination],
  templateUrl: './customer-settings.html',
})
export class CustomerSettings {
  private fb = inject(FormBuilder);
  private service = inject(CustomerService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly search = signal('');

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.customers();
    return this.customers().filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.code ?? '').toLowerCase().includes(q) ||
        (r.taxId ?? '').includes(q) ||
        (r.phone ?? '').includes(q) ||
        (r.email ?? '').toLowerCase().includes(q) ||
        (r.contactName ?? '').toLowerCase().includes(q) ||
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
    code: [''],
    name: ['', Validators.required],
    taxId: ['', [thaiTaxId]],
    address: [''],
    contactName: [''],
    phone: ['', [thaiPhone]],
    email: ['', [Validators.email]],
  });

  constructor() {
    queueMicrotask(() => this.load());
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (list) => {
        this.customers.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.error('โหลดรายชื่อลูกค้าไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ code: '', name: '', taxId: '', address: '', contactName: '', phone: '', email: '' });
    this.formOpen.set(true);
  }

  protected openEdit(r: Customer): void {
    this.editingId.set(r.id);
    this.form.reset({
      code: r.code ?? '',
      name: r.name,
      taxId: r.taxId ?? '',
      address: r.address ?? '',
      contactName: r.contactName ?? '',
      phone: r.phone ?? '',
      email: r.email ?? '',
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
      this.toast.error('ข้อมูลยังไม่ถูกต้อง', 'ตรวจชื่อลูกค้า เลขผู้เสียภาษี อีเมล และเบอร์โทรอีกครั้ง');
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      code: raw.code || null,
      name: raw.name,
      taxId: raw.taxId || null,
      address: raw.address || null,
      contactName: raw.contactName || null,
      phone: raw.phone || null,
      email: raw.email || null,
    };

    this.saving.set(true);
    const id = this.editingId();
    const req = id ? this.service.update(id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'แก้ไขลูกค้าแล้ว' : 'เพิ่มลูกค้าแล้ว', raw.name);
        this.closeForm();
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error('บันทึกไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
      },
    });
  }

  protected async remove(r: Customer): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'ลบลูกค้ารายนี้?',
      message: 'ใบเสนอราคาที่ออกไปแล้วไม่ได้รับผลกระทบ เพราะเก็บข้อมูลลูกค้าไว้ในตัวเอกสารเอง',
      detail: r.name,
      confirmText: 'ลบลูกค้า',
      danger: true,
    });
    if (!ok) return;
    this.service.delete(r.id).subscribe({
      next: () => {
        this.toast.success('ลบลูกค้าแล้ว', r.name);
        this.load();
      },
      error: (e) => this.toast.error('ลบไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง')),
    });
  }
}
