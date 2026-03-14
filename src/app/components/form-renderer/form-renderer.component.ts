import { Component, Input, OnInit, OnDestroy, signal, inject, Output, EventEmitter, effect, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { DocumentDefinition, DocumentField, DocumentSection, DocumentColumn } from '../../models/document.model';
import { FormContext } from '../../services/form-context';
import { AppUtilityService } from '../../services/app-utility.service';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule, QuillEditorComponent],
  providers: [FormContext],
  template: `
    <div class="w-full max-w-[1400px] mx-auto py-8 px-4">
      <div class="card bg-white shadow-2xl">
        <!-- Combined Sticky Header (Frappe style) -->
        <div class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-8 py-5 flex items-center justify-between rounded-t-[1.5rem]">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold text-zinc-900 tracking-tight">{{ document.name }}</h2>
              @if (ctx.isReadOnly()) {
                <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 uppercase tracking-tighter">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Read Only
                </span>
              }
              <span class="px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-500 font-mono text-[10px] tracking-widest uppercase">
                {{ document.version || 'v1.0.0' }}
              </span>
            </div>
            @if (document.description || document.module) {
              <div class="flex items-center gap-1.5 opacity-60">
                @if (document.module) {
                  <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 pr-2">{{ document.module }}</span>
                }
                @if (document.description) {
                  <span class="text-[11px] text-zinc-400 leading-tight">{{ document.description }}</span>
                }
              </div>
            }
          </div>
          <div class="flex items-center gap-2">
             <!-- Custom Buttons -->
             @for (btn of ctx.customButtons(); track btn.id) {
               <button (click)="btn.action()" 
                       [class]="'px-4 py-2 text-sm font-bold rounded-lg transition-all ' + getButtonClass(btn.type)">
                 {{ btn.label }}
               </button>
             }

             <!-- Default Actions -->
             @if (ctx.actionsConfig()?.decline?.visible !== false) {
               <button (click)="onAction('decline')" 
                       [class]="'px-4 py-2 text-sm font-bold rounded-lg transition-all ' + getButtonClass(ctx.actionsConfig()?.decline?.type || 'danger')">
                 {{ ctx.actionsConfig()?.decline?.label || 'Decline' }}
               </button>
             }
             @if (ctx.actionsConfig()?.approve?.visible !== false) {
               <button (click)="onAction('approve')" 
                       [class]="'px-4 py-2 text-sm font-bold rounded-lg transition-all ' + getButtonClass(ctx.actionsConfig()?.approve?.type || 'primary')">
                 {{ ctx.actionsConfig()?.approve?.label || 'Approve' }}
               </button>
             }
             @if (ctx.actionsConfig()?.save?.visible !== false) {
               <button (click)="onAction('save')" class="px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all">
                 {{ ctx.actionsConfig()?.save?.label || 'Save as Draft' }}
               </button>
             }
             @if (ctx.actionsConfig()?.submit?.visible !== false) {
               <button (click)="onAction('submit')" class="ui-btn-primary px-6 py-2 text-sm shadow-indigo-100 shadow-lg active:scale-95">
                 {{ ctx.actionsConfig()?.submit?.label || 'Submit' }}
               </button>
             }
          </div>
        </div>

        <div class="p-8">

        <!-- System Intro (Static) -->
        @if (document.intro_text && !ctx.dynamicIntro()) {
          <div class="mb-8 p-5 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-500" [ngClass]="getIntroClass(document.intro_color || 'gray')">
            <div class="flex gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div class="text-[13px] leading-relaxed" [innerHTML]="document.intro_text"></div>
            </div>
          </div>
        }

        <!-- Dynamic Intro (Scripted) -->
        @if (ctx.dynamicIntro()) {
          <div class="mb-8 p-5 rounded-xl border shadow-sm animate-in zoom-in-95 duration-300" [ngClass]="getIntroClass(ctx.dynamicIntro()!.color)">
             <div class="flex gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <div class="text-[13px] font-medium leading-relaxed" [innerHTML]="ctx.dynamicIntro()!.message"></div>
             </div>
          </div>
        }

        <!-- Sections -->
        <div class="space-y-4">
           @for (section of document.sections; track section.id) {
             @if (!ctx.getSectionSignal(section.id, 'hidden')()) {
               <div class="section-container group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  @if (section.label) {
                    <div class="flex items-center gap-3 mb-4">
                      <h3 class="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">{{ section.label }}</h3>
                    </div>
                  }
                  
                  @if (section.description) {
                    <p class="text-xs text-zinc-400 mb-4 -mt-2 italic">{{ section.description }}</p>
                  }

                  <div class="flex flex-wrap -mx-3">
                    @for (col of section.columns; track col.id) {
                      <div class="px-3" [ngClass]="getColumnClass(section)">
                        <div class="space-y-4">
                          @for (field of col.fields; track field.id) {
                            @if (!ctx.getFieldSignal(field.fieldname, 'hidden')()) {
                              <div class="field-group transition-all duration-200">
                                @if (field.fieldtype !== 'Button' && field.fieldtype !== 'Check') {
                                  <label class="flex items-center justify-between mb-1.5">
                                    <span class="text-[12.5px] text-zinc-600 tracking-tight flex items-center gap-1 font-medium">
                                      {{ ctx.getFieldSignal(field.fieldname, 'label')() || field.label }}
                                      @if (ctx.getFieldSignal(field.fieldname, 'mandatory')()) {
                                        <span class="text-red-500 font-bold">*</span>
                                      }
                                    </span>
                                  </label>
                                }

                                <!-- Field Input based on type -->
                                <div class="relative group/input" [class.regex-error]="field.regex && formData[field.fieldname] && !isValidRegex(field.fieldname, field.regex)">
                                  @switch (field.fieldtype) {
                                    @case ('Check') {
                                      <div class="flex items-center gap-3 py-2">
                                        <input type="checkbox"
                                          class="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                          [ngModel]="formData[field.fieldname] === 1"
                                          (ngModelChange)="onFieldChange(field.fieldname, $event ? 1 : 0)"
                                          [disabled]="ctx.isReadOnly() || ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                        <span class="text-[13px] text-zinc-600 font-medium select-none">{{ ctx.getFieldSignal(field.fieldname, 'label')() || field.label }}</span>
                                      </div>
                                    }
                                    @case ('Text') {
                                      <textarea 
                                        class="ui-textarea" 
                                        rows="3"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [placeholder]="field.placeholder || ''"
                                        [disabled]="ctx.isReadOnly() || ctx.getFieldSignal(field.fieldname, 'read_only')()"></textarea>
                                    }
                                    @case ('Select') {
                                      <select 
                                        class="ui-select"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [disabled]="ctx.isReadOnly() || ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                        <option value="">Select an option...</option>
                                        @for (opt of getOptions(field.options); track opt) {
                                          <option [value]="opt">{{ opt }}</option>
                                        }
                                      </select>
                                    }
                                    @case ('Button') {
                                      <div class="py-1">
                                        <button 
                                          type="button"
                                          (click)="onFieldChange(field.fieldname)"
                                          [disabled]="ctx.isReadOnly() || ctx.getFieldSignal(field.fieldname, 'read_only')()"
                                          class="px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                          [ngClass]="getButtonClass(field.options)">
                                          {{ ctx.getFieldSignal(field.fieldname, 'label')() || field.label }}
                                        </button>
                                      </div>
                                    }
                                    @case ('Text Editor') {
                                      <div class="rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-50/50 transition-all">
                                        <quill-editor
                                          class="ql-frappe-style"
                                          [(ngModel)]="formData[field.fieldname]"
                                          (onContentChanged)="onFieldChange(field.fieldname)"
                                          [readOnly]="ctx.isReadOnly() || ctx.getFieldSignal(field.fieldname, 'read_only')()"
                                          [placeholder]="field.placeholder || 'Type here...'"
                                          theme="snow"
                                        ></quill-editor>
                                      </div>
                                    }
                                    @case ('Table') {
                                      <div class="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div class="overflow-x-auto">
                                          <table class="w-full text-left border-collapse">
                                            <thead>
                                              <tr class="bg-zinc-50/80 border-b border-zinc-200">
                                                <th class="p-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-12 text-center">#</th>
                                                @for (col of field.table_fields; track col.id) {
                                                  <th class="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                                    {{ col.label }}
                                                    @if (col.mandatory) { <span class="text-red-500">*</span> }
                                                  </th>
                                                }
                                                <th class="p-3 w-10"></th>
                                              </tr>
                                            </thead>
                                            <tbody class="divide-y divide-zinc-100">
                                              @for (row of formData[field.fieldname]; track $index) {
                                                <tr class="hover:bg-zinc-50/50 transition-colors group/row">
                                                  <td class="p-3 text-center text-[11px] font-mono text-zinc-400">{{ $index + 1 }}</td>
                                                  @for (col of field.table_fields; track col.id) {
                                                    <td class="p-2">
                                                      @switch (col.fieldtype) {
                                                        @case ('Check') {
                                                          <div class="flex justify-center">
                                                            <input type="checkbox" 
                                                              [disabled]="ctx.isReadOnly()"
                                                              [(ngModel)]="row[col.fieldname]" 
                                                              (ngModelChange)="onFieldChange(field.fieldname)" 
                                                              class="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500">
                                                          </div>
                                                        }
                                                        @case ('Select') {
                                                          <select 
                                                            [disabled]="ctx.isReadOnly()"
                                                            [(ngModel)]="row[col.fieldname]" 
                                                            (ngModelChange)="onFieldChange(field.fieldname)" 
                                                            class="w-full p-1.5 text-xs bg-transparent border-0 focus:ring-0 focus:bg-white rounded hover:bg-zinc-100/50 transition-all">
                                                            <option value="">-</option>
                                                            @for (opt of getOptions(col.options); track opt) {
                                                              <option [value]="opt">{{ opt }}</option>
                                                            }
                                                          </select>
                                                        }
                                                        @default {
                                                          <input 
                                                            [disabled]="ctx.isReadOnly()"
                                                            [type]="col.fieldtype === 'Int' || col.fieldtype === 'Float' ? 'number' : 'text'"
                                                            [(ngModel)]="row[col.fieldname]"
                                                            (ngModelChange)="onFieldChange(field.fieldname)"
                                                            class="w-full p-1.5 text-xs bg-transparent border-0 focus:ring-0 focus:bg-white rounded hover:bg-zinc-100/50 transition-all"
                                                            [placeholder]="col.label">
                                                        }
                                                      }
                                                    </td>
                                                  }
                                                  <td class="p-2 text-center">
                                                    <button (click)="removeTableRow(field.fieldname, $index)" 
                                                            [disabled]="ctx.isReadOnly()"
                                                            class="p-1.5 rounded-md text-zinc-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-0 opacity-0 group-hover/row:opacity-100 transition-all">
                                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    </button>
                                                  </td>
                                                </tr>
                                              }
                                              @if (!formData[field.fieldname]?.length) {
                                                <tr>
                                                  <td [attr.colspan]="(field.table_fields?.length ?? 0) + 2" class="p-8 text-center">
                                                    <div class="flex flex-col items-center gap-2">
                                                      <div class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                                                      </div>
                                                      <p class="text-[12px] text-zinc-400 font-medium">No rows added yet</p>
                                                    </div>
                                                  </td>
                                                </tr>
                                              }
                                            </tbody>
                                          </table>
                                        </div>
                                        @if (!ctx.isReadOnly()) {
                                          <div class="p-3 bg-zinc-50/50 border-t border-zinc-200">
                                            <button (click)="addTableRow(field.fieldname)" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                              Add Row
                                            </button>
                                          </div>
                                        }
                                      </div>
                                    }
                                    @case ('Date') {

                                      <input type="date" 
                                        class="ui-input"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [disabled]="ctx.isReadOnly() || ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                    }
                                    @case ('Password') {
                                      <input type="password" 
                                        class="ui-input"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [placeholder]="field.placeholder || ''"
                                        [disabled]="ctx.isReadOnly() || ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                    }
                                    @default {
                                      <input 
                                        [type]="field.fieldtype === 'Int' || field.fieldtype === 'Float' ? 'number' : 'text'"
                                        class="ui-input"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [placeholder]="field.placeholder || ''"
                                        [disabled]="ctx.isReadOnly() || ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                    }
                                  }
                                  
                                  <!-- Field Description at bottom -->
                                  @if (field.description) {
                                    <div class="mt-1.5 px-0.5">
                                      <span class="text-[10.5px] text-zinc-400 font-normal leading-relaxed italic block tracking-tight">{{ field.description }}</span>
                                    </div>
                                  }
                                  
                                  <!-- Read Only Overlay if needed -->
                                  @if (ctx.getFieldSignal(field.fieldname, 'read_only')()) {
                                    <div class="absolute inset-0 bg-zinc-50/10 cursor-not-allowed"></div>
                                  }
                                </div>
                              </div>
                            }
                          }
                        </div>
                      </div>
                    }
                  </div>
               </div>
             }
           }
        </div>

        </div>

        <!-- Submit placeholder (Bottom) -->
        <div class="px-8 pb-10 flex items-center justify-center">
           <p class="text-[10px] text-zinc-300 font-medium uppercase tracking-[0.3em]">End of Form</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card {
      border-radius: 1.5rem;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05), 0 0 1px rgba(0,0,0,0.1);
    }
    .ui-input, .ui-textarea, .ui-select {
      @apply bg-zinc-50/50 border-zinc-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300;
      border-radius: 0.75rem;
    }
    .regex-error .ui-input, .regex-error .ui-textarea, .regex-error .ui-select, .regex-error .ql-container {
      @apply border-red-500 bg-red-50/30 focus:ring-red-500/10 !important;
    }
    .ql-frappe-style .ql-toolbar {
      @apply bg-zinc-50 border-0 border-b border-zinc-200 py-3 px-4 !important;
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
    }
    .ql-frappe-style.ql-snow {
      @apply border-0 !important;
    }
    .ql-frappe-style .ql-container {
      @apply border-0 text-zinc-700 font-sans !important;
      font-size: 14px;
      height: auto !important;
      min-height: 200px !important;
      max-height: 800px;
      resize: vertical;
      overflow: auto;
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
    }
    .ql-frappe-style .ql-editor {
      @apply px-6 py-5 leading-relaxed;
      min-height: 200px;
      height: auto !important;
      overflow-y: visible;
    }
    /* Simple CSS resize handle styling */
    .ql-frappe-style .ql-container::-webkit-resizer {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 19l4-4M10 19l9-9'/%3E%3C/svg%3E");
      background-size: 10px 10px;
      background-repeat: no-repeat;
      background-position: bottom right;
      cursor: ns-resize;
    }
    .ql-frappe-style .ql-editor.ql-blank::before {
      @apply left-6 text-zinc-300 italic;
    }
    .ql-frappe-style .ql-picker-label {
      @apply text-zinc-600 !important;
    }
    .ql-frappe-style .ql-stroke {
      @apply stroke-zinc-500 !important;
    }
    .ql-frappe-style .ql-fill {
      @apply fill-zinc-500 !important;
    }
    
    /* Layout cleanups for readonly */
    .form-readonly .canvas-field {
      @apply pointer-events-none opacity-90;
    }
    .form-readonly .ql-toolbar {
      @apply hidden !important;
    }
    .form-readonly .ql-container {
      @apply border-zinc-100 bg-zinc-50/50 !important;
      resize: none;
    }
  `]
})
export class FormRendererComponent implements OnInit, OnDestroy {
  @Input() document!: DocumentDefinition;
  @Output() formSubmit = new EventEmitter<any>();

  formData: any = {};
  ctx = inject(FormContext);
  utils = inject(AppUtilityService);

  constructor() {
    // Re-evaluate depends_on when form data changes
    effect(() => {
      this.evaluateDependsOn();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.initForm();
    this.ctx.initialize(this.document, this.formData);
    // Execute script ONCE to register listeners and run 'refresh'
    this.ctx.execute(this.document.client_script || '', 'refresh');
  }

  ngOnDestroy() {
    this.ctx.destroy();
  }

  private initForm() {
    this.formData = {};
    this.document.sections.forEach(s => {
      s.columns.forEach(c => {
        c.fields.forEach(f => {
          if (f.fieldtype === 'Table') {
            this.formData[f.fieldname] = f.default || [];
          } else if (f.fieldtype === 'Check') {
            this.formData[f.fieldname] = f.default ? 1 : 0;
          } else {
            this.formData[f.fieldname] = f.default !== undefined ? f.default : '';
          }
        });
      });
    });
  }


  onFieldChange(fieldname: string, val?: any) {
    if (val !== undefined) {
      this.formData[fieldname] = val;
    }
    this.evaluateDependsOn();
    // triggerChange internally calls trigger(), which executes listeners registered in OnInit
    this.ctx.triggerChange(fieldname, this.formData[fieldname]);
  }

  validateForm(): boolean {
    let isValid = true;

    // 1. Check Mandatory Fields
    this.document.sections.forEach(s => {
      if (this.ctx.getSectionSignal(s.id, 'hidden')()) return;
      s.columns.forEach(c => {
        c.fields.forEach(f => {
          if (this.ctx.getFieldSignal(f.fieldname, 'hidden')()) return;
          const isMandatory = this.ctx.getFieldSignal(f.fieldname, 'mandatory')();
          const val = this.formData[f.fieldname];

          if (isMandatory && (val === undefined || val === null || val === '')) {
            isValid = false;
          }

          // 2. Check Regex
          if (f.regex && val && !this.isValidRegex(f.fieldname, f.regex)) {
            isValid = false;
          }

          // 2.1 Check Table Validation
          if (f.fieldtype === 'Table' && this.formData[f.fieldname]) {
            const rows = this.formData[f.fieldname] as any[];
            rows.forEach((row, idx) => {
              f.table_fields?.forEach(tf => {
                const cellVal = row[tf.fieldname];
                if (tf.mandatory && (cellVal === undefined || cellVal === null || cellVal === '')) {
                  isValid = false;
                }
                if (tf.regex && cellVal && !this.isValidRegex(tf.fieldname, tf.regex, cellVal)) {
                  isValid = false;
                }
              });
            });
          }
        });
      });
    });

    if (!isValid) {
      this.utils.show_alert('Please fill in all mandatory fields correctly before submitting.', 'error');
      return false;
    }

    // 3. Script Hook: validate
    // Since we ran execute() in ngOnInit, the 'validate' listener is already registered.
    const result = this.ctx.trigger('validate');
    if (result === false) {
      return false;
    }

    return true;
  }

  saveDraft() {
    if (this.validateForm()) {
      console.log('Form Saved as Draft:', this.formData);
      this.utils.show_alert('Draft saved successfully', 'success');
    }
  }

  submit() {
    if (this.validateForm()) {
      this.formSubmit.emit(this.formData);
      this.utils.show_alert('Form submitted successfully', 'success');
    }
  }

  private evaluateDependsOn() {
    // Evaluate field visibility / mandatory
    this.document.sections.forEach(s => {
      s.columns.forEach(c => {
        c.fields.forEach(f => {
          if (f.depends_on) {
            const visible = this.evalExpression(f.depends_on);
            this.ctx.set_df_property(f.fieldname, 'hidden', visible ? 0 : 1);
          }
          if (f.mandatory_depends_on) {
            const mandatory = this.evalExpression(f.mandatory_depends_on);
            this.ctx.set_df_property(f.fieldname, 'mandatory', mandatory ? 1 : 0);
          }
        });
      });
    });

    // Evaluate section visibility
    this.document.sections.forEach(s => {
      if (s.depends_on) {
        const visible = this.evalExpression(s.depends_on);
        this.ctx.set_section_property(s.id, 'hidden', visible ? 0 : 1);
      }
    });
  }

  private evalExpression(expr: string): boolean {
    try {
      const fn = new Function('doc', `return (${expr})`);
      return !!fn(this.formData);
    } catch (e) {
      console.warn(`[depends_on] Failed to evaluate: ${expr}`, e);
      return false;
    }
  }

  isSingleFieldSection(section: DocumentSection): boolean {
    let count = 0;
    section.columns.forEach(c => count += c.fields.length);
    return count === 1;
  }

  getColumnClass(section: DocumentSection) {
    if (this.isSingleFieldSection(section)) return 'w-full';
    const count = section.columns.length || section.columns_count || 1;

    const classes: Record<number, string> = {
      1: 'w-full',
      2: 'w-full md:w-1/2',
      3: 'w-full md:w-1/3',
      4: 'w-full md:w-1/4',
      5: 'w-full md:w-1/5',
      6: 'w-full md:w-1/6'
    };

    return classes[count] || 'w-full md:w-1/2';
  }

  getOptions(optStr?: string): string[] {
    if (!optStr) return [];
    return optStr.split('\n').map(o => o.trim()).filter(Boolean);
  }

  getIntroClass(color: string) {
    const map: any = {
      blue: 'bg-blue-50/50 border-blue-100 text-blue-700',
      orange: 'bg-orange-50/50 border-orange-100 text-orange-700',
      red: 'bg-red-50/50 border-red-100 text-red-700',
      green: 'bg-emerald-50/50 border-emerald-100 text-emerald-700',
      yellow: 'bg-yellow-50/50 border-yellow-100 text-yellow-700',
      gray: 'bg-zinc-50 border-zinc-200 text-zinc-600'
    };
    return map[color] || map.gray;
  }

  getButtonClass(style?: string): string {
    const map: Record<string, string> = {
      primary: 'ui-btn-primary shadow-indigo-100 shadow-md',
      secondary: 'ui-btn-secondary border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
      danger: 'ui-btn-destructive shadow-red-100 shadow-md',
      ghost: 'ui-btn-ghost hover:bg-zinc-100',
    };
    return map[style ?? 'secondary'] || map['secondary'];
  }

  onAction(id: string) {
    const config = (this.ctx.actionsConfig() as any)?.[id.toLowerCase()];
    if (!config) return;

    if (config.runtimeAction) {
      config.runtimeAction(this.ctx);
    } else if (config.action) {
      this.ctx.execute(config.action, id);
    } else {
      if (id === 'save') this.saveDraft();
      else if (id === 'submit') this.submit();
      else {
        this.utils.show_alert(`${id.charAt(0).toUpperCase() + id.slice(1)} action triggered`, 'info');
      }
    }
  }

  isValidRegex(fieldname: string, pattern: string, customValue?: any): boolean {
    const value = customValue !== undefined ? customValue : this.formData[fieldname];
    if (value === undefined || value === null || value === '') return true;
    try {
      const regex = new RegExp(pattern);
      return regex.test(String(value));
    } catch (e) {
      return false;
    }
  }

  addTableRow(fieldname: string) {
    if (!this.formData[fieldname]) this.formData[fieldname] = [];
    this.formData[fieldname].push({});
    this.onFieldChange(fieldname);
  }

  removeTableRow(fieldname: string, index: number) {
    this.formData[fieldname].splice(index, 1);
    this.onFieldChange(fieldname);
  }
}
