import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  protected readonly nav: NavItem[] = [
    { label: 'แดชบอร์ด', icon: '▚', link: '/dashboard', exact: true },
    { label: 'สร้างใบแจ้งหนี้', icon: '✎', link: '/invoices/new' },
    { label: 'บัญชีธนาคาร', icon: '𝗕', link: '/settings/banks' },
    { label: 'ผู้รับ', icon: '☺', link: '/settings/recipients' },
  ];

  protected readonly themes: { mode: ThemeMode; icon: string; title: string }[] = [
    { mode: 'light', icon: '☀', title: 'สว่าง' },
    { mode: 'soft', icon: '❀', title: 'นุ่มนวล' },
    { mode: 'dark', icon: '☾', title: 'มืด' },
  ];

  protected readonly initials = computed(() =>
    (this.username() ?? '?').slice(0, 1).toUpperCase()
  );

  protected toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
