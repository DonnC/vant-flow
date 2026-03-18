import { Component, Input, Output, EventEmitter, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentField, VfMediaHandler } from '../models/document.model';
import { VfField } from './form-field.component';

@Component({
  selector: 'vf-prompt-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, VfField],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] fade-in" (click)="onCancel()">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden zoom-in duration-200" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h3 class="text-base font-semibold text-zinc-900">{{ title }}</h3>
          <button (click)="onCancel()" class="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
        </div>
        <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          @for (field of fields; track field.fieldname) {
            <vf-field 
              [field]="field" 
              [value]="values[field.fieldname]" 
              [readOnly]="field.read_only || readOnly"
              [mediaHandler]="mediaHandler"
              [formMetadata]="formMetadata"
              (valueChange)="updateValue(field.fieldname, $event)">
            </vf-field>
          }
        </div>
        <div class="flex justify-end gap-2 px-6 py-4 bg-zinc-50 border-t border-zinc-100">
          @if (readOnly) {
            <button (click)="onCancel()" class="ui-btn-primary w-full sm:w-auto">Close</button>
          } @else {
            <button (click)="onCancel()" class="ui-btn-secondary">Cancel</button>
            <button (click)="submit()" class="ui-btn-primary">Submit</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ui-btn-primary { @apply px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95; }
    .ui-btn-secondary { @apply px-5 py-2.5 bg-white border border-zinc-200 text-zinc-600 text-sm font-bold rounded-xl hover:bg-zinc-50 transition-all active:scale-95; }
    
    .fade-in { animation: fadeIn 0.2s ease-out; }
    .zoom-in { animation: zoomIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class VfPromptModal {
  @Input() fields: DocumentField[] = [];
  @Input() title: string = 'Enter Data';
  @Input() values: Record<string, any> = {};
  @Input() readOnly: boolean = false;
  @Input() mediaHandler?: VfMediaHandler;
  @Input() formMetadata?: any;
  @Output() result = new EventEmitter<Record<string, any> | null>();

  @ViewChildren(VfField) fieldComponents!: QueryList<VfField>;

  updateValue(fieldname: string, val: any) {
    this.values[fieldname] = val;
  }

  onCancel() {
    this.result.emit(null);
  }

  submit() {
    let allValid = true;
    this.fieldComponents.forEach(cmp => {
      cmp.submitted = true; // Trigger visual error state if invalid
      if (!cmp.validate()) {
        allValid = false;
      }
    });

    if (allValid) {
      this.result.emit(this.values);
    } else {
      // Visual feedback is already provided by each FormFieldComponent (red borders)
      console.warn('Prompt validation failed');
    }
  }
}
