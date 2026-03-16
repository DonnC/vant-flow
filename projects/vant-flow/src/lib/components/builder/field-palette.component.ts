import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PALETTE_ITEMS, FieldType } from '../../models/document.model';

@Component({
  selector: 'vf-palette',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="flex flex-col h-full bg-white">
      <div class="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        <div class="flex items-center gap-2 mb-4 px-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-indigo-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Field Palette</span>
        </div>
        
        <div 
          cdkDropList
          id="palette-list"
          [cdkDropListData]="paletteItems"
          [cdkDropListConnectedTo]="connectedLists"
          [cdkDropListEnterPredicate]="noEnter"
          class="flex flex-col gap-2.5 pb-20"
        >
          @for (item of paletteItems; track item.fieldtype) {
            <div 
              cdkDrag
              [cdkDragData]="item"
              class="group flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl cursor-grab active:cursor-grabbing hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200"
            >
              <div class="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-zinc-500 group-hover:text-indigo-600">
                  <path [attr.d]="item.icon"></path>
                </svg>
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-[11px] font-bold text-zinc-700 tracking-tight">{{ item.fieldtype }}</span>
                <span class="text-[9px] text-zinc-400 truncate">{{ item.desc }}</span>
              </div>

              <div *cdkDragPlaceholder class="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl h-14"></div>
            </div>
          }
        </div>
      </div>

      <div class="p-3 border-t border-zinc-100 bg-zinc-50/50">
        <button (click)="addSection()" class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-300 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-white transition-all shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Section
        </button>
      </div>
    </div>
  `,
})
export class VfPalette {
  @Input() connectedLists: string[] = [];
  paletteItems = PALETTE_ITEMS;

  noEnter() { return false; }

  addSection() {
    // Will be handled by BuilderStateService directly via parent
    document.dispatchEvent(new CustomEvent('add-section'));
  }
}
