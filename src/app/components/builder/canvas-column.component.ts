import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDropList, CdkDrag, CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { DocField, FieldType, LayoutColumn, LayoutSection } from '../../models/doctype.model';
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
            (click)="selectField(field)"
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
            <!-- Field preview -->
            <div class="pl-4">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-xs font-medium text-zinc-800">{{ field.label }}</span>
                @if (field.mandatory) {
                  <span class="text-red-500 text-xs">*</span>
                }
                @if (field.hidden) {
                  <span class="ui-badge-zinc text-[10px]">hidden</span>
                }
                @if (field.read_only) {
                  <span class="ui-badge-zinc text-[10px]">read only</span>
                }
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-zinc-400 font-mono">{{ field.fieldname }}</span>
                <span class="ui-badge bg-zinc-50 text-zinc-500 text-[10px] border border-zinc-100">{{ field.fieldtype }}</span>
              </div>
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
    @Input() section!: LayoutSection;
    @Input() column!: LayoutColumn;
    @Input() dropListId!: string;
    @Input() connectedLists: string[] = [];
    @Input() isLast = false;

    private state = inject(BuilderStateService);

    isSelected(field: DocField) {
        return this.state.selectedFieldId() === field.id;
    }

    selectField(field: DocField) {
        this.state.selectField(field.id);
    }

    removeField(e: MouseEvent, id: string) {
        e.stopPropagation();
        this.state.removeField(id);
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
