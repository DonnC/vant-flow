import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VfUiPrimitivesModule } from '../../../ui/ui-primitives.module';

@Component({
  selector: 'vf-toggle-card',
  standalone: true,
  imports: [CommonModule, VfUiPrimitivesModule],
  template: `
    <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none"
      [ngClass]="checked ? activeClass : inactiveClass">
      <div class="flex-1">
        <p class="text-[11px] font-bold text-zinc-700 uppercase tracking-tight">{{ title }}</p>
        @if (description) {
          <p class="text-[10px] text-zinc-400">{{ description }}</p>
        }
      </div>
      <button
        type="button"
        role="switch"
        class="ui-switch"
        [attr.aria-checked]="checked ? 'true' : 'false'"
        (click)="toggle($event)">
        <span class="ui-switch-thumb"
          [class.translate-x-4]="checked"
          [class.translate-x-0]="!checked">
        </span>
      </button>
    </label>
  `,
})
export class VfToggleCard {
  @Input() title = '';
  @Input() description = '';
  @Input() checked = false;
  @Input() activeClass = 'border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50';
  @Input() inactiveClass = 'border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50';
  @Output() checkedChange = new EventEmitter<boolean>();

  toggle(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.checkedChange.emit(!this.checked);
  }
}

