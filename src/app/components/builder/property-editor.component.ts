import { Component, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderStateService } from '../../services/builder-state.service';
import { DocField, FieldType } from '../../models/doctype.model';

const FIELD_TYPES: FieldType[] = ['Data', 'Int', 'Float', 'Text', 'Select', 'Link', 'Check', 'Date', 'Password'];

@Component({
    selector: 'app-property-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-zinc-100">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Properties</p>
      </div>

      @if (field()) {
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <!-- Field Type Badge -->
          <div class="flex items-center gap-2">
            <span class="ui-badge-indigo">{{ field()!.fieldtype }}</span>
            <span class="text-xs text-zinc-400 font-mono">{{ field()!.id }}</span>
          </div>

          <!-- Label -->
          <div>
            <label class="ui-label">Label</label>
            <input class="ui-input" [ngModel]="field()!.label" (ngModelChange)="update('label', $event)">
          </div>

          <!-- Fieldname -->
          <div>
            <label class="ui-label">Fieldname <span class="text-zinc-400 font-normal">(auto-id for scripts)</span></label>
            <input class="ui-input font-mono" [ngModel]="field()!.fieldname" (ngModelChange)="update('fieldname', $event)">
          </div>

          <!-- Field Type -->
          <div>
            <label class="ui-label">Field Type</label>
            <select class="ui-select" [ngModel]="field()!.fieldtype" (ngModelChange)="update('fieldtype', $event)">
              @for (t of fieldTypes; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </div>

          <!-- Options (for Select / Link) -->
          @if (field()!.fieldtype === 'Select' || field()!.fieldtype === 'Link') {
            <div>
              <label class="ui-label">
                {{ field()!.fieldtype === 'Select' ? 'Options (one per line)' : 'Linked DocType' }}
              </label>
              @if (field()!.fieldtype === 'Select') {
                <textarea class="ui-textarea font-mono" rows="4"
                  [ngModel]="field()!.options" (ngModelChange)="update('options', $event)"
                  placeholder="Option 1&#10;Option 2&#10;Option 3">
                </textarea>
              } @else {
                <input class="ui-input" [ngModel]="field()!.options" (ngModelChange)="update('options', $event)"
                  placeholder="e.g. Customer">
              }
            </div>
          }

          <!-- Placeholder -->
          <div>
            <label class="ui-label">Placeholder</label>
            <input class="ui-input" [ngModel]="field()!.placeholder" (ngModelChange)="update('placeholder', $event)">
          </div>

          <!-- Default -->
          <div>
            <label class="ui-label">Default Value</label>
            <input class="ui-input" [ngModel]="field()!.default" (ngModelChange)="update('default', $event)">
          </div>

          <!-- Description -->
          <div>
            <label class="ui-label">Description</label>
            <input class="ui-input" [ngModel]="field()!.description" (ngModelChange)="update('description', $event)">
          </div>

          <div class="ui-sep"></div>

          <!-- Toggles -->
          <div class="space-y-3">
            @for (toggle of toggles; track toggle.prop) {
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-zinc-700">{{ toggle.label }}</label>
                <button
                  role="switch"
                  class="ui-switch"
                  [attr.aria-checked]="field()![toggle.prop] ? 'true' : 'false'"
                  (click)="toggle_val(toggle.prop)"
                >
                  <span class="ui-switch-thumb"
                    [class.translate-x-4]="field()![toggle.prop]"
                    [class.translate-x-0]="!field()![toggle.prop]">
                  </span>
                </button>
              </div>
            }
          </div>

          <div class="ui-sep"></div>

          <!-- depends_on -->
          <div>
            <label class="ui-label">Depends On <span class="text-zinc-400">(Frappe expression)</span></label>
            <input class="ui-input font-mono text-xs"
              [ngModel]="field()!.depends_on"
              (ngModelChange)="update('depends_on', $event)"
              placeholder="eval:doc.amount > 10000">
            <p class="text-[11px] text-zinc-400 mt-1">Field is visible when this expression is truthy</p>
          </div>

          <!-- Delete field -->
          <button (click)="deleteField()" class="ui-btn-destructive w-full justify-center mt-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            </svg>
            Remove Field
          </button>
        </div>
      } @else {
        <!-- Empty state -->
        <div class="flex-1 flex flex-col items-center justify-center text-center p-6">
          <div class="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-zinc-400">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-zinc-500">No field selected</p>
          <p class="text-xs text-zinc-400 mt-1">Click a field on the canvas to edit its properties</p>
        </div>
      }
    </div>
  `
})
export class PropertyEditorComponent {
    private state = inject(BuilderStateService);
    field = this.state.selectedField;
    fieldTypes = FIELD_TYPES;

    toggles: Array<{ label: string; prop: keyof DocField }> = [
        { label: 'Mandatory / Required', prop: 'mandatory' },
        { label: 'Hidden', prop: 'hidden' },
        { label: 'Read Only', prop: 'read_only' },
    ];

    update(prop: keyof DocField, value: any) {
        const f = this.field();
        if (f) this.state.updateField(f.id, { [prop]: value });
    }

    toggle_val(prop: keyof DocField) {
        const f = this.field();
        if (f) this.state.updateField(f.id, { [prop]: !f[prop] });
    }

    deleteField() {
        const f = this.field();
        if (f) this.state.removeField(f.id);
    }
}
