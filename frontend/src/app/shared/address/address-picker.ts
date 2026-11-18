import { Component, computed, forwardRef, inject, signal } from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator,
} from '@angular/forms';
import { AddressDataService, Province } from './address-data.service';
import { Combobox, ComboOption } from '../combobox/combobox';

/**
 * ที่อยู่บนเอกสาร A4 (ใบแจ้งหนี้ / ใบเสร็จ / ใบเสนอราคา) ยาวได้ไม่เกิน 2 บรรทัด ไม่งั้นข้อมูลยืดจนดันตารางลง
 * ช่องที่อยู่ที่แคบที่สุดบนเอกสาร = 794 (A4) − 72 (p-9 ซ้ายขวา) − 240 (กล่องขวา w-60) − 32 (gap-8)
 * − 70 (คอลัมน์ป้าย) − 8 (gap-x-2) = 372px ที่ตัวอักษร 12px Sarabun
 */
export const MAX_ADDRESS_LINES = 2;
const DOC_ADDRESS_WIDTH_PX = 372;
const DOC_FONT = '12px Sarabun';

let measureCtx: CanvasRenderingContext2D | null = null;

/**
 * ประมาณว่าที่อยู่นี้จะกินกี่บรรทัดบนเอกสาร — วัดความกว้างจริงด้วยฟอนต์ของเอกสาร
 * (นับตัวอักษรไม่ได้ เพราะสระบน/ล่างและวรรณยุกต์นับเป็นตัวอักษรแต่ไม่กินที่)
 * เติมคำที่คั่นด้วยช่องว่างทีละคำแบบที่เบราว์เซอร์ตัดบรรทัด — เทียบกับของจริงแล้วตรงกัน
 */
export function addressLinesOnDocument(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  measureCtx ??= document.createElement('canvas').getContext('2d');
  if (!measureCtx) return 1;
  measureCtx.font = DOC_FONT;
  const ctx = measureCtx;
  const space = ctx.measureText(' ').width;
  let lines = 1;
  let used = 0;
  for (const w of words) {
    const width = ctx.measureText(w).width;
    if (used > 0 && used + space + width <= DOC_ADDRESS_WIDTH_PX) {
      used += space + width;
      continue;
    }
    if (used > 0) lines++;
    // คำเดียวยาวกว่าบรรทัด → ล้นไปหลายบรรทัด
    lines += Math.ceil(width / DOC_ADDRESS_WIDTH_PX) - 1;
    used = width % DOC_ADDRESS_WIDTH_PX || width;
  }
  return lines;
}

/**
 * ช่องกรอกที่อยู่แบบเลือก จังหวัด → อำเภอ → ตำบล → เติมรหัสไปรษณีย์อัตโนมัติ
 * เป็น ControlValueAccessor → ใช้กับ formControlName ได้ และเก็บค่าเป็น string ที่ประกอบแล้ว
 * เป็น Validator ด้วย: ที่อยู่ยาวเกิน MAX_ADDRESS_LINES บรรทัดบนเอกสาร → ฟอร์มไม่ valid บันทึกไม่ได้
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
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => AddressPicker), multi: true },
  ],
})
export class AddressPicker implements ControlValueAccessor, Validator {
  protected readonly maxLines = MAX_ADDRESS_LINES;
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

  /** ที่อยู่ที่ประกอบแล้ว — ค่าที่ส่งออกไปให้ฟอร์ม และใช้วัดความยาวบนเอกสาร */
  protected readonly composed = computed(() => {
    const parts: string[] = [];
    if (this.detail().trim()) parts.push(this.detail().trim());
    if (this.tambon()) parts.push('ต.' + this.tambon());
    if (this.amphure()) parts.push('อ.' + this.amphure());
    if (this.province()) parts.push('จ.' + this.province());
    if (this.zip()) parts.push(this.zip());
    return parts.join(' ');
  });
  protected readonly docLines = computed(() => addressLinesOnDocument(this.composed()));

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

  // ---- Validator ---- วัดจากค่าของฟอร์มเอง จึงครอบคลุมค่าที่ patch เข้ามาจากข้อมูลเดิมด้วย
  validate(control: AbstractControl): ValidationErrors | null {
    const lines = addressLinesOnDocument(String(control.value ?? ''));
    return lines > MAX_ADDRESS_LINES ? { addressTooLong: { lines, max: MAX_ADDRESS_LINES } } : null;
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
    this.onChange(this.composed());
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
