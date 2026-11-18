import { Component, inject, input, signal } from '@angular/core';
import { BankAccount, BankAccountService } from '../../features/settings/bank-account.service';

/**
 * ฟอร์มใบแจ้งหนี้ / ใบเสร็จ เมื่อเลือก "โอนเงิน": แสดงบัญชีที่จะพิมพ์บนเอกสาร (เลือกไว้ในเมนู บัญชีธนาคาร)
 * ไม่มีอะไรให้กรอกเพิ่ม — แค่ให้เห็นก่อนบันทึกว่าเอกสารจะขึ้นเลขบัญชีไหน
 * ลิงก์ไปเมนูบัญชีธนาคารเปิดแท็บใหม่ ฟอร์มที่กรอกค้างไว้จึงไม่หาย กลับมาที่แท็บนี้แล้วโหลดรายการใหม่ให้เอง
 */
@Component({
  selector: 'app-transfer-accounts',
  host: { class: 'block', '(window:focus)': 'load()' },
  template: `
    @let list = banks();
    @if (list === null) {
      <p class="text-sm text-ink-soft">กำลังโหลดบัญชีธนาคาร…</p>
    } @else if (list.length) {
      <p class="mb-3 text-sm text-ink-soft">เอกสารจะติ๊กช่อง "โอนเงิน" และแสดงบัญชีด้านล่างให้ผู้จ่ายโอนเข้า</p>
      <ul class="divide-y divide-line/60 overflow-hidden rounded-xl border border-line">
        @for (b of list; track b.id) {
          <li class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-3 text-sm">
            <span class="font-medium text-ink">{{ b.bankName }}</span>
            <span class="text-xs text-ink-soft">{{ b.accountType || 'บัญชี' }}</span>
            <span class="ml-auto font-semibold tabular-nums text-ink">{{ b.accountNo }}</span>
            <span class="w-full text-xs text-ink-soft">ชื่อบัญชี {{ b.accountName || issuerName() || '(ชื่อผู้ออก)' }}</span>
          </li>
        }
      </ul>
      <p class="mt-2 text-xs text-ink-soft">
        เปลี่ยนบัญชีที่แสดงได้ในเมนู
        <a href="/settings/banks" target="_blank" class="font-medium text-primary-dark underline underline-offset-2">บัญชีธนาคาร ↗</a>
      </p>
    } @else {
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
        <span class="text-sm text-amber-800">
          ยังไม่ได้เลือกบัญชีให้แสดงบนเอกสาร — เอกสารจะเว้นช่องธนาคาร / เลขที่บัญชีไว้ให้เขียนเอง
        </span>
        <a href="/settings/banks" target="_blank" class="btn btn--ghost btn--sm shrink-0">ตั้งค่าบัญชีธนาคาร ↗</a>
      </div>
    }
  `,
})
export class TransferAccounts {
  private bankService = inject(BankAccountService);

  /** ชื่อผู้ออกในฟอร์ม — บัญชีที่ไม่ได้ตั้งชื่อบัญชี เอกสารจะใช้ชื่อนี้ */
  readonly issuerName = input('');

  /** null = กำลังโหลดครั้งแรก */
  protected readonly banks = signal<BankAccount[] | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.bankService.listShown().subscribe({
      next: (list) => this.banks.set(list),
      error: () => this.banks.set(this.banks() ?? []),
    });
  }
}
