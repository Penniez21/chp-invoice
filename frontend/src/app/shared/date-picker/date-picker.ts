import { Component, ElementRef, computed, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface CalDay {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

/**
 * ปฏิทินเลือกวันที่ที่เข้ากับธีมของระบบ
 *
 * ทำไมไม่ใช้ <input type="date"> — ป็อปอัปปฏิทินของเบราว์เซอร์ถูกวาดนอกหน้าเว็บ
 * CSS เข้าไม่ถึง (Chromium 148 ยังไม่รองรับ `appearance: base` สำหรับ input วันที่)
 * จึงต้องทำเองเพื่อให้คุมสีและรูปทรงได้
 *
 * เป็น ControlValueAccessor → ใช้กับ formControlName ได้ และเก็บค่าเป็น ISO `yyyy-MM-dd`
 * รูปแบบเดียวกับของเดิม (backend/ฟอร์มไม่ต้องแก้)
 */
@Component({
  selector: 'app-date-picker',
  imports: [],
  templateUrl: './date-picker.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePicker), multi: true },
  ],
  host: {
    '(window:scroll)': 'reposition()',
    '(window:resize)': 'reposition()',
  },
})
export class DatePicker implements ControlValueAccessor {
  private trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private pop = viewChild.required<ElementRef<HTMLDivElement>>('pop');

  readonly placeholder = input('เลือกวันที่');
  readonly ariaLabel = input('เลือกวันที่');

  protected readonly value = signal(''); // ISO yyyy-MM-dd
  protected readonly open = signal(false);
  protected readonly isDisabled = signal(false);

  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly viewMonth = signal(new Date().getMonth());

  protected readonly weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  private readonly months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  protected readonly monthLabel = computed(() => `${this.months[this.viewMonth()]} ${this.viewYear()}`);

  /** ค่าที่โชว์ในช่อง — วว/ดด/ปปปป ให้ตรงกับรูปแบบวันที่ในรายงาน */
  protected readonly display = computed(() => {
    const v = this.value();
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  });

  /** 6 สัปดาห์เต็มเสมอ (42 ช่อง) ความสูงปฏิทินจะได้ไม่กระโดดตอนเปลี่ยนเดือน */
  protected readonly days = computed<CalDay[]>(() => {
    const y = this.viewYear();
    const m = this.viewMonth();
    const start = new Date(y, m, 1 - new Date(y, m, 1).getDay()); // ถอยไปวันอาทิตย์แรกของตาราง
    const todayIso = this.toIso(new Date());
    const selected = this.value();

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = this.toIso(d);
      return {
        iso,
        day: d.getDate(),
        inMonth: d.getMonth() === m,
        isToday: iso === todayIso,
        isSelected: iso === selected,
      };
    });
  });

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ---- ControlValueAccessor ----
  writeValue(v: string | null): void {
    this.value.set(v ?? '');
    this.syncViewToValue();
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
    if (disabled) this.close();
  }

  // ---- handlers ----
  protected toggle(): void {
    if (this.isDisabled()) return;
    const pop = this.pop().nativeElement;
    if (pop.matches(':popover-open')) {
      pop.hidePopover();
      return;
    }
    this.syncViewToValue();
    pop.showPopover();
    this.reposition();
  }

  protected close(): void {
    const pop = this.pop().nativeElement;
    if (pop.matches(':popover-open')) pop.hidePopover();
  }

  /** ซิงก์สถานะจาก popover จริง — ครอบคลุมตอนเบราว์เซอร์ปิดให้เอง (คลิกนอกกล่อง / Esc) */
  protected onToggle(): void {
    const isOpen = this.pop().nativeElement.matches(':popover-open');
    this.open.set(isOpen);
    if (!isOpen) this.onTouched();
  }

  /**
   * popover อยู่ใน top layer จึงต้องคำนวณตำแหน่งเอง (ไม่ผูกกับ ancestor)
   * ปกติวางใต้ช่อง ถ้าพื้นที่ด้านล่างไม่พอก็พลิกขึ้นด้านบน
   */
  protected reposition(): void {
    const pop = this.pop().nativeElement;
    // เช็คจาก popover จริง ไม่ใช่ signal `open` — เพราะตอนเรียกจาก toggle() อีเวนต์ toggle
    // ยังไม่ทำงาน signal จึงยังเป็น false อยู่ แต่ตัว popover เปิดแล้ว
    if (!pop.matches(':popover-open')) return;
    const t = this.trigger().nativeElement.getBoundingClientRect();
    const gap = 6;
    const edge = 8;

    let top = t.bottom + gap;
    if (top + pop.offsetHeight > window.innerHeight - edge) {
      top = Math.max(edge, t.top - gap - pop.offsetHeight);
    }
    let left = t.left;
    if (left + pop.offsetWidth > window.innerWidth - edge) {
      left = Math.max(edge, window.innerWidth - edge - pop.offsetWidth);
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  protected shiftMonth(delta: number): void {
    const d = new Date(this.viewYear(), this.viewMonth() + delta, 1);
    this.viewYear.set(d.getFullYear());
    this.viewMonth.set(d.getMonth());
  }

  protected shiftYear(delta: number): void {
    this.viewYear.update((y) => y + delta);
  }

  protected pick(iso: string): void {
    this.value.set(iso);
    this.onChange(iso);
    this.close();
  }

  protected pickToday(): void {
    this.pick(this.toIso(new Date()));
  }

  protected clear(): void {
    this.value.set('');
    this.onChange('');
    this.close();
  }

  /** เปิดปฏิทินค้างที่เดือนของค่าที่เลือกไว้ ถ้ายังไม่มีค่าก็ใช้เดือนปัจจุบัน */
  private syncViewToValue(): void {
    const v = this.value();
    const d = v ? new Date(v + 'T00:00:00') : new Date();
    if (Number.isNaN(d.getTime())) return;
    this.viewYear.set(d.getFullYear());
    this.viewMonth.set(d.getMonth());
  }

  /** ใช้เวลาท้องถิ่น (ไม่ใช่ toISOString) ไม่งั้นโซนเวลา +07 จะทำให้วันเพี้ยนไป 1 วัน */
  private toIso(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
}
