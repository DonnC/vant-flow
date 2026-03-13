import { Component, Input, OnInit, OnDestroy, signal, inject, Output, EventEmitter, effect, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentDefinition, DocumentField, DocumentSection, DocumentColumn } from '../../models/document.model';
import { FormContext } from '../../services/form-context';
import { AppUtilityService } from '../../services/app-utility.service';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [FormContext],
  template: `
    <div class="w-full max-w-4xl mx-auto py-10 px-4">
      <div class="card bg-white p-8">
        <!-- Form Header -->
        <div class="mb-8 border-b border-zinc-100 pb-6">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-3xl font-extrabold text-zinc-900 tracking-tight">{{ document.name }}</h2>
            <span class="px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-500 font-mono text-[10px] tracking-widest uppercase">
              {{ document.version || 'v1.0.0' }}
            </span>
          </div>
          @if (document.module) {
            <p class="text-[11px] font-bold text-zinc-400 mt-2 uppercase tracking-[0.2em]">{{ document.module }}</p>
          }
          @if (document.description) {
            <p class="text-[13px] text-zinc-500 mt-1.5 leading-relaxed max-w-3xl">{{ document.description }}</p>
          }
        </div>

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
                      <h3 class="text-sm font-bold text-zinc-800 uppercase tracking-wider">{{ section.label }}</h3>
                      <div class="h-[1px] flex-1 bg-zinc-100"></div>
                    </div>
                  } @else {
                    <div class="h-[1px] w-full bg-zinc-100 mb-6"></div>
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
                                <label class="flex items-center justify-between mb-1.5">
                                  <span class="text-[12px] font-bold text-zinc-700 uppercase tracking-tight flex items-center gap-1">
                                    {{ ctx.getFieldSignal(field.fieldname, 'label')() || field.label }}
                                    @if (ctx.getFieldSignal(field.fieldname, 'mandatory')()) {
                                      <span class="text-red-500 font-black">*</span>
                                    }
                                  </span>
                                  @if (field.description) {
                                    <span class="text-[10px] text-zinc-400 font-normal italic">{{ field.description }}</span>
                                  }
                                </label>

                                <!-- Field Input based on type -->
                                <div class="relative group/input">
                                  @switch (field.fieldtype) {
                                    @case ('Check') {
                                      <div class="flex items-center gap-3 py-2">
                                        <input type="checkbox"
                                          class="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                          [(ngModel)]="formData[field.fieldname]"
                                          (ngModelChange)="onFieldChange(field.fieldname)"
                                          [disabled]="ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                        <span class="text-[13px] text-zinc-600 font-medium select-none">{{ field.label }}</span>
                                      </div>
                                    }
                                    @case ('Text') {
                                      <textarea 
                                        class="ui-textarea" 
                                        rows="3"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [placeholder]="field.placeholder || ''"
                                        [disabled]="ctx.getFieldSignal(field.fieldname, 'read_only')()"></textarea>
                                    }
                                    @case ('Select') {
                                      <select 
                                        class="ui-select"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [disabled]="ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                        <option value="">Select an option...</option>
                                        @for (opt of getOptions(field.options); track opt) {
                                          <option [value]="opt">{{ opt }}</option>
                                        }
                                      </select>
                                    }
                                    @case ('Date') {
                                      <input type="date" 
                                        class="ui-input"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [disabled]="ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                    }
                                    @case ('Password') {
                                      <input type="password" 
                                        class="ui-input"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [placeholder]="field.placeholder || ''"
                                        [disabled]="ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                    }
                                    @default {
                                      <input 
                                        [type]="field.fieldtype === 'Int' || field.fieldtype === 'Float' ? 'number' : 'text'"
                                        class="ui-input"
                                        [(ngModel)]="formData[field.fieldname]"
                                        (ngModelChange)="onFieldChange(field.fieldname)"
                                        [placeholder]="field.placeholder || ''"
                                        [disabled]="ctx.getFieldSignal(field.fieldname, 'read_only')()">
                                    }
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

        <!-- Submit -->
        <div class="mt-12 flex items-center justify-end gap-4 pt-8 border-t border-zinc-100">
           <button class="px-6 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors">Save as Draft</button>
           <button (click)="submit()" class="ui-btn-primary px-10 py-3 text-base shadow-indigo-100 shadow-xl hover:shadow-indigo-200">
              Complete Submission
           </button>
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
    this.executeScript('refresh');
  }

  ngOnDestroy() {
    this.ctx.destroy();
  }

  private initForm() {
    this.formData = {};
    this.document.sections.forEach(s => {
      s.columns.forEach(c => {
        c.fields.forEach(f => {
          this.formData[f.fieldname] = f.default !== undefined ? f.default : '';
        });
      });
    });
  }

  onFieldChange(fieldname: string) {
    this.ctx.triggerChange(fieldname, this.formData[fieldname]);
    this.executeScript(fieldname, this.formData[fieldname]);
  }

  private executeScript(event: string, value?: any) {
    if (!this.document.client_script) return;
    this.ctx.execute(this.document.client_script, event, value);
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
      // Create a function with 'doc' context
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
    return section.columns_count === 1 ? 'w-full' : 'w-full md:w-1/2';
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

  submit() {
    this.formSubmit.emit(this.formData);
  }
}
