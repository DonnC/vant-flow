import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vf-dashed-action',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="pressed.emit()"
      class="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed transition-all shadow-sm"
      [ngClass]="className">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" [attr.stroke-width]="iconStroke">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>{{ label }}</span>
    </button>
  `,
})
export class VfDashedAction {
  @Input() label = 'Add';
  @Input() fullWidth = true;
  @Input() compact = false;
  @Input() subtle = false;
  @Output() pressed = new EventEmitter<void>();

  get iconStroke() {
    return this.compact ? 3 : 2;
  }

  get className() {
    const width = this.fullWidth ? 'w-full' : '';
    const spacing = this.compact ? 'px-3 py-2 text-[10px] font-bold uppercase tracking-widest' : 'px-4 py-2.5 text-sm';
    const colors = this.subtle
      ? 'text-zinc-400 border-zinc-200 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300'
      : 'text-zinc-400 border-zinc-300 hover:text-indigo-600 hover:bg-white hover:border-indigo-300';

    return [width, spacing, colors].join(' ').trim();
  }
}

