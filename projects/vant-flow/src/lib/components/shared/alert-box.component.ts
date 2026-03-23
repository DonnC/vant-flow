import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vf-alert-box',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl border px-5 py-4 shadow-sm" [ngClass]="toneClasses.wrapper">
      <div class="flex items-start gap-3">
        <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" [ngClass]="toneClasses.iconWrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [ngClass]="toneClasses.icon">
            <ng-container [ngSwitch]="tone">
              <path *ngSwitchCase="'success'" d="M20 6 9 17l-5-5"></path>
              <g *ngSwitchCase="'warning'">
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              </g>
              <g *ngSwitchDefault>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </g>
            </ng-container>
          </svg>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-3">
            <div>
              @if (title) {
                <p class="text-sm font-bold">{{ title }}</p>
              }
              @if (message) {
                <p class="mt-1 text-xs" [ngClass]="toneClasses.message">{{ message }}</p>
              }
            </div>
            @if (dismissLabel) {
              <button
                type="button"
                (click)="dismiss.emit()"
                class="rounded-lg border bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors"
                [ngClass]="toneClasses.dismiss">
                {{ dismissLabel }}
              </button>
            }
          </div>

          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class VfAlertBox {
  @Input() tone: 'error' | 'warning' | 'success' = 'error';
  @Input() title = '';
  @Input() message = '';
  @Input() dismissLabel = '';
  @Output() dismiss = new EventEmitter<void>();

  get toneClasses() {
    const map = {
      error: {
        wrapper: 'border-red-200 bg-red-50 text-red-900',
        iconWrap: 'bg-red-100',
        icon: 'text-red-600',
        message: 'text-red-700',
        dismiss: 'border-red-200 text-red-700 hover:bg-red-100',
      },
      warning: {
        wrapper: 'border-amber-200 bg-amber-50 text-amber-900',
        iconWrap: 'bg-amber-100',
        icon: 'text-amber-600',
        message: 'text-amber-700',
        dismiss: 'border-amber-200 text-amber-700 hover:bg-amber-100',
      },
      success: {
        wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        iconWrap: 'bg-emerald-100',
        icon: 'text-emerald-600',
        message: 'text-emerald-700',
        dismiss: 'border-emerald-200 text-emerald-700 hover:bg-emerald-100',
      },
    } as const;

    return map[this.tone];
  }
}

