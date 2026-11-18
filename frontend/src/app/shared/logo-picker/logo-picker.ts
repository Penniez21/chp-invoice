import { Component, forwardRef, inject, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToastService } from '../toast/toast.service';

/** ย่อด้านยาวสุดของรูปเหลือเท่านี้ — ที่หัวกระดาษ A4 โลโก้สูงไม่ถึง 100px จึงพอแม้ตอนพิมพ์ */
const MAX_SIDE = 600;
/** ต้องต่ำกว่าเพดานของ backend (@ImageDataUrl ไม่เกิน 700,000 ตัวอักษร) */
const MAX_DATA_URL = 650_000;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * อัปโหลดโลโก้ — ค่าเป็น data URL (data:image/png;base64,...) หรือ null
 * <app-logo-picker formControlName="logo" />
 *
 * ย่อรูปที่เลือกด้วย canvas ก่อนเก็บ ไฟล์ใหญ่จากกล้อง/สแกนเนอร์จึงไม่ถ่วงฐานข้อมูล
 * ไม่รับ SVG เพราะ SVG ฝังสคริปต์ได้ (backend ก็ปฏิเสธเหมือนกัน)
 */
@Component({
  selector: 'app-logo-picker',
  host: { class: 'block' },
  template: `
    <input #file type="file" class="hidden" [accept]="accept" (change)="onFile(file)" />
    @if (value(); as src) {
      <div class="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-3">
        <!-- พื้นขาวเสมอ ให้เห็นโลโก้เหมือนบนกระดาษจริง แม้อยู่ในธีมมืด -->
        <div class="h-24 w-40 shrink-0 rounded-lg bg-white p-2 ring-1 ring-line">
          <!-- h-full/w-full + object-contain: ย่อให้อยู่ในกรอบเสมอ (max-h-full ในกริดไม่หดจริง รูปทะลุกรอบ) -->
          <img [src]="src" alt="โลโก้" class="h-full w-full object-contain" />
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn btn--ghost" [disabled]="disabled()" (click)="file.click()">เปลี่ยนรูป</button>
          <!-- ! เพราะ .btn--ghost ไม่อยู่ใน layer จึงชนะ utility ของ Tailwind ที่ไม่มี ! -->
          <button type="button" class="btn btn--ghost !text-red-600" [disabled]="disabled()" (click)="clear()">ลบโลโก้</button>
        </div>
      </div>
    } @else {
      <button type="button" [disabled]="disabled() || busy()" (click)="file.click()"
              class="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-line px-4 py-5 text-sm text-ink-soft transition hover:border-primary hover:bg-primary-soft/40 hover:text-ink">
        <span class="text-2xl leading-none">🖼</span>
        <span class="font-medium">{{ busy() ? 'กำลังเตรียมรูป…' : 'อัปโหลดโลโก้' }}</span>
        <span class="text-xs">PNG / JPG / WEBP — แสดงที่หัวใบเสนอราคา</span>
      </button>
    }
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LogoPicker), multi: true }],
})
export class LogoPicker implements ControlValueAccessor {
  private toast = inject(ToastService);

  protected readonly accept = ACCEPTED.join(',');
  protected readonly value = signal<string | null>(null);
  protected readonly disabled = signal(false);
  protected readonly busy = signal(false);

  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  // ---- ControlValueAccessor ----
  writeValue(v: string | null): void {
    this.value.set(v || null);
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

  protected clear(): void {
    this.set(null);
  }

  protected async onFile(input: HTMLInputElement): Promise<void> {
    const f = input.files?.[0];
    input.value = ''; // เลือกไฟล์เดิมซ้ำได้ (change จะไม่ยิงถ้าค่าเท่าเดิม)
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      this.toast.error('ใช้ไฟล์นี้ไม่ได้', 'โลโก้ต้องเป็นรูป PNG, JPG หรือ WEBP');
      return;
    }
    this.busy.set(true);
    try {
      const dataUrl = await shrink(f);
      if (dataUrl.length > MAX_DATA_URL) {
        this.toast.error('รูปใหญ่เกินไป', 'ลองใช้ไฟล์ที่เล็กลง หรือพื้นหลังเรียบกว่านี้');
        return;
      }
      this.set(dataUrl);
    } catch {
      this.toast.error('อ่านรูปไม่สำเร็จ', 'ไฟล์อาจเสีย ลองเลือกไฟล์อื่น');
    } finally {
      this.busy.set(false);
    }
  }

  private set(v: string | null): void {
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
  }
}

/** ย่อให้ด้านยาวสุดไม่เกิน MAX_SIDE (ไม่ขยายรูปเล็ก) แล้วเข้ารหัสใหม่เป็น PNG ซึ่งคมและรักษาพื้นโปร่งใส */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
