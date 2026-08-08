import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
    <div class="flex flex-col items-center justify-center gap-3" [style.padding.px]="pad()">
      <span class="spinner" [class.spinner--sm]="small()"></span>
      @if (label()) { <span class="text-sm text-ink-soft animate-pulse">{{ label() }}</span> }
    </div>
  `,
})
export class Spinner {
  readonly label = input<string>('');
  readonly small = input(false);
  readonly pad = input(48);
}
