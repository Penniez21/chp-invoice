import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HEAD_OFFICE } from '../document/branch';

type Mode = 'none' | 'head' | 'branch';

/**
 * สำนักงานใหญ่ / สาขาที่ — สำหรับใบกำกับภาษีเต็มรูป
 * <app-branch-input formControlName="branch" />
 * ค่าเป็นรหัส 5 หลักแบบกรมสรรพากร: '00000' = สำนักงานใหญ่ · '00001'… = สาขา · null = ไม่ระบุ
 * พิมพ์เลขสาขาแค่ "1" ก็เติมศูนย์ให้ครบ 5 หลักเอง
 */
@Component({
  selector: 'app-branch-input',
  host: { class: 'block' },
  template: `
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-1 rounded-full border border-line bg-surface p-1" role="radiogroup" aria-label="สำนักงานใหญ่ / สาขา">
        @for (o of options; track o.mode) {
          <button type="button" role="radio" [attr.aria-checked]="mode() === o.mode" [disabled]="disabled()"
                  (click)="pick(o.mode)"
                  class="rounded-full px-3 py-1 text-xs font-medium transition-all"
                  [class]="mode() === o.mode ? 'bg-primary text-white shadow' : 'text-ink-soft hover:text-ink'">
            {{ o.label }}
          </button>
        }
      </div>
      @if (mode() === 'branch') {
        <span class="flex items-center gap-1.5 whitespace-nowrap text-sm text-ink-soft">
          สาขาที่
          <input class="w-24 rounded-lg border border-line bg-surface px-2 py-1 text-ink" inputmode="numeric"
                 maxlength="5" placeholder="00001" [value]="num()" [disabled]="disabled()"
                 (input)="onNum($any($event.target))" (blur)="onBlur($any($event.target))" />
        </span>
      }
    </div>
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BranchInput), multi: true }],
})
export class BranchInput implements ControlValueAccessor {
  protected readonly options: { mode: Mode; label: string }[] = [
    { mode: 'none', label: 'ไม่ระบุ' },
    { mode: 'head', label: 'สำนักงานใหญ่' },
    { mode: 'branch', label: 'สาขา' },
  ];
  protected readonly mode = signal<Mode>('none');
  protected readonly num = signal('');
  protected readonly disabled = signal(false);

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(code: string | null): void {
    if (!code) {
      this.mode.set('none');
      this.num.set('');
    } else if (code === HEAD_OFFICE) {
      this.mode.set('head');
      this.num.set('');
    } else {
      this.mode.set('branch');
      this.num.set(code);
    }
  }
  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected pick(mode: Mode): void {
    this.mode.set(mode);
    this.emit();
  }

  protected onNum(input: HTMLInputElement): void {
    const digits = input.value.replace(/\D/g, '').slice(0, 5);
    input.value = digits;
    this.num.set(digits);
    this.emit();
  }

  /** ออกจากช่องแล้วแสดงแบบเติมศูนย์ครบ 5 หลัก ให้เห็นว่าบนเอกสารจะเป็นอย่างไร */
  protected onBlur(input: HTMLInputElement): void {
    if (this.num()) {
      this.num.set(this.num().padStart(5, '0'));
      input.value = this.num();
    }
    this.onTouched();
  }

  private emit(): void {
    const mode = this.mode();
    if (mode === 'none') this.onChange(null);
    else if (mode === 'head') this.onChange(HEAD_OFFICE);
    else this.onChange(this.num() ? this.num().padStart(5, '0') : null);
    this.onTouched();
  }
}
