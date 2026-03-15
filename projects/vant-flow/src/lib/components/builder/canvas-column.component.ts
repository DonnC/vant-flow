import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDropList, CdkDrag, CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { DocumentField, FieldType, DocumentColumn, DocumentSection } from '../../models/document.model';
import { VfBuilderState } from '../../services/builder-state.service';

@Component({
  selector: 'vf-canvas-column',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <!-- ... -->
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
