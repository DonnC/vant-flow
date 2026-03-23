import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VfDashedAction } from './dashed-action.component';

@Component({
  selector: 'vf-empty-state',
  standalone: true,
  imports: [CommonModule, VfDashedAction],
  template: `
    <div class="h-full flex flex-col items-center justify-center text-center">
      <div class="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-zinc-200 flex items-center justify-center mb-4 shadow-sm">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-zinc-300">
          @for (path of iconPaths; track path) {
            <path [attr.d]="path"></path>
          }
        </svg>
      </div>
      <h3 class="text-base font-semibold text-zinc-700 mb-1">{{ title }}</h3>
      <p class="text-sm text-zinc-400 mb-5 max-w-xs">{{ description }}</p>
      @if (actionLabel) {
        <vf-dashed-action
          [label]="actionLabel"
          [fullWidth]="false"
          (pressed)="action.emit()">
        </vf-dashed-action>
      }
    </div>
  `,
})
export class VfEmptyState {
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() iconPath = 'M3 3h18v18H3z';
  @Output() action = new EventEmitter<void>();

  get iconPaths() {
    return this.iconPath.split(' | ').map(part => part.trim()).filter(Boolean);
  }
}
