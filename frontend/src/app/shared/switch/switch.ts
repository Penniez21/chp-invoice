import { Component, computed, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * สวิตช์เปิด/ปิด ใช้ได้ 2 แบบ
 *
 * 1) คุมค่าจากภายนอก (เช่นในตาราง — ต้องรอผลจากเซิร์ฟเวอร์ก่อนค่อยเปลี่ยนสถานะ)
 *    <app-switch [checked]="a.showOnInvoice" (toggled)="doSomething()" />
 *    ตัวสวิตช์จะ "ไม่" สลับเอง แสดงตาม [checked] เท่านั้น กันไม่ให้ UI โกหกตอนเซิร์ฟเวอร์ปฏิเสธ
 *
 * 2) ผูกกับฟอร์ม
 *    <app-switch formControlName="showOnInvoice" />
 */
@Component({
  selector: 'app-switch',
  imports: [],
  template: `
    <button type="button" class="switch"
            role="switch"
            [attr.aria-checked]="state()"
            [attr.aria-disabled]="isDisabled()"
            [attr.aria-label]="ariaLabel() || null"
            [disabled]="isDisabled()"
            (click)="toggle()">
      <span class="switch__knob"></span>
    </button>
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Switch), multi: true }],
})
export class Switch implements ControlValueAccessor {
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input('');

  /** ค่าที่ผู้ใช้ "ขอ" เปลี่ยนเป็น — ผู้เรียกเป็นคนตัดสินว่าจะเปลี่ยนจริงไหม */
  readonly toggled = output<boolean>();

  private readonly formValue = signal<boolean | null>(null);
  private readonly cvaDisabled = signal(false);
  private usedInForm = false;

  protected readonly state = computed(() => this.formValue() ?? this.checked());
  protected readonly isDisabled = computed(() => this.cvaDisabled() || this.disabled());

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  // ---- ControlValueAccessor ----
  writeValue(v: boolean): void {
    this.formValue.set(!!v);
  }
  registerOnChange(fn: (v: boolean) => void): void {
    this.onChange = fn;
    this.usedInForm = true;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.cvaDisabled.set(disabled);
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    const next = !this.state();
    if (this.usedInForm) {
      this.formValue.set(next);
      this.onChange(next);
      this.onTouched();
    }
    this.toggled.emit(next);
  }
}
