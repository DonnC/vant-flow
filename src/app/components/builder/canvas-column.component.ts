import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDropList, CdkDrag, CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { DocumentField, FieldType, DocumentColumn, DocumentSection } from '../../models/document.model';
import { BuilderStateService } from '../../services/builder-state.service';

@Component({
  selector: 'app-canvas-column',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="flex-1 min-w-0 min-h-[120px] relative"
         [class.border-r]="!isLast"
         [class.border-zinc-100]="!isLast">
      <!-- Column drop zone -->
      <div
        cdkDropList
        [id]="dropListId"
        [cdkDropListData]="{ sectionId: section.id, colId: column.id }"
        [cdkDropListConnectedTo]="connectedLists"
        (cdkDropListDropped)="onDrop($event)"
        class="min-h-[100px] p-2 space-y-1.5"
      >
        @for (field of column.fields; track field.id) {
          <div
            cdkDrag
            [cdkDragData]="field"
            (click)="selectField($event, field)"
            class="canvas-field group relative bg-white border rounded-md px-3 py-2 cursor-pointer
                   hover:border-indigo-300 hover:shadow-sm transition-all"
            [class.border-indigo-400]="isSelected(field)"
            [class.ring-1]="isSelected(field)"
            [class.ring-indigo-400]="isSelected(field)"
            [class.border-zinc-200]="!isSelected(field)"
          >
            <!-- Drag handle -->
            <div cdkDragHandle class="absolute left-1.5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 cursor-grab
                                      opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                <circle cx="4" cy="4" r="1.5"/><circle cx="8" cy="4" r="1.5"/>
                <circle cx="4" cy="10" r="1.5"/><circle cx="8" cy="10" r="1.5"/>
                <circle cx="4" cy="16" r="1.5"/><circle cx="8" cy="16" r="1.5"/>
              </svg>
            </div>

            <!-- Field preview content -->
            <div class="pl-4">

              <!-- ── BUTTON preview ── -->
              @if (field.fieldtype === 'Button') {
                <div class="mt-1.5 flex items-center justify-between">
                  <span class="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold select-none shadow-sm border border-zinc-200"
                    [ngClass]="getButtonClass(field.options)">
                    {{ field.label }}
                  </span>
                  <div class="flex items-center gap-1.5 opacity-50">
                    <span class="text-[9px] font-mono text-zinc-400">{{ field.fieldname }}</span>
                    @if (field.hidden) { <span class="ui-badge-zinc text-[10px]">hidden</span> }
                  </div>
                </div>
              } @else if (field.fieldtype === 'Text Editor') {
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 uppercase">Editor</span>
                  <span class="text-xs font-semibold text-zinc-700">{{ field.label }}</span>
                </div>
                <div class="text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-100 rounded p-1.5 truncate max-w-[220px]">
                  <span class="opacity-75 italic">Rich text content...</span>
                </div>
              } @else if (field.fieldtype === 'Table') {
                <div class="flex items-center gap-2 mb-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-sky-500">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="3" y1="15" x2="21" y2="15"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                  </svg>
                  <span class="text-xs text-zinc-600 tracking-tight">{{ field.label }}</span>
                  @if (field.mandatory) { <span class="text-red-500 text-xs">*</span> }
                  @if (field.hidden) { <span class="ui-badge-zinc text-[10px]">hidden</span> }
                </div>
                <div class="flex flex-wrap gap-1">
                  @if ((field.table_fields?.length ?? 0) === 0) {
                    <span class="text-[10px] text-zinc-400 italic">No columns configured</span>
                  }
                  @for (col of field.table_fields; track col.id) {
                    <span class="px-1.5 py-0.5 rounded bg-sky-50 text-sky-600 text-[10px] border border-sky-100 font-mono">{{ col.label }}</span>
                  }
                </div>
              } @else {
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-xs text-zinc-600 tracking-tight">{{ field.label }}</span>
                  @if (field.mandatory) { <span class="text-red-500 text-xs">*</span> }
                  @if (field.hidden) { <span class="ui-badge-zinc text-[10px]">hidden</span> }
                  @if (field.read_only) { <span class="ui-badge-zinc text-[10px]">read only</span> }
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-zinc-400 font-mono">{{ field.fieldname }}</span>
                  <span class="ui-badge bg-zinc-50 text-zinc-500 text-[10px] border border-zinc-100">{{ field.fieldtype }}</span>
                </div>
              }
            </div>

            <!-- Remove button -->
            <button
              (click)="removeField($event, field.id)"
              class="absolute right-1.5 top-1.5 w-5 h-5 rounded flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400
                     hover:bg-red-50 hover:text-red-500"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <!-- Drag preview ghost -->
            <div *cdkDragPlaceholder class="h-10 rounded border-2 border-dashed border-indigo-300 bg-indigo-50"></div>
          </div>
        }

        <!-- Drop hint when empty -->
        @if (column.fields.length === 0) {
          <div class="h-20 rounded-md border-2 border-dashed border-zinc-200 flex items-center justify-center">
            <span class="text-xs text-zinc-400">Drop fields here</span>
          </div>
        }
      </div>
    </div>
  `
})
export class CanvasColumnComponent {
  @Input() section!: DocumentSection;
  @Input() column!: DocumentColumn;
  @Input() dropListId!: string;
  @Input() connectedLists: string[] = [];
  @Input() isLast = false;

  private state = inject(BuilderStateService);

  isSelected(field: DocumentField) {
    return this.state.selectedFieldId() === field.id;
  }

  selectField(e: MouseEvent, field: DocumentField) {
    e.stopPropagation();
    this.state.selectField(field.id);
  }

  removeField(e: MouseEvent, id: string) {
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
    const to = container.data as { sectionId: string; colId: string };

    // Dropped from the palette (item.data is a FieldType string like 'Data')
    if (typeof item.data === 'string') {
      this.state.addField(to.sectionId, to.colId, item.data as FieldType, currentIndex);
      return;
    }

    // Moved within same column or between columns
    const from = previousContainer.data as { sectionId: string; colId: string };
    if (previousContainer === container) {
      this.state.moveField(from.sectionId, from.colId, previousIndex, to.sectionId, to.colId, currentIndex);
    } else {
      this.state.moveField(from.sectionId, from.colId, previousIndex, to.sectionId, to.colId, currentIndex);
    }
  }
}
