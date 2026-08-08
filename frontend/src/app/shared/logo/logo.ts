import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <span class="inline-flex items-center gap-2.5">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 48 48" fill="none"
           xmlns="http://www.w3.org/2000/svg" class="shrink-0 drop-shadow-sm">
        <defs>
          <linearGradient [attr.id]="gid" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stop-color="#22cdb8"/>
            <stop offset="0.55" stop-color="#12a998"/>
            <stop offset="1" stop-color="#0b8f9e"/>
          </linearGradient>
          <linearGradient [attr.id]="gid + 'c'" x1="30" y1="26" x2="42" y2="40" gradientUnits="userSpaceOnUse">
            <stop stop-color="#e9c05f"/>
            <stop offset="1" stop-color="#c98f2c"/>
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="42" height="42" rx="13" [attr.fill]="'url(#' + gid + ')'"/>
        <!-- document -->
        <path d="M16 13.5h11l6 6v11a2.5 2.5 0 0 1-2.5 2.5H16a2.5 2.5 0 0 1-2.5-2.5V16A2.5 2.5 0 0 1 16 13.5Z"
              fill="#fff" fill-opacity="0.95"/>
        <path d="M27 13.5V18a1.5 1.5 0 0 0 1.5 1.5H33" fill="#d8f5f0"/>
        <rect x="17.5" y="22" width="9" height="1.8" rx="0.9" fill="#12a998"/>
        <rect x="17.5" y="26" width="12" height="1.8" rx="0.9" fill="#7fd8cd"/>
        <rect x="17.5" y="30" width="7" height="1.8" rx="0.9" fill="#7fd8cd"/>
        <!-- coin accent (tax/gold) -->
        <circle cx="34" cy="33" r="6.5" [attr.fill]="'url(#' + gid + 'c)'" stroke="#fff" stroke-width="1.6"/>
        <path d="M34 30v6M32 32.2h3.2a1.3 1.3 0 0 1 0 2.6H32.6h2.8" stroke="#fff" stroke-width="1.1" stroke-linecap="round" fill="none"/>
      </svg>
      @if (showWord()) {
        <span class="flex flex-col leading-none">
          <span class="text-[0.95rem] font-bold tracking-tight text-ink">TaxFlow</span>
          <span class="text-[0.62rem] font-medium text-ink-soft">ระบบผู้เสียภาษี</span>
        </span>
      }
    </span>
  `,
})
export class Logo {
  readonly size = input(36);
  readonly showWord = input(true);
  readonly gid = 'lg' + Math.random().toString(36).slice(2, 7);
}
