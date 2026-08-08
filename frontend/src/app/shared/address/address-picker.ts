import { Component, computed, forwardRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AddressDataService, Province } from './address-data.service';
import { Combobox, ComboOption } from '../combobox/combobox';

/**
 * ช่องกรอกที่อยู่แบบเลือก จังหวัด → อำเภอ → ตำบล → เติมรหัสไปรษณีย์อัตโนมัติ
 * เป็น ControlValueAccessor → ใช้กับ formControlName ได้ และเก็บค่าเป็น string ที่ประกอบแล้ว
 */
@Component({
  selector: 'app-address-picker',
  imports: [Combobox],
  templateUrl: './address-picker.html',
  // ต้องเป็น block — ค่าเริ่มต้นของ custom element คือ inline ซึ่งทำให้ margin แนวตั้ง
  // ที่ space-y-* ของตัวครอบใส่มาถูกละเลย แถวถัดไปเลยไปชิดติดกับ address picker
  host: { class: 'block' },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AddressPicker), multi: true },
  ],
})
export class AddressPicker implements ControlValueAccessor {
  private dataSvc = inject(AddressDataService);

  protected readonly provinces = signal<Province[]>([]);
  protected readonly detail = signal('');
  protected readonly province = signal('');
  protected readonly amphure = signal('');
  protected readonly tambon = signal('');
  protected readonly zip = signal('');
  protected readonly isDisabled = signal(false);

  protected readonly amphures = computed(
    () => this.provinces().find((p) => p.n === this.province())?.a ?? []
  );
  protected readonly tambons = computed(
    () => this.amphures().find((a) => a.n === this.amphure())?.t ?? []
  );

  // แปลงเป็นรูปแบบที่ combobox ใช้ (ตำบลโชว์รหัสไปรษณีย์เป็นข้อความรอง ค้นด้วยรหัสได้ด้วย)
  protected readonly provinceOptions = computed<ComboOption[]>(() =>
    this.provinces().map((p) => ({ value: p.n, label: p.n }))
  );
  protected readonly amphureOptions = computed<ComboOption[]>(() =>
    this.amphures().map((a) => ({ value: a.n, label: a.n }))
  );
  protected readonly tambonOptions = computed<ComboOption[]>(() =>
    this.tambons().map((t) => ({ value: t.n, label: t.n, hint: t.z }))
  );

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};
  private pending: string | null = null;

  constructor() {
    this.dataSvc.load().subscribe((list) => {
      this.provinces.set(list);
      if (this.pending !== null) {
        this.parse(this.pending);
        this.pending = null;
      }
    });
  }

  // ---- ControlValueAccessor ----
  writeValue(v: string): void {
    if (this.provinces().length) this.parse(v || '');
    else this.pending = v || '';
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  // ---- handlers ----
  protected onDetail(v: string): void {
    this.detail.set(v);
    this.emit();
  }
  protected onProvince(v: string): void {
    this.province.set(v);
    this.amphure.set('');
    this.tambon.set('');
    this.zip.set('');
    this.emit();
  }
  protected onAmphure(v: string): void {
    this.amphure.set(v);
    this.tambon.set('');
    this.zip.set('');
    this.emit();
  }
  protected onTambon(v: string): void {
    this.tambon.set(v);
    this.zip.set(this.tambons().find((t) => t.n === v)?.z ?? '');
    this.emit();
  }

  private emit(): void {
    const parts: string[] = [];
    if (this.detail().trim()) parts.push(this.detail().trim());
    if (this.tambon()) parts.push('ต.' + this.tambon());
    if (this.amphure()) parts.push('อ.' + this.amphure());
    if (this.province()) parts.push('จ.' + this.province());
    if (this.zip()) parts.push(this.zip());
    this.onChange(parts.join(' '));
    this.onTouched();
  }

  /** แยกที่อยู่เดิม (ตอนแก้ไข) กลับมาใส่ช่องต่าง ๆ แบบ best-effort */
  private parse(value: string): void {
    this.province.set('');
    this.amphure.set('');
    this.tambon.set('');
    this.zip.set('');
    this.detail.set('');
    if (!value) return;

    const zipMatch = value.match(/(\d{5})\s*$/);
    const zip = zipMatch ? zipMatch[1] : '';
    let s = zipMatch ? value.slice(0, zipMatch.index).trim() : value.trim();

    const tokens = s.split(/\s+/);
    const detailParts: string[] = [];
    let prov = '', amph = '', tamb = '';
    for (const tok of tokens) {
      if (tok.startsWith('จ.')) prov = tok.slice(2);
      else if (tok.startsWith('อ.')) amph = tok.slice(2);
      else if (tok.startsWith('ต.')) tamb = tok.slice(2);
      else detailParts.push(tok);
    }

    const pObj = this.provinces().find((p) => p.n === prov);
    if (pObj) {
      this.province.set(pObj.n);
      const aObj = pObj.a.find((a) => a.n === amph);
      if (aObj) {
        this.amphure.set(aObj.n);
        const tObj = aObj.t.find((t) => t.n === tamb);
        if (tObj) {
          this.tambon.set(tObj.n);
          this.zip.set(zip || tObj.z);
        }
      }
      this.detail.set(detailParts.join(' '));
    } else {
      // แยกไม่ได้ → ใส่ทั้งหมดในช่องรายละเอียด
      this.detail.set(value.trim());
    }
  }
}
