import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'soft' | 'dark';

const KEY = 'chp_theme';
const ORDER: ThemeMode[] = ['light', 'soft', 'dark'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.initial());

  constructor() {
    effect(() => {
      const m = this.mode();
      document.documentElement.setAttribute('data-theme', m);
      localStorage.setItem(KEY, m);
    });
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  cycle(): void {
    const i = ORDER.indexOf(this.mode());
    this.mode.set(ORDER[(i + 1) % ORDER.length]);
  }

  private initial(): ThemeMode {
    const saved = localStorage.getItem(KEY) as ThemeMode | null;
    if (saved && ORDER.includes(saved)) return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
