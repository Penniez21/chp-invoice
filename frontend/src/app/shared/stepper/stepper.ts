import { Component, input } from '@angular/core';

export interface Step {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-stepper',
  template: `
    <div class="flex items-center justify-center gap-1 sm:gap-2">
      @for (step of steps(); track $index; let i = $index; let last = $last) {
        <div class="flex items-center gap-1 sm:gap-2">
          <div class="flex items-center gap-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300"
                 [class]="i < current()
                   ? 'bg-primary text-white'
                   : i === current()
                     ? 'bg-primary text-white ring-4 ring-[var(--ring)] scale-105'
                     : 'bg-primary-soft text-ink-soft'">
              @if (i < current()) { ✓ } @else { {{ step.icon }} }
            </div>
            <span class="hidden text-sm font-medium sm:inline"
                  [class]="i <= current() ? 'text-ink' : 'text-ink-soft'">{{ step.label }}</span>
          </div>
          @if (!last) {
            <div class="mx-1 h-0.5 w-8 rounded-full transition-colors duration-300 sm:w-14"
                 [class]="i < current() ? 'bg-primary' : 'bg-line'"></div>
          }
        </div>
      }
    </div>
  `,
})
export class Stepper {
  readonly steps = input<Step[]>([]);
  readonly current = input(0);
}
