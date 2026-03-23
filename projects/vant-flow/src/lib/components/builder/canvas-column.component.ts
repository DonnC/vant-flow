import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDropList, CdkDrag, CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { DocumentField, FieldType, DocumentColumn, DocumentSection } from '../../models/document.model';
import { VfBuilderState } from '../../services/builder-state.service';
import { VfIconButton } from '../shared/icon-button.component';

@Component({
  selector: 'vf-canvas-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, VfIconButton],
  template: `
    <div
      cdkDropList
      [id]="dropListId"
      [cdkDropListData]="{ sectionId: section.id, colId: column.id }"
      [cdkDropListConnectedTo]="connectedLists"
      (cdkDropListDropped)="onDrop($event)"
      class="min-h-[140px] p-4 flex flex-col gap-3 transition-colors duration-200"
      [ngClass]="{ 'bg-zinc-50/30': !column.fields.length }"
    >
      @if (column.fields.length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl py-8 px-4 text-center group-hover:border-indigo-200 transition-colors">
          <div class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mb-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-300"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <p class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Drop fields here</p>
        </div>
      }

      @for (field of column.fields; track field.id) {
        <div
          cdkDrag
          [cdkDragData]="field"
          (click)="selectField($event, field)"
          class="group relative bg-white border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-default active:ring-2 active:ring-indigo-500/10"
          [ngClass]="isSelected(field) ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-zinc-200'"
        >
          <!-- Drag Handle -->
          <div cdkDragHandle class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-zinc-100 transition-all text-zinc-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
          </div>

          <!-- Field Metadata -->
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              [ngClass]="isSelected(field) ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-100 text-zinc-500'">
              {{ field.fieldtype }}
            </span>
            <span class="text-[9px] font-mono text-zinc-300 truncate max-w-[100px]">{{ field.id }}</span>
          </div>

          <!-- Field Main View -->
          <div class="space-y-1.5">
            <div class="flex items-start justify-between">
              <label class="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                {{ field.label || 'Untitled Field' }}
                @if (field.mandatory) { <span class="text-red-500">*</span> }
              </label>
            </div>

            <!-- Field Mock -->
             @if (field.fieldtype === 'Button') {
               <div class="py-1">
                 <button [class]="'w-full py-1.5 rounded-lg text-[11px] font-bold ' + getButtonClass(field.options)">
                   {{ field.label }}
                 </button>
               </div>
             } @else if (field.fieldtype === 'Check') {
               <div class="flex items-center gap-2 py-1">
                 <div class="w-4 h-4 border-2 border-zinc-200 rounded"></div>
                 <span class="text-[11px] text-zinc-400">Toggle</span>
               </div>
             } @else {
               <div class="h-9 w-full bg-zinc-50 border border-zinc-100 rounded-lg flex items-center px-3">
                 <span class="text-[11px] text-zinc-400 italic">
                   {{ field.placeholder || 'No placeholder...' }}
                 </span>
               </div>
             }

             @if (field.description) {
               <p class="text-[10px] text-zinc-400 leading-tight italic">{{ field.description }}</p>
             }
          </div>

          <!-- Quick Actions -->
          <div class="mt-3 pt-2 border-t border-zinc-50 flex items-center justify-between">
            <div class="flex gap-1.5">
               @if (field.hidden) {
                 <div class="w-2 h-2 rounded-full bg-zinc-300" title="Hidden"></div>
               }
               @if (field.read_only) {
                 <div class="w-2 h-2 rounded-full bg-amber-400" title="Read Only"></div>
               }
               @if (field.depends_on) {
                 <div class="w-2 h-2 rounded-full bg-indigo-400" title="Has Logic"></div>
               }
            </div>
            
            <vf-icon-button
              (pressed)="removeField($event, field.id)"
              tone="danger"
              [soft]="true"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </vf-icon-button>
          </div>

          <!-- Drag Placeholder -->
          <div *cdkDragPlaceholder class="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl h-24"></div>
        </div>
      }
    </div>
  `,
})
export class VfCanvasColumn {
  @Input() section!: DocumentSection;
  @Input() column!: DocumentColumn;
  @Input() dropListId!: string;
  @Input() connectedLists: string[] = [];
  @Input() isLast = false;

  private state = inject(VfBuilderState);

  isSelected(field: DocumentField) {
    return this.state.selectedFieldId() === field.id;
  }

  selectField(e: MouseEvent, field: DocumentField) {
    e.stopPropagation();
    this.state.selectField(field.id);
  }

  removeField(e: Event, id: string) {
    e.stopPropagation();
    this.state.removeField(id);
  }

  getButtonClass(style?: string): string {
    const map: Record<string, string> = {
      primary: 'bg-indigo-600 text-white',
      secondary: 'bg-zinc-100 text-zinc-700 border border-zinc-300',
      danger: 'bg-red-500 text-white',
      ghost: 'bg-transparent text-indigo-600 border border-indigo-300',
    };
    return map[style ?? 'primary'] ?? map['primary'];
  }


  onDrop(event: CdkDragDrop<any>) {
    const { container, previousContainer, currentIndex, previousIndex, item } = event;

    // Target column data
    const to = container.data as { sectionId: string; colId: string };

    // 1. Dropped from the palette (id: 'palette-list')
    if (previousContainer.id === 'palette-list') {
      // The palette data is a PaletteItem object
      const fieldType = (item.data.fieldtype || item.data) as FieldType;
      this.state.addField(to.sectionId, to.colId, fieldType, currentIndex);
      return;
    }

    // 2. Moved within same column or between columns
    // We expect { sectionId, colId } in previousContainer.data
    const from = previousContainer.data as { sectionId: string; colId: string };
    if (!from) return; // Safety check

    this.state.moveField(
      from.sectionId, from.colId, previousIndex,
      to.sectionId, to.colId, currentIndex
    );
  }
}
