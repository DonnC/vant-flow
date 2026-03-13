import { Component, Input, OnInit, OnDestroy, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DocType, DocField } from '../../models/doctype.model';
import { FormContext } from '../../services/form-context';
import { AppUtilityService } from '../../services/app-utility.service';
import { BuilderStateService } from '../../services/builder-state.service';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
      <!-- Doc header -->
      <div class="mb-6">
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-extrabold text-zinc-900 tracking-tight">{{ docType.name }}</h2>
          @if (docType.version) {
            <span class="px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-500 font-mono text-[10px] tracking-widest uppercase">{{ docType.version }}</span>
          }
        </div>
        @if (docType.module) {
          <p class="text-[11px] font-bold text-zinc-400 mt-2 uppercase tracking-[0.2em]">{{ docType.module }}</p>
        }
        @if (docType.description) {
          <p class="text-[13px] text-zinc-500 mt-1.5 leading-relaxed max-w-3xl">{{ docType.description }}</p>
        }
      </div>

      <!-- Form Intro Banner -->
      @if (introBanner) {
        <div class="mb-8 px-6 py-4 rounded-xl border flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-400" 
             [ngClass]="getIntroClasses(introBanner.color)">
          <div class="shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="11" x2="12.01" y2="11"/>
            </svg>
          </div>
          <div class="text-sm leading-relaxed font-semibold opacity-90" [innerHTML]="introBanner.message"></div>
        </div>
      }

      @if (frm) {
        <form [formGroup]="frm.formGroup" (ngSubmit)="onSubmit()" class="space-y-6">
          @for (section of docType.sections; track section.id) {
            <div class="mb-10 pb-10 border-b border-zinc-200 last:border-0 last:mb-0 last:pb-0">
              @if (section.label || section.description) {
                <div class="mb-6 px-1">
                  @if (section.label) { <h3 class="text-lg font-bold text-zinc-800 tracking-tight">{{ section.label }}</h3> }
                  @if (section.description) { <p class="text-[13px] text-zinc-500 mt-1 leading-relaxed">{{ section.description }}</p> }
                </div>
              }
              <div class="grid gap-x-12 gap-y-6" 
                   [class.grid-cols-1]="section.columns_count === 1 || getFieldCount(section) === 1" 
                   [class.grid-cols-2]="section.columns_count !== 1 && getFieldCount(section) !== 1">
                @for (col of section.columns; track col.id) {
                  <div class="space-y-6">
                    @for (field of col.fields; track field.id) {
                      @if (getSignal(field.fieldname)?.()?.hidden !== true) {
                        <div>
                          @if (field.fieldtype !== 'Check') {
                            <label [for]="field.fieldname" class="ui-label">
                              {{ getSignal(field.fieldname)?.()?.label }}
                              @if (getSignal(field.fieldname)?.()?.mandatory) {
                                <span class="text-red-500 ml-0.5">*</span>
                              }
                            </label>
                          }

                          @switch (getSignal(field.fieldname)?.()?.fieldtype) {
                            @case ('Select') {
                              <select class="ui-select" [formControlName]="field.fieldname"
                                [attr.disabled]="getSignal(field.fieldname)?.()?.read_only ? true : null">
                                <option value="">-- Select --</option>
                                @for (opt of getOptions(field.fieldname); track opt) {
                                  <option [value]="opt">{{ opt }}</option>
                                }
                              </select>
                            }
                            @case ('Link') {
                              <div class="relative">
                                <input
                                  class="ui-input pr-8"
                                  type="text"
                                  [formControlName]="field.fieldname"
                                  [attr.placeholder]="'Search ' + (field.options || field.label) + '...'"
                                  [readonly]="getSignal(field.fieldname)?.()?.read_only"
                                  (input)="searchLink(field, $event)"
                                  autocomplete="off"
                                />
                                <svg class="absolute right-2.5 top-2.5 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                @if (getLinkResults(field.fieldname).length > 0) {
                                  <div class="absolute z-20 mt-1 w-full bg-white rounded-lg border border-zinc-200 shadow-lg overflow-hidden">
                                    @for (result of getLinkResults(field.fieldname); track result) {
                                      <button type="button"
                                        (click)="selectLinkResult(field.fieldname, result)"
                                        class="w-full text-left px-3 py-2.5 hover:bg-indigo-50 hover:text-indigo-700 text-sm border-b border-zinc-100 last:border-b-0 transition-colors">
                                        {{ result }}
                                      </button>
                                    }
                                  </div>
                                }
                              </div>
                            }
                            @case ('Text') {
                              <textarea class="ui-textarea" [formControlName]="field.fieldname"
                                [attr.placeholder]="field.placeholder || ''"
                                [attr.readonly]="getSignal(field.fieldname)?.()?.read_only ? true : null">
                              </textarea>
                            }
                            @case ('Check') {
                              <label class="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" class="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                  [checked]="frm.formGroup.get(field.fieldname)?.value === 1"
                                  (change)="frm.set_value(field.fieldname, $any($event.target).checked ? 1 : 0)" />
                                <span class="text-sm font-medium text-zinc-700">{{ getSignal(field.fieldname)?.()?.label }}</span>
                              </label>
                            }
                            @default {
                              <input class="ui-input"
                                [type]="field.fieldtype === 'Int' || field.fieldtype === 'Float' ? 'number' : field.fieldtype === 'Date' ? 'date' : field.fieldtype === 'Password' ? 'password' : 'text'"
                                [formControlName]="field.fieldname"
                                [attr.placeholder]="field.placeholder || field.label"
                                [attr.readonly]="getSignal(field.fieldname)?.()?.read_only ? true : null" />
                            }
                          }

                          @if (getSignal(field.fieldname)?.()?.description) {
                            <p class="text-xs text-zinc-400 mt-1">{{ getSignal(field.fieldname)?.()?.description }}</p>
                          }
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Submit -->
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="ui-btn-secondary">Cancel</button>
            <button type="submit" class="ui-btn-primary px-6">Submit</button>
          </div>
        </form>
      }
  `
})
export class FormRendererComponent implements OnInit, OnDestroy {
  @Input() docType!: DocType;
  @Output() formSubmit = new EventEmitter<any>();
  frm!: FormContext;

  state = inject(BuilderStateService);

  get introBanner() {
    return this.state.dynamicIntro() || (this.docType.intro_text ? { message: this.docType.intro_text, color: this.docType.intro_color || 'gray' } : null);
  }

  getFieldCount(section: any): number {
    if (!section || !section.columns) return 0;
    return section.columns.reduce((sum: number, col: any) => sum + (col.fields?.length || 0), 0);
  }

  getIntroClasses(colorName?: string) {
    const c = colorName || this.docType.intro_color || 'gray';
    const themes: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-100 text-blue-800',
      orange: 'bg-amber-50 border-amber-100 text-amber-800',
      red: 'bg-red-50 border-red-100 text-red-800',
      green: 'bg-emerald-50 border-emerald-100 text-emerald-800',
      yellow: 'bg-yellow-50 border-yellow-100 text-yellow-800',
      gray: 'bg-zinc-100 border-zinc-200 text-zinc-700'
    };
    return themes[c] || themes['gray'];
  }

  private fb = inject(FormBuilder);
  private appUtility = inject(AppUtilityService);
  private sub = new Subscription();
  private linkResults = new Map<string, string[]>();
  private linkTimers = new Map<string, any>();

  ngOnInit() {
    this.buildForm();
    this.executeClientScript();
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  onSubmit() {
    if (this.frm.formGroup.valid) {
      this.formSubmit.emit(this.frm.formGroup.getRawValue());
    } else {
      // Mark all as touched to show errors
      Object.values(this.frm.formGroup.controls).forEach(c => c.markAsTouched());
    }
  }

  private buildForm() {
    const group = this.fb.group({});
    const allFields = this.docType.sections.flatMap(s => s.columns.flatMap(c => c.fields));

    allFields.forEach(field => {
      const validators = (field.reqd || field.mandatory) ? [Validators.required] : [];
      let val = field.default;
      if (field.fieldtype === 'Check') {
        val = (val === 1 || val === true) ? 1 : 0;
      }
      group.addControl(field.fieldname, this.fb.control({ value: val, disabled: field.read_only }, validators));
    });

    this.frm = new FormContext(allFields, group, this.appUtility, this.state);

    // Evaluate depends_on on value changes
    this.sub.add(group.valueChanges.subscribe(() => this.evaluateDependsOn(group.getRawValue())));
    this.evaluateDependsOn(group.getRawValue());

    // Fire individual field change events
    Object.keys(group.controls).forEach(key => {
      this.sub.add(group.get(key)!.valueChanges.subscribe(val => {
        this.frm.trigger(`${key}`, val);
        this.frm.trigger(`${key}_change`, val);
      }));
    });
  }

  private evaluateDependsOn(doc: any) {
    const allFields = this.docType.sections.flatMap(s => s.columns.flatMap(c => c.fields));
    allFields.forEach(field => {
      // Visibility logic
      const visExpr = field.display_depends_on || field.depends_on;
      if (visExpr) {
        try {
          const expr = visExpr.startsWith('eval:') ? visExpr.slice(5) : visExpr;
          const visible = new Function('doc', `return !!(${expr})`)(doc);
          this.frm.set_df_property(field.fieldname, 'hidden', !visible);
        } catch { }
      }

      // Mandatory logic
      if (field.mandatory_depends_on) {
        try {
          const expr = field.mandatory_depends_on.startsWith('eval:') ? field.mandatory_depends_on.slice(5) : field.mandatory_depends_on;
          const isMandatory = new Function('doc', `return !!(${expr})`)(doc);
          this.frm.set_df_property(field.fieldname, 'mandatory', isMandatory);
        } catch { }
      }
    });
  }

  private executeClientScript() {
    const script = this.docType.client_script;
    if (!script?.trim()) return;
    try {
      new Function('frm', 'app', script)(this.frm, this.appUtility);
      this.frm.trigger('refresh');
    } catch (e) {
      console.error('[client_script] Error:', e);
    }
  }

  getSignal(fieldname: string) { return this.frm?.fieldSignals.get(fieldname); }

  getOptions(fieldname: string): string[] {
    const opts = this.frm?.fieldSignals.get(fieldname)?.()?.options ?? '';
    return opts.split('\n').map((o: string) => o.trim()).filter(Boolean);
  }

  getLinkResults(fieldname: string): string[] { return this.linkResults.get(fieldname) ?? []; }

  searchLink(field: DocField, event: Event) {
    const txt = (event.target as HTMLInputElement).value;
    clearTimeout(this.linkTimers.get(field.fieldname));
    if (!txt.trim()) { this.linkResults.set(field.fieldname, []); return; }

    this.linkTimers.set(field.fieldname, setTimeout(() => {
      // Apply set_query filters if present
      let filters: Record<string, any> = {};
      const queryFn = this.frm.get_query(field.fieldname);
      if (queryFn) {
        try { filters = queryFn(this.frm)?.filters ?? {}; } catch { }
      }
      // Mock backend data
      const mockDb: Record<string, Array<Record<string, any>>> = {
        Customer: [
          { name: 'Acme Corp', status: 'Active', tier: 'Gold' },
          { name: 'Globex Inc', status: 'Inactive', tier: 'Silver' },
          { name: 'Initech LLC', status: 'Active', tier: 'Platinum' },
          { name: 'Umbrella Co', status: 'Active', tier: 'Standard' },
        ]
      };
      const pool = mockDb[field.options ?? ''] ?? [];
      const results = pool
        .filter(r => Object.entries(filters).every(([k, v]) => r[k] === v))
        .filter(r => r['name'].toLowerCase().includes(txt.toLowerCase()))
        .map(r => r['name']);
      this.linkResults.set(field.fieldname, results);
    }, 250));
  }

  selectLinkResult(fieldname: string, val: string) {
    this.frm.set_value(fieldname, val);
    this.linkResults.set(fieldname, []);
  }
}
