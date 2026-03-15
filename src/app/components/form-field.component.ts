import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { DocumentField } from '../models/document.model';
import { FormContext } from '../services/form-context';

import QuillTableBetter from 'quill-table-better';
import Quill from "quill";
Quill.register({ 'modules/table-better': QuillTableBetter }, true);

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  template: `
    <div class="field-group transition-all duration-200" [class.ui-field-error]="!validate() && (value || submitted)" [class.compact]="compact">
      @if (shouldShowLabel) {
        <label class="flex items-center justify-between mb-1.5 px-0.5">
          <span class="text-[12.5px] text-zinc-600 tracking-tight flex items-center gap-1 font-medium">
            {{ label }}
            @if (isMandatory) {
              <span class="text-red-500 font-bold">*</span>
            }
          </span>
        </label>
      }

      <div class="relative group/input">
        @switch (field.fieldtype) {
          @case ('Check') {
            <div class="flex items-center gap-3 py-2 px-1">
              <input type="checkbox"
                class="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                (click)="onInputClick($event)"
                [ngModel]="value === 1"
                (ngModelChange)="onValueChange($event ? 1 : 0)"
                [disabled]="disabled">
              <span class="text-[13px] text-zinc-600 font-medium select-none">{{ label }}</span>
            </div>
          }
          @case ('Text') {
            @if (compact) {
              <div class="ui-input cursor-pointer truncate" (click)="onValueChange(value)">
                {{ value || placeholder }}
              </div>
            } @else {
              <textarea
                class="ui-textarea"
                rows="3"
                [ngModel]="value"
                (ngModelChange)="onValueChange($event)"
                [placeholder]="placeholder"
                [disabled]="disabled"></textarea>
            }
          }
          @case ('Select') {
            <select
              class="ui-select"
              (click)="onInputClick($event)"
              [ngModel]="value"
              (ngModelChange)="onValueChange($event)"
              [disabled]="disabled">
              <option value="">{{ field.placeholder || 'Select an option...' }}</option>
              @for (opt of options; track opt) {
                <option [value]="opt">{{ opt }}</option>
              }
            </select>
          }
          @case ('Button') {
            <div class="py-1">
              <button
                type="button"
                (click)="onValueChange(value)"
                [disabled]="disabled"
                class="px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                [ngClass]="getButtonClass(field.options)">
                {{ label }}
              </button>
            </div>
          }
          @case ('Text Editor') {
            <div class="rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-50/50 transition-all border border-zinc-200">
              <quill-editor
                class="ql-frappe-style"
                [ngModel]="value"
                (onContentChanged)="onValueChange($event.html)"
                [readOnly]="disabled"
                [placeholder]="field.placeholder || 'Type here...'"
                theme="snow"
              ></quill-editor>
            </div>
          }
          @case ('Date') {
            <input type="date"
              class="ui-input"
              (click)="onInputClick($event)"
              [ngModel]="value"
              (ngModelChange)="onValueChange($event)"
              [disabled]="disabled">
          }
          @case ('Password') {
            <input type="password"
              class="ui-input"
              [ngModel]="value"
              (ngModelChange)="onValueChange($event)"
              [placeholder]="placeholder"
              [disabled]="disabled">
          }
          @default {
            <input
              [type]="field.fieldtype === 'Int' || field.fieldtype === 'Float' ? 'number' : 'text'"
              class="ui-input"
              (click)="onInputClick($event)"
              [ngModel]="value"
              (ngModelChange)="onValueChange($event)"
              [placeholder]="placeholder"
              [disabled]="disabled">
          }
        }

        @if (field.description) {
          <div class="mt-1.5 px-0.5">
            <span class="text-[10.5px] text-zinc-400 font-normal leading-relaxed italic block tracking-tight">{{ field.description }}</span>
          </div>
        }

        @if (disabled && !isEditor) {
          <div class="absolute inset-0 bg-transparent cursor-not-allowed"></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ui-input, .ui-textarea, .ui-select {
      @apply w-full transition-all duration-300;
      border-radius: 0.75rem;
      padding: 0.6rem 0.8rem;
      border-width: 1px;
      font-size: 13.5px;
    }

    /* Normal mode */
    :not(.compact) .ui-input, :not(.compact) .ui-textarea, :not(.compact) .ui-select {
      @apply bg-zinc-50/50 border-zinc-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300;
    }

    /* Compact mode (for tables) */
    .field-group.compact .ui-input, .field-group.compact .ui-textarea, .field-group.compact .ui-select {
      @apply bg-transparent border-0 focus:ring-0 focus:bg-white rounded hover:bg-zinc-100/50 p-1.5 text-xs;
    }

    .ui-field-error .ui-input, .ui-field-error .ui-textarea, .ui-field-error .ui-select {
      @apply border-red-500 bg-red-50/30 focus:ring-red-500/10 !important;
    }

    /* Text Editor Specific */
    ::ng-deep .ql-frappe-style .ql-toolbar {
      @apply bg-zinc-50 border-0 border-b border-zinc-200 py-2 px-3 !important;
    }
    ::ng-deep .ql-frappe-style.ql-snow {
      @apply border-0 !important;
    }
    ::ng-deep .ql-frappe-style .ql-container {
      @apply border-0 text-zinc-700 font-sans !important;
      font-size: 13.5px;
      min-height: 150px !important;
    }
    ::ng-deep .ql-frappe-style .ql-editor {
      @apply px-4 py-3 leading-relaxed;
    }
  `]
})
export class FormFieldComponent {
  @Input() field!: DocumentField;
  @Input() value: any;
  @Input() readOnly: boolean = false;
  @Input() hideLabel: boolean = false;
  @Input() compact: boolean = false;
  @Output() valueChange = new EventEmitter<any>();

  public submitted: boolean = false;

  ctx = inject(FormContext, { optional: true });

  get shouldShowLabel() {
    return !this.hideLabel && !this.compact && this.field.fieldtype !== 'Button' && this.field.fieldtype !== 'Check';
  }

  get label() {
    return this.ctx?.getFieldSignal(this.field.fieldname, 'label')() || this.field.label;
  }

  get placeholder() {
    return this.field.placeholder || (this.compact ? this.field.label : '');
  }

  get isMandatory() {
    return this.ctx?.getFieldSignal(this.field.fieldname, 'mandatory')() || this.field.mandatory;
  }

  get disabled() {
    return this.readOnly || (this.ctx?.isReadOnly() || this.ctx?.getFieldSignal(this.field.fieldname, 'read_only')() || false);
  }

  get isEditor() {
    return this.field.fieldtype === 'Text Editor';
  }

  get options() {
    if (!this.field.options) return [];
    return this.field.options.split('\n').map(o => o.trim()).filter(Boolean);
  }

  onValueChange(val: any) {
    this.valueChange.emit(val);
  }

  onInputClick(event: Event) {
    // Only stop propagation for interactive elements to avoid triggering table row edit modal
    if (this.compact && this.field.fieldtype !== 'Text') {
      event.stopPropagation();
    }
  }

  validate(): boolean {
    // Check mandatory
    if (this.isMandatory && (this.value === undefined || this.value === null || String(this.value).trim() === '')) {
      return false;
    }
    // Check regex
    if (this.isInvalidByRegex()) {
      return false;
    }
    return true;
  }

  isInvalidByRegex() {
    if (!this.field.regex || !this.value) return false;
    try {
      return !new RegExp(this.field.regex).test(String(this.value));
    } catch {
      return false;
    }
  }

  getButtonClass(options?: string) {
    const isPrimary = options === 'Primary';
    return isPrimary
      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300';
  }
}
