import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { PALETTE_ITEMS, FieldType } from '../../models/document.model';

@Component({
  selector: 'vf-palette',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <!-- ... -->
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
