import {
  ApplicationRef, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, numberAttribute, signal,
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvoiceResponse, InvoiceService } from '../invoice.service';
import { BankAccount, BankAccountService } from '../../settings/bank-account.service';
import { Issuer, IssuerService } from '../../settings/issuer.service';
import { Recipient, RecipientService } from '../../settings/recipient.service';
import { Stepper, Step } from '../../../shared/stepper/stepper';
import { Spinner } from '../../../shared/spinner/spinner';
import { ToastService } from '../../../shared/toast/toast.service';
import { apiErrorMessage } from '../../../core/api-error';

@Component({
  selector: 'app-invoice-report',
  imports: [RouterLink, Stepper, Spinner, NgTemplateOutlet, NgClass],
  templateUrl: './invoice-report.html',
  // block — ต้องวัดความกว้างของ host ได้ (ค่าเริ่มต้นของ custom element เป็น inline ซึ่ง clientWidth = 0)
  host: { class: 'block', '(document:keydown.escape)': 'closePreview()' },
})
export class InvoiceReport {
  private invoiceService = inject(InvoiceService);
  private bankService = inject(BankAccountService);
  private issuerService = inject(IssuerService);
  private recipientService = inject(RecipientService);
  private toast = inject(ToastService);
  private appRef = inject(ApplicationRef);

  // ---- บันทึกข้อมูลจากใบนี้ไว้ใช้ครั้งหน้า (ปุ่มขึ้นเฉพาะที่ยังไม่มีในฐานข้อมูล) ----
  protected readonly savedIssuers = signal<Issuer[]>([]);
  protected readonly savedRecipients = signal<Recipient[]>([]);
  /** มีบัญชีธนาคารในระบบแล้วหรือยัง — true ไว้ก่อนกันปุ่มกระพริบตอนยังโหลดไม่เสร็จ */
  protected readonly hasAnyBank = signal(true);
  protected readonly savingIssuer = signal(false);
  protected readonly savingRecipient = signal(false);

  /** ผู้ออกของใบนี้ถูกบันทึกไว้แล้วหรือยัง (เทียบชื่อ + เลขภาษี) */
  protected readonly issuerSaved = computed(() => {
    const inv = this.invoice();
    if (!inv) return true;
    const name = (inv.issuerName ?? '').trim();
    const tax = inv.issuerTaxId ?? '';
    return this.savedIssuers().some((i) => i.name.trim() === name && (i.taxId ?? '') === tax);
  });

  protected readonly recipientSaved = computed(() => {
    const inv = this.invoice();
    if (!inv) return true;
    const name = (inv.recipientName ?? '').trim();
    const tax = inv.recipientTaxId ?? '';
    return this.savedRecipients().some((r) => r.name.trim() === name && (r.taxId ?? '') === tax);
  });

  /** ป้ายกำกับมุมขวาบนของเอกสาร — สลับเป็น "สำเนา" ตอนเก็บภาพหน้าที่ 2 ของ PDF */
  protected readonly docLabel = signal('ต้นฉบับ');

  readonly id = input(0, { transform: numberAttribute });

  protected readonly steps: Step[] = [
    { label: 'กรอกข้อมูล', icon: '✎' },
    { label: 'ตรวจสอบ & รายงาน', icon: '📄' },
  ];

  /** บัญชีธนาคารที่เลือกไว้ใน "ตั้งค่า → บัญชีธนาคาร" (สูงสุด 3 บัญชี) */
  protected readonly banks = signal<BankAccount[]>([]);

  protected readonly invoice = signal<InvoiceResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly pdfLoading = signal(false);
  protected readonly errorMsg = signal<string | null>(null);

  /**
   * อัตราย่อเอกสารบนจอ — จอแคบกว่า A4 (มือถือ/แท็บเล็ตแนวตั้งบางรุ่น) จะล็อกเอกสารไว้ที่ 794px
   * แล้วย่อทั้งก้อนด้วย CSS zoom แทนการปล่อยให้จัดเรียงใหม่ ซึ่งทำให้กล่องทับกัน
   * และจำนวนเงินตัวหนังสือแตกบรรทัดละคำ — แบบนี้หน้าตาบนมือถือจึงเหมือน PDF ทุกอย่าง
   */
  protected readonly docZoom = signal(1);

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const measure = () => {
        // กล่องนอกสุดของหน้านี้กว้างได้ไม่เกิน 860px (max-w-[860px])
        const avail = Math.min(860, host.clientWidth);
        this.docZoom.set(avail < InvoiceReport.A4_WIDTH_PX ? avail / InvoiceReport.A4_WIDTH_PX : 1);
      };
      // วัดทันทีหนึ่งครั้ง — ResizeObserver ส่งค่าแรกในเฟรมถัดไป ซึ่งไม่มาเลยถ้าแท็บถูกเปิดไว้เบื้องหลัง
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(host);
      destroyRef.onDestroy(() => ro.disconnect());
    });

    queueMicrotask(() => {
      this.load();
      // บัญชีธนาคารที่เลือกให้แสดง — โหลดล้มเหลวก็แค่ไม่มีส่วน "ชำระเงิน" ในเอกสาร
      this.bankService.listShown().subscribe({
        next: (list) => this.banks.set(list),
        error: () => this.banks.set([]),
      });
      // โหลดรายการที่บันทึกไว้ เพื่อตัดสินใจว่าจะโชว์ปุ่ม "บันทึกไว้ใช้ครั้งหน้า" ไหม
      this.issuerService.list().subscribe({
        next: (l) => this.savedIssuers.set(l),
        error: () => this.savedIssuers.set([]),
      });
      this.recipientService.list().subscribe({
        next: (l) => this.savedRecipients.set(l),
        error: () => this.savedRecipients.set([]),
      });
      // เช็คว่ามีบัญชีธนาคาร "สักบัญชี" ในระบบไหม (ไม่เฉพาะที่เลือกแสดง)
      this.bankService.list().subscribe({
        next: (l) => this.hasAnyBank.set(l.length > 0),
        error: () => this.hasAnyBank.set(true), // พลาดก็ไม่ต้องตื๊อให้เพิ่ม
      });
    });
  }

  /** บันทึกผู้ออกของใบนี้เข้าสู่รายการผู้ออกที่บันทึกไว้ */
  protected saveIssuer(): void {
    const inv = this.invoice();
    if (!inv || this.savingIssuer()) return;
    this.savingIssuer.set(true);
    this.issuerService
      .create({
        name: inv.issuerName,
        taxId: inv.issuerTaxId ?? null,
        address: inv.issuerAddress ?? null,
        email: inv.issuerEmail ?? null,
        phone: inv.issuerPhone ?? null,
      })
      .subscribe({
        next: (created) => {
          this.savingIssuer.set(false);
          this.savedIssuers.update((l) => [...l, created]); // ปุ่มจะหายเองเพราะ issuerSaved() เป็น true
          this.toast.success('บันทึกผู้ออกแล้ว', inv.issuerName);
        },
        error: (e) => {
          this.savingIssuer.set(false);
          this.toast.error('บันทึกผู้ออกไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
        },
      });
  }

  /** บันทึกผู้รับของใบนี้เข้าสู่รายการผู้รับที่บันทึกไว้ */
  protected saveRecipient(): void {
    const inv = this.invoice();
    if (!inv || this.savingRecipient()) return;
    this.savingRecipient.set(true);
    this.recipientService
      .create({
        name: inv.recipientName,
        taxId: inv.recipientTaxId ?? null,
        address: inv.recipientAddress ?? null,
        phone: inv.recipientPhone ?? null,
      })
      .subscribe({
        next: (created) => {
          this.savingRecipient.set(false);
          this.savedRecipients.update((l) => [...l, created]);
          this.toast.success('บันทึกผู้รับแล้ว', inv.recipientName);
        },
        error: (e) => {
          this.savingRecipient.set(false);
          this.toast.error('บันทึกผู้รับไม่สำเร็จ', apiErrorMessage(e, 'ลองใหม่อีกครั้ง'));
        },
      });
  }

  private load(): void {
    const id = this.id();
    if (!id) {
      this.loading.set(false);
      this.errorMsg.set('ไม่พบรหัสใบแจ้งหนี้');
      return;
    }
    this.invoiceService.get(id).subscribe({
      next: (inv) => {
        this.invoice.set(inv);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('โหลดข้อมูลใบแจ้งหนี้ไม่สำเร็จ');
      },
    });
  }

  // ---- ตัวอย่างก่อนพิมพ์ (ทำเองในแอป เพราะหน้าต่างพิมพ์ของเบราว์เซอร์ปรับขนาด/ตำแหน่งไม่ได้) ----

  protected readonly previewOpen = signal(false);
  protected readonly zoom = signal(1);
  protected readonly zoomPercent = () => Math.round(this.zoom() * 100);

  /** ความกว้างกระดาษ A4 ที่ 96dpi — ใช้คำนวณย่อให้พอดีจอ */
  private static readonly A4_WIDTH_PX = 794;

  protected openPreview(): void {
    this.fitZoom();
    this.previewOpen.set(true);
  }

  protected closePreview(): void {
    this.previewOpen.set(false);
  }

  protected fitZoom(): void {
    // เผื่อขอบซ้ายขวาไว้หายใจ — มือถือเผื่อน้อยลง ไม่งั้นกระดาษเหลือนิดเดียว
    const usable = window.innerWidth - (window.innerWidth < 640 ? 32 : 96);
    this.zoom.set(Math.min(1, Math.max(0.3, usable / InvoiceReport.A4_WIDTH_PX)));
  }

  protected zoomBy(delta: number): void {
    this.zoom.update((z) => Math.min(2, Math.max(0.3, Math.round((z + delta) * 100) / 100)));
  }

  /** คลิกพื้นที่มืดรอบ ๆ = ปิด (คลิกบนตัวเอกสารไม่ปิด) */
  protected onPreviewBackdrop(e: MouseEvent): void {
    const el = e.target as HTMLElement;
    if (el.classList.contains('preview__scroll')) this.closePreview();
  }

  /** ปิดตัวอย่างก่อน แล้วค่อยสั่งพิมพ์ เพื่อไม่ให้ overlay ติดไปในเอกสาร */
  protected async printFromPreview(): Promise<void> {
    this.closePreview();
    this.appRef.tick();
    await new Promise((r) => setTimeout(r, 60));
    window.print();
  }

  /**
   * สร้าง PDF จากหน้ารายงานจริง (เบราว์เซอร์เรนเดอร์ภาษาไทยถูกต้อง 100%)
   * ใช้ html-to-image (foreignObject) → jsPDF ได้ไฟล์เหมือนบนเว็บเป๊ะ
   * ได้ 2 หน้า: หน้า 1 = (ต้นฉบับ) · หน้า 2 = (สำเนา)
   */
  protected async downloadPdf(): Promise<void> {
    const el = document.getElementById('invoice-doc');
    if (!el || this.pdfLoading()) return;
    this.pdfLoading.set(true);
    this.errorMsg.set(null);

    const root = document.documentElement;
    const prevTheme = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light'); // บังคับโทนสว่างให้เอกสารสะอาด

    // ล็อกความกว้างเป็นขนาด A4 (210mm @ 96dpi) เพื่อให้เลย์เอาต์พอดี 1 หน้าเสมอ
    const prevWidth = el.style.width;
    const prevMaxWidth = el.style.maxWidth;
    const prevMargin = el.style.margin;
    el.style.width = '794px';
    el.style.maxWidth = 'none';
    // ต้องล้าง margin ด้วย: พอบีบเหลือ 794px ในกล่องแม่ 860px คลาส mx-auto จะคำนวณเป็น
    // margin-left/right = 33px ซึ่ง html-to-image ก๊อป computed style นี้ไปใส่โคลนด้วย
    // → เอกสารถูกดันไปทางขวา 33px ในภาพที่จับได้ และขอบขวาโดนตัดหายไปเท่ากัน
    el.style.margin = '0';
    // จอแคบ เอกสารถูกย่อด้วย zoom ที่กล่องแม่ — คืนเป็น 100% ระหว่างจับภาพ
    // ไม่งั้นขนาดที่ html-to-image วัดได้จะเพี้ยนตามอัตราย่อ และ PDF จากมือถือจะไม่เหมือนจากคอม
    const fit = el.closest<HTMLElement>('.doc-fit');
    const prevZoom = fit?.style.zoom ?? '';
    if (fit) fit.style.zoom = '1';

    try {
      const [{ toPng }, jsPdf] = await Promise.all([
        import('html-to-image'),
        import('jspdf'),
      ]);
      const JsPDF = jsPdf.default;

      /**
       * รอให้เบราว์เซอร์วาดรอบถัดไป — แข่งกับ setTimeout ไว้ด้วย เพราะถ้าผู้ใช้สลับไปแท็บอื่น
       * requestAnimationFrame จะไม่ถูกเรียก ทำให้การสร้าง PDF ค้างไปเลย
       */
      const nextFrame = () =>
        Promise.race([
          new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
          new Promise((r) => setTimeout(r, 120)),
        ]);

      /** เปลี่ยนป้ายกำกับ → รอ DOM อัปเดต → เก็บภาพเอกสาร */
      const capture = async (label: string): Promise<HTMLImageElement> => {
        this.docLabel.set(label);
        this.appRef.tick();
        await nextFrame();
        const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        return img;
      };

      const pdf = new JsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;

      /** ย่อให้พอดีหน้า แล้ววางกึ่งกลางทั้งแนวนอน-แนวตั้ง (ขอบซ้าย=ขวา, บน=ล่าง) */
      const drawCentered = (img: HTMLImageElement): void => {
        const scale = Math.min((pageW - margin * 2) / img.width, (pageH - margin * 2) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        pdf.addImage(img.src, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h, undefined, 'FAST');
      };

      drawCentered(await capture('ต้นฉบับ'));
      pdf.addPage();
      drawCentered(await capture('สำเนา'));

      pdf.save(`invoice-${this.invoice()?.invoiceNo ?? this.id()}.pdf`);
    } catch (e) {
      this.errorMsg.set('สร้าง PDF ไม่สำเร็จ');
    } finally {
      this.docLabel.set('ต้นฉบับ');
      el.style.width = prevWidth;
      el.style.maxWidth = prevMaxWidth;
      el.style.margin = prevMargin;
      if (fit) fit.style.zoom = prevZoom;
      if (prevTheme) root.setAttribute('data-theme', prevTheme);
      else root.removeAttribute('data-theme');
      this.pdfLoading.set(false);
    }
  }

  protected money(v: number | undefined | null): string {
    return (v ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  protected formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  /** แปลงจำนวนเงินเป็นข้อความภาษาไทย เช่น 34,240.00 → สามหมื่นสี่พันสองร้อยสี่สิบบาทถ้วน */
  protected bahtText(value: number | null | undefined): string {
    const num = Math.round((value ?? 0) * 100) / 100;
    const numArr = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const unitArr = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
    const conv = (n: number): string => {
      let s = '';
      const str = String(n);
      const len = str.length;
      for (let i = 0; i < len; i++) {
        const d = +str[i];
        const p = len - 1 - i;
        if (d === 0) continue;
        if (p === 1 && d === 1) s += 'สิบ';
        else if (p === 1 && d === 2) s += 'ยี่สิบ';
        else if (p === 0 && d === 1 && len > 1) s += 'เอ็ด';
        else s += numArr[d] + unitArr[p];
      }
      return s;
    };
    const [intStr, decStr] = num.toFixed(2).split('.');
    const intNum = parseInt(intStr, 10);
    let baht = '';
    if (intNum === 0) {
      baht = 'ศูนย์';
    } else {
      const million = Math.floor(intNum / 1_000_000);
      const remainder = intNum % 1_000_000;
      if (million > 0) baht += conv(million) + 'ล้าน';
      if (remainder > 0) baht += conv(remainder);
    }
    let result = baht + 'บาท';
    const dec = parseInt(decStr, 10);
    result += dec === 0 ? 'ถ้วน' : conv(dec) + 'สตางค์';
    return result;
  }
}
