import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ThemeService, ThemeMode } from '../../core/theme.service';
import { Logo } from '../../shared/logo/logo';
import { ToastHost } from '../../shared/toast/toast-host';
import { ConfirmHost } from '../../shared/confirm/confirm-host';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact?: boolean;
}

/** เมนูหลักที่มีเมนูย่อย — กดหัวข้อเพื่อพับ/กาง */
interface NavGroup {
  key: string;
  label: string;
  icon: string;
  children: NavItem[];
}

type NavEntry = ({ kind: 'link' } & NavItem) | ({ kind: 'group' } & NavGroup);

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, ToastHost, ConfirmHost],
  templateUrl: './shell.html',
})
export class Shell {
  private auth = inject(AuthService);
  private router = inject(Router);
  protected theme = inject(ThemeService);

  protected readonly collapsed = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly username = this.auth.username;
  protected readonly userMenuOpen = signal(false);

  protected readonly nav: NavEntry[] = [
    { kind: 'link', label: 'แดชบอร์ด', icon: '▚', link: '/dashboard', exact: true },
    {
      kind: 'group', key: 'invoice', label: 'ใบแจ้งหนี้', icon: '▤',
      children: [
        { label: 'รายการใบแจ้งหนี้', icon: '☰', link: '/invoices', exact: true },
        { label: 'สร้างใบแจ้งหนี้', icon: '✎', link: '/invoices/new', exact: true },
        { label: 'ผู้ออก', icon: '☻', link: '/settings/issuers' },
        { label: 'ผู้รับ', icon: '☺', link: '/settings/recipients' },
        { label: 'บัญชีธนาคาร', icon: '𝗕', link: '/settings/banks' },
      ],
    },
    {
      // ผู้ออก / ผู้รับ / บัญชีธนาคาร เป็นหน้าเดียวกับในกลุ่มใบแจ้งหนี้ (ข้อมูลชุดเดียวกัน)
      // ใส่ซ้ำไว้ให้กดได้จากเมนูนี้เลย — ไฮไลต์ตามกลุ่มที่กดเข้ามา ดู activeGroup
      kind: 'group', key: 'receipt', label: 'ใบเสร็จรับเงิน', icon: '▣',
      children: [
        { label: 'รายการใบเสร็จรับเงิน', icon: '☰', link: '/receipts', exact: true },
        { label: 'สร้างใบเสร็จรับเงิน', icon: '✎', link: '/receipts/new', exact: true },
        { label: 'ผู้ออก', icon: '☻', link: '/settings/issuers' },
        { label: 'ผู้รับ', icon: '☺', link: '/settings/recipients' },
        { label: 'บัญชีธนาคาร', icon: '𝗕', link: '/settings/banks' },
      ],
    },
    {
      kind: 'group', key: 'quotation', label: 'ใบเสนอราคา', icon: '◈',
      children: [
        { label: 'รายการใบเสนอราคา', icon: '☰', link: '/quotations', exact: true },
        { label: 'สร้างใบเสนอราคา', icon: '✎', link: '/quotations/new', exact: true },
        { label: 'ผู้เสนอราคา', icon: '☻', link: '/settings/quoters' },
        { label: 'ลูกค้า', icon: '☺', link: '/settings/customers' },
      ],
    },
    { kind: 'link', label: 'บัญชีผู้ใช้', icon: '⚙', link: '/settings/account' },
  ];

  /**
   * กลุ่มที่กางอยู่ — เข้าแอปมาทุกครั้งเริ่มแบบพับหมด (ไม่จำข้ามการโหลดหน้า)
   * ระหว่างใช้งานยังคงสถานะไว้ เพราะ Shell อยู่ตลอดตอนเปลี่ยนหน้า
   */
  protected readonly openGroups = signal<Set<string>>(new Set());

  /** path ปัจจุบัน (ไม่รวม ?query) — ใช้ไฮไลต์หัวกลุ่มเมื่ออยู่ในหน้าใดหน้าหนึ่งของกลุ่ม */
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects.split('?')[0])
    ),
    { initialValue: this.router.url.split('?')[0] }
  );

  /**
   * กลุ่มที่ผู้ใช้อยู่ — หน้า ผู้ออก / ผู้รับ / บัญชีธนาคาร อยู่ทั้งในกลุ่มใบแจ้งหนี้และใบเสร็จรับเงิน
   * จึงยึดกลุ่มเดิมไว้ถ้ากลุ่มนั้นมีหน้าปัจจุบันด้วย (กดเข้ามาจากเมนูใบเสร็จ ก็ไฮไลต์ที่ใบเสร็จ)
   * ไม่งั้นค่อยเลือกกลุ่มแรกที่มีหน้านี้ · กดเมนูย่อยจะ set() กลุ่มนั้นก่อนเปลี่ยนหน้า (pickChild)
   */
  protected readonly activeGroup = linkedSignal<string, string | null>({
    source: this.path,
    computation: (p, previous) => {
      const keys = this.nav
        .filter((e) => e.kind === 'group' && e.children.some((c) => this.matches(p, c)))
        .map((e) => (e as NavGroup).key);
      return previous && keys.includes(previous.value ?? '') ? previous.value : (keys[0] ?? null);
    },
  });

  /** เมนูย่อยที่ตรงกับหน้าปัจจุบัน — ไฮไลต์เฉพาะในกลุ่มที่ active เพราะลิงก์เดียวกันอาจอยู่หลายกลุ่ม */
  protected isChildActive(groupKey: string, child: NavItem): boolean {
    return this.activeGroup() === groupKey && this.matches(this.path(), child);
  }

  protected pickChild(groupKey: string): void {
    this.activeGroup.set(groupKey);
    this.mobileOpen.set(false);
  }

  /** เทียบแบบเดียวกับ routerLinkActive: exact = ต้องตรงทั้ง path, ไม่ exact = หน้าย่อยข้างใต้ก็นับ */
  private matches(path: string, item: NavItem): boolean {
    return path === item.link || (!item.exact && path.startsWith(item.link + '/'));
  }

  protected readonly themes: { mode: ThemeMode; icon: string; title: string }[] = [
    { mode: 'light', icon: '☀', title: 'สว่าง' },
    { mode: 'soft', icon: '❀', title: 'นุ่มนวล' },
    { mode: 'dark', icon: '☾', title: 'มืด' },
  ];

  protected readonly initials = computed(() =>
    (this.username() ?? '?').slice(0, 1).toUpperCase()
  );

  protected isOpen(key: string): boolean {
    return this.openGroups().has(key);
  }

  /** ตอนแถบเมนูย่ออยู่ (เหลือแต่ไอคอน) กดหัวกลุ่ม = ขยายแถบแล้วกางกลุ่มนั้น */
  protected toggleGroup(key: string): void {
    const next = new Set(this.openGroups());
    if (this.collapsed()) {
      this.collapsed.set(false);
      next.add(key);
    } else if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.openGroups.set(next);
  }

  protected toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
