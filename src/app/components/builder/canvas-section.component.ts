import { Component, Input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutSection } from '../../models/doctype.model';
import { BuilderStateService } from '../../services/builder-state.service';
import { CanvasColumnComponent } from './canvas-column.component';

@Component({
  selector: 'app-canvas-section',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, CanvasColumnComponent],
  template: `
    <div class="border border-zinc-200 rounded-xl bg-white shadow-sm overflow-hidden mb-4">
      <!-- Section Header -->
      <div class="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
        <div class="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></div>
        @if (editing()) {
          <input
            #labelInput
            class="flex-1 text-sm font-medium bg-transparent border-none outline-none text-zinc-700"
            [(ngModel)]="editValue"
            (blur)="saveLabel()"
            (keydown.enter)="saveLabel()"
          >
        } @else {
          <span
            class="flex-1 text-sm font-semibold text-zinc-700 cursor-text"
            (dblclick)="startEdit()"
          >{{ section.label || 'Untitled Section' }}</span>
        }
        <!-- Column controls -->
        <div class="flex items-center gap-1 ml-2">
          <button
            (click)="addColumn()"
            class="ui-btn-ghost ui-btn-sm px-2 text-xs"
            title="Add Column"
          >+ Col</button>
          <button
            (click)="removeSection()"
            class="w-6 h-6 rounded flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete section"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Columns -->
      <div class="flex divide-x divide-zinc-100">
        @for (col of section.columns; track col.id; let last = $last) {
          <app-canvas-column
            class="flex-1"
            [section]="section"
            [column]="col"
            [dropListId]="col.id"
            [connectedLists]="getConnectedLists()"
            [isLast]="last"
          ></app-canvas-column>
        }
      </div>
    </div>
  `
})
export class CanvasSectionComponent {
  @Input() section!: LayoutSection;
  @Input() allColumnIds!: () => string[];

  private state = inject(BuilderStateService);
  editing = signal(false);
  editValue = '';

  startEdit() {
    this.editValue = this.section.label ?? '';
    this.editing.set(true);
    setTimeout(() => (document.querySelector('input') as HTMLInputElement)?.focus(), 0);
  }

  saveLabel() {
    this.state.updateSectionLabel(this.section.id, this.editValue);
    this.editing.set(false);
  }

  addColumn() { this.state.addColumn(this.section.id); }
  removeSection() { this.state.removeSection(this.section.id); }

  getConnectedLists() {
    return ['palette-list', ...this.allColumnIds()];
  }
}
