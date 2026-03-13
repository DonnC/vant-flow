import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { PALETTE_ITEMS, FieldType } from '../../models/doctype.model';

@Component({
    selector: 'app-field-palette',
    standalone: true,
    imports: [CommonModule, CdkDrag],
    template: `
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="px-3 py-2 border-b border-zinc-100">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Fields</p>
      </div>

      <!-- Field type list -->
      <div class="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        @for (item of paletteItems; track item.label) {
          <div
            cdkDrag
            [cdkDragData]="item.fieldtype"
            class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-zinc-600
                   hover:bg-indigo-50 hover:text-indigo-700 cursor-grab active:cursor-grabbing
                   group transition-colors select-none"
          >
            <span class="w-6 h-6 flex items-center justify-center rounded text-xs font-bold
                         bg-zinc-100 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors shrink-0">
              {{ item.icon }}
            </span>
            <span class="text-sm font-medium">{{ item.label }}</span>
          </div>
        }
      </div>

      <!-- Section break -->
      <div class="px-3 py-2 border-t border-zinc-100">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1.5">Layout</p>
        <button
          (click)="addSection()"
          class="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-zinc-600
                 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer text-sm font-medium transition-colors"
        >
          <span class="w-6 h-6 flex items-center justify-center rounded bg-zinc-100 text-xs font-bold shrink-0">+S</span>
          Add Section
        </button>
      </div>
    </div>
  `
})
export class FieldPaletteComponent {
    paletteItems = PALETTE_ITEMS;

    addSection() {
        // Will be handled by BuilderStateService directly via parent
        document.dispatchEvent(new CustomEvent('add-section'));
    }
}
