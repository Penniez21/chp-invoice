import { Directive, ElementRef, inject, input, numberAttribute } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * อนุญาตเฉพาะตัวเลขในช่องกรอก — ตัดอักขระอื่นทิ้งทันทีทั้งตอนพิมพ์และตอนวาง
 * (`inputmode="numeric"` แค่เปลี่ยนคีย์บอร์ดบนมือถือ ไม่ได้กันการพิมพ์/วางตัวอักษร)
 *
 * ใส่ค่าเพื่อจำกัดจำนวนหลักได้ เช่น `appDigitsOnly="10"`
 *
 * ทำไมไม่ใช้ `maxlength` ของ HTML — มันนับ "ตัวอักษรดิบ" ก่อนที่เราจะตัดอักขระอื่นทิ้ง
 * วางเบอร์ `088-191-3078` (12 ตัว) จึงถูกตัดเหลือ `088-191-30` แล้วค่อยกรองเป็น `08819130`
 * เลขหายไปเงียบ ๆ การนับที่ "จำนวนหลัก" ตรงนี้แทนจึงได้ `0881913078` ครบถูกต้อง
 */
@Directive({
  selector: 'input[appDigitsOnly]',
  host: { '(input)': 'onInput()' },
})
export class DigitsOnly {
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  /** จำนวนหลักสูงสุด — เว้นว่างไว้ = ไม่จำกัด */
  readonly maxDigits = input(NaN, { alias: 'appDigitsOnly', transform: numberAttribute });

  protected onInput(): void {
    const input = this.el.nativeElement;
    const raw = input.value;

    const limit = this.maxDigits();
    const digits = raw.replace(/\D/g, '');
    const cleaned = Number.isFinite(limit) && limit > 0 ? digits.slice(0, limit) : digits;
    if (cleaned === raw) return;

    // รักษาตำแหน่งเคอร์เซอร์ไว้ โดยหักจำนวนอักขระที่ถูกตัดออกก่อนหน้าเคอร์เซอร์
    const caret = input.selectionStart ?? raw.length;
    const head = raw.slice(0, caret);
    const removedBefore = head.length - head.replace(/\D/g, '').length;

    input.value = cleaned;
    this.ngControl?.control?.setValue(cleaned);

    const next = Math.min(Math.max(0, caret - removedBefore), cleaned.length);
    input.setSelectionRange(next, next);
  }
}
