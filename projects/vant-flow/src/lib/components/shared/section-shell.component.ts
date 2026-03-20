import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vf-section-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div class="px-6 py-5 flex items-center justify-between gap-4 transition-all bg-zinc-50/30 border-b border-transparent"
        [class.border-zinc-100]="!collapsed"
        [class.cursor-pointer]="collapsible"
        (click)="collapsible ? toggled.emit() : null">
        <div class="space-y-1">
          @if (title) {
            <h3 class="text-xs font-bold uppercase tracking-wider transition-colors"
              [class.text-indigo-600]="collapsible && !collapsed"
              [class.text-zinc-900]="!collapsible || collapsed">
              {{ title }}
            </h3>
          }
          @if (description) {
            <p class="text-[11px] text-zinc-400 italic leading-snug">{{ description }}</p>
          }
        </div>

        @if (collapsible) {
          <div class="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 transition-all shadow-xs"
            [class.rotate-180]="collapsed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>
        }
      </div>

      <div class="grid transition-all duration-500 ease-in-out"
        [style.grid-template-rows]="collapsed ? '0fr' : '1fr'"
        [class.opacity-0]="collapsed"
        [class.pointer-events-none]="collapsed">
        <div class="overflow-hidden">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class VfSectionShell {
  @Input() title = '';
  @Input() description = '';
  @Input() collapsible = false;
  @Input() collapsed = false;
  @Output() toggled = new EventEmitter<void>();
}
