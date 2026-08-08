import {
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ComboOption {
  value: string;
  label: string;
  /** ข้อความรองต่อท้าย เช่น เลขภาษี — ใช้ค้นหาได้ด้วย */
  hint?: string;
}

/**
 * Dropdown ที่พิมพ์ค้นหาได้ (autocomplete)
 *
 * ใช้ได้ 2 แบบเหมือน app-switch
 *   <app-combobox [options]="opts" [value]="v" (valueChange)="onPick($event)" />
 *   <app-combobox [options]="opts" formControlName="province" />
 *
 * รายการอยู่ใน popover (top layer) จึงไม่โดน overflow/stacking context ของการ์ดครอบ
 */
@Component({
  selector: 'app-combobox',
  imports: [],
  templateUrl: './combobox.html',
  host: {
    class: 'block',
    '(window:scroll)': 'reposition()',
    '(window:resize)': 'reposition()',
    '(document:click)': 'onDocClick($event)',
  },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Combobox), multi: true }],
})
export class Combobox implements ControlValueAccessor {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private pop = viewChild.required<ElementRef<HTMLDivElement>>('pop');

  readonly options = input<ComboOption[]>([]);
  readonly value = input('');
  readonly placeholder = input('— เลือก —');
  readonly disabled = input(false);
  readonly emptyText = input('ไม่พบรายการที่ตรงกับคำค้น');

  readonly valueChange = output<string>();

  private readonly formValue = signal<string | null>(null);
  private readonly cvaDisabled = signal(false);
  private usedInForm = false;

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  protected readonly current = computed(() => this.formValue() ?? this.value());
  protected readonly isDisabled = computed(() => this.cvaDisabled() || this.disabled());

  protected readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this.current())?.label ?? ''
  );

  /** ค้นหาจากทั้ง label และ hint แบบไม่สนตัวพิมพ์ */
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.options();
    return this.options().filter(
      (o) => o.label.toLowerCase().includes(q) || (o.hint ?? '').toLowerCase().includes(q)
    );
  });

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  // ---- ControlValueAccessor ----
  writeValue(v: string | null): void {
    this.formValue.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
    this.usedInForm = true;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.cvaDisabled.set(disabled);
    if (disabled) this.close();
  }

  // ---- เปิด/ปิด ----
  protected openList(): void {
    if (this.isDisabled() || this.open()) return;
    this.query.set('');
    this.activeIndex.set(Math.max(0, this.filtered().findIndex((o) => o.value === this.current())));
    this.open.set(true);
    this.pop().nativeElement.showPopover();
    this.reposition();
  }

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.query.set('');
    const pop = this.pop().nativeElement;
    if (pop.matches(':popover-open')) pop.hidePopover();
    this.onTouched();
  }

  protected onDocClick(e: Event): void {
    const target = e.target as Node;
    if (this.el.nativeElement.contains(target)) return;
    if (this.pop().nativeElement.contains(target)) return;
    this.close();
  }

  // ---- พิมพ์ค้นหา ----
  protected onInput(text: string): void {
    if (!this.open()) this.openList();
    this.query.set(text);
    this.activeIndex.set(0);
  }

  protected onKey(e: KeyboardEvent): void {
    if (this.isDisabled()) return;
    const list = this.filtered();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.open()) return this.openList();
        this.activeIndex.update((i) => (list.length ? (i + 1) % list.length : 0));
        this.scrollActiveIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this.open()) return this.openList();
        this.activeIndex.update((i) => (list.length ? (i - 1 + list.length) % list.length : 0));
        this.scrollActiveIntoView();
        break;
      case 'Enter':
        if (this.open()) {
          e.preventDefault();
          const opt = list[this.activeIndex()];
          if (opt) this.pick(opt);
        }
        break;
      case 'Escape':
        if (this.open()) {
          e.preventDefault();
          this.close();
        }
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  protected pick(opt: ComboOption): void {
    if (this.usedInForm) this.formValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.close();
    this.field().nativeElement.blur();
  }

  /** ล้างค่าที่เลือกไว้ */
  protected clear(e: Event): void {
    e.stopPropagation();
    if (this.isDisabled()) return;
    if (this.usedInForm) this.formValue.set('');
    this.onChange('');
    this.valueChange.emit('');
    this.close();
  }

  private scrollActiveIntoView(): void {
    queueMicrotask(() => {
      const node = this.pop().nativeElement.querySelector('[data-active="true"]');
      node?.scrollIntoView({ block: 'nearest' });
    });
  }

  /** popover อยู่ใน top layer จึงต้องคำนวณตำแหน่งเอง (เช็คจาก :popover-open ไม่ใช่สัญญาณ open) */
  protected reposition(): void {
    const pop = this.pop().nativeElement;
    if (!pop.matches(':popover-open')) return;
    const t = this.field().nativeElement.getBoundingClientRect();
    const gap = 5;
    const edge = 8;

    pop.style.width = `${t.width}px`;
    let top = t.bottom + gap;
    if (top + pop.offsetHeight > window.innerHeight - edge) {
      top = Math.max(edge, t.top - gap - pop.offsetHeight);
    }
    pop.style.left = `${Math.max(edge, Math.min(t.left, window.innerWidth - edge - t.width))}px`;
    pop.style.top = `${top}px`;
  }
}
