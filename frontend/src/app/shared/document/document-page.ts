import { ApplicationRef, DestroyRef, Directive, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { bahtText } from './baht-text';

/**
 * ส่วนกลางของหน้ารายงานเอกสาร A4 (ใบแจ้งหนี้ / ใบเสนอราคา):
 * ย่อเอกสารให้พอดีจอแคบ · ตัวอย่างก่อนพิมพ์ · สร้าง PDF (กี่หน้าก็ได้ ตามป้ายที่ส่งมา)
 *
 * คอมโพเนนต์ลูกต้องใส่ host: { class: 'block', '(document:keydown.escape)': 'closePreview()' }
 * และวางเอกสารใน .doc-fit แบบเดียวกับ invoice-report.html
 */
@Directive()
export abstract class DocumentPage {
  protected readonly appRef = inject(ApplicationRef);

  /** ความกว้างกระดาษ A4 ที่ 96dpi — ใช้คำนวณย่อให้พอดีจอ */
  protected static readonly A4_WIDTH_PX = 794;

  /** ป้ายกำกับมุมขวาบนของเอกสาร — สลับเป็น "สำเนา" ตอนเก็บภาพหน้าที่ 2 ของ PDF */
  protected readonly docLabel = signal('ต้นฉบับ');
  protected readonly pdfLoading = signal(false);

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
        this.docZoom.set(avail < DocumentPage.A4_WIDTH_PX ? avail / DocumentPage.A4_WIDTH_PX : 1);
      };
      // วัดทันทีหนึ่งครั้ง — ResizeObserver ส่งค่าแรกในเฟรมถัดไป ซึ่งไม่มาเลยถ้าแท็บถูกเปิดไว้เบื้องหลัง
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(host);
      destroyRef.onDestroy(() => ro.disconnect());
    });

    // ผูกกับ beforeprint/afterprint เพื่อให้ชื่อไฟล์ถูกทั้งตอนกดปุ่มสั่งพิมพ์และตอนกด Ctrl+P เอง
    const before = () => this.applyPrintTitle();
    const after = () => this.restoreTitle();
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    destroyRef.onDestroy(() => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      this.restoreTitle();
    });
  }

  // ---- ชื่อไฟล์ ----

  /**
   * ชื่อไฟล์ (ไม่มีนามสกุล) ทั้งตอนดาวน์โหลด PDF และตอนสั่งพิมพ์แล้วเลือก "บันทึกเป็น PDF"
   * ทุกเอกสารใช้รูปแบบเดียวกัน — ดู DocumentPage.docFileName
   */
  protected abstract fileBaseName(): string;

  /**
   * "ชนิดเอกสาร-เลขที่-ชื่อโครงการ" เช่น Invoice-014-งานซ่อมหลังคา · ไม่มีโครงการก็จบที่เลขที่ (Invoice-014)
   * ตัดอักขระที่ Windows/macOS ไม่ยอมให้อยู่ในชื่อไฟล์ทิ้ง (เช่น / : ?) ไม่งั้นเบราว์เซอร์จะแทนด้วย _ เอง
   */
  protected static docFileName(
    type: string,
    no: string | null | undefined,
    project: string | null | undefined,
  ): string {
    const clean = (s: string | null | undefined) =>
      (s ?? '').replace(/[\\/:*?"<>|\x00-\x1f]+/g, ' ').replace(/\s+/g, ' ').trim();
    const name = [type, clean(no), clean(project)].filter(Boolean).join('-');
    // ชื่อโครงการยาวมากจะเกินที่ระบบไฟล์รับได้ · Windows ไม่ยอมให้ชื่อไฟล์ลงท้ายด้วยจุดหรือช่องว่าง
    return name.slice(0, 150).replace(/[. ]+$/, '');
  }

  /**
   * เบราว์เซอร์ตั้งชื่อไฟล์ตอน "บันทึกเป็น PDF" จาก document.title จึงสลับเป็นชื่อเอกสารระหว่างพิมพ์
   * เก็บชื่อเดิมไว้ครั้งเดียว — ปุ่มสั่งพิมพ์เรียกเองก่อน แล้ว beforeprint จะเรียกซ้ำอีกรอบ
   */
  private savedTitle: string | null = null;

  private applyPrintTitle(): void {
    if (this.savedTitle === null) this.savedTitle = document.title;
    document.title = this.fileBaseName() || this.savedTitle;
  }

  private restoreTitle(): void {
    if (this.savedTitle === null) return;
    document.title = this.savedTitle;
    this.savedTitle = null;
  }

  // ---- ตัวอย่างก่อนพิมพ์ (ทำเองในแอป เพราะหน้าต่างพิมพ์ของเบราว์เซอร์ปรับขนาด/ตำแหน่งไม่ได้) ----

  protected readonly previewOpen = signal(false);
  protected readonly zoom = signal(1);
  protected readonly zoomPercent = () => Math.round(this.zoom() * 100);

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
    this.zoom.set(Math.min(1, Math.max(0.3, usable / DocumentPage.A4_WIDTH_PX)));
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
    this.applyPrintTitle();
    try {
      window.print();
    } finally {
      // window.print() รอจนผู้ใช้ปิดหน้าต่างพิมพ์ — คืนชื่อแท็บไว้ตรงนี้ด้วย เผื่อเบราว์เซอร์ไม่ส่ง afterprint
      this.restoreTitle();
    }
  }

  /**
   * สร้าง PDF จากหน้ารายงานจริง (เบราว์เซอร์เรนเดอร์ภาษาไทยถูกต้อง 100%)
   * ใช้ html-to-image (foreignObject) → jsPDF ได้ไฟล์เหมือนบนเว็บเป๊ะ
   * 1 ป้าย = 1 หน้า: ค่าเริ่มต้นได้ 2 หน้า (ต้นฉบับ + สำเนา) แบบใบแจ้งหนี้
   * เอกสารที่ไม่มีสำเนา (ใบเสนอราคา) ส่งป้ายเดียวมา ได้หน้าเดียว
   *
   * โยน error ออกไปถ้าสร้างไม่สำเร็จ — คอมโพเนนต์ลูกเป็นคนตัดสินใจว่าจะแจ้งผู้ใช้อย่างไร
   */
  protected async exportPdf(docId: string, labels = ['ต้นฉบับ', 'สำเนา']): Promise<void> {
    const fileName = `${this.fileBaseName()}.pdf`;
    const el = document.getElementById(docId);
    if (!el || this.pdfLoading()) return;
    this.pdfLoading.set(true);

    const root = document.documentElement;
    const prevTheme = root.getAttribute('data-theme');
    root.setAttribute('data-theme', 'light'); // บังคับโทนสว่างให้เอกสารสะอาด

    // ล็อกความกว้างเป็นขนาด A4 (210mm @ 96dpi) เพื่อให้เลย์เอาต์พอดี 1 หน้าเสมอ
    const prevWidth = el.style.width;
    const prevMaxWidth = el.style.maxWidth;
    const prevMargin = el.style.margin;
    const prevAnimation = el.style.animation;
    // ปิด .animate-in (fadeInUp เริ่มที่ opacity 0) ระหว่างจับภาพ — ถ้าแท็บอยู่เบื้องหลังตอนเปิดหน้า
    // แอนิเมชันจะค้างที่เฟรมแรก แล้ว html-to-image ก๊อป opacity 0 ไปด้วย ได้ PDF หน้าขาวเปล่า
    el.style.animation = 'none';
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

      for (const [i, label] of labels.entries()) {
        if (i > 0) pdf.addPage();
        drawCentered(await capture(label));
      }

      pdf.save(fileName);
    } finally {
      this.docLabel.set('ต้นฉบับ');
      el.style.width = prevWidth;
      el.style.maxWidth = prevMaxWidth;
      el.style.margin = prevMargin;
      el.style.animation = prevAnimation;
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

  protected bahtText(value: number | null | undefined): string {
    return bahtText(value);
  }
}
