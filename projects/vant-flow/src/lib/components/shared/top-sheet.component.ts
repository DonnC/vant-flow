import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VfIconButton } from './icon-button.component';

@Component({
  selector: 'vf-top-sheet',
  standalone: true,
  imports: [CommonModule, VfIconButton],
  template: `
    <div class="absolute inset-x-0 top-12 z-50 bg-white border-b border-zinc-200 shadow-xl animate-in slide-in-from-top-4 duration-300">
      <div class="max-w-4xl mx-auto p-6 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-zinc-800">{{ title }}</h3>
          <vf-icon-button title="Close" size="md" tone="neutral" (pressed)="closed.emit()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </vf-icon-button>
        </div>
        @if (description) {
          <p class="text-xs text-zinc-500">{{ description }}</p>
        }
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class VfTopSheet {
  @Input() title = '';
  @Input() description = '';
  @Output() closed = new EventEmitter<void>();
}
