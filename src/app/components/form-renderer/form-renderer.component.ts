import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DocType, DocField } from '../../models/doctype.model';
import { FormContext } from '../../services/form-context';
import { AppUtilityService } from '../../services/app-utility.service';

@Component({
  selector: 'app-form-renderer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-3xl mx-auto py-8 px-4">
      <!-- Doc header -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-zinc-900">{{ docType.name }}</h2>
        <p class="text-sm text-zinc-500 mt-0.5">{{ docType.module || 'Custom Form' }}</p>
      </div>

      @if (frm) {
        <form [formGroup]="frm.formGroup" class="space-y-6">
          @for (section of docType.sections; track section.id) {
            <div class="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              @if (section.label) {
                <div class="px-6 py-3 bg-zinc-50 border-b border-zinc-200">
                  <h3 class="text-sm font-semibold text-zinc-700">{{ section.label }}</h3>
                </div>
              }
              <div class="flex divide-x divide-zinc-100">
                @for (col of section.columns; track col.id) {
                  <div class="flex-1 px-6 py-5 space-y-4">
                    @for (field of col.fields; track field.id) {
                      @if (getSignal(field.fieldname)?.()?.hidden !== true) {
                        <div>
                          @if (field.fieldtype !== 'Check') {
                            <label [for]="field.fieldname" class="ui-label">
                              {{ field.label }}
                              @if (getSignal(field.fieldname)?.()?.mandatory || getSignal(field.fieldname)?.()?.reqd) {
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
                                >
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
                                  [formControlName]="field.fieldname">
                                <span class="text-sm font-medium text-zinc-700">{{ field.label }}</span>
                              </label>
                            }
                            @default {
                              <input class="ui-input"
                                [type]="field.fieldtype === 'Int' || field.fieldtype === 'Float' ? 'number' : field.fieldtype === 'Date' ? 'date' : field.fieldtype === 'Password' ? 'password' : 'text'"
                                [formControlName]="field.fieldname"
                                [attr.placeholder]="field.placeholder || field.label"
                                [attr.readonly]="getSignal(field.fieldname)?.()?.read_only ? true : null">
                            }
                          }

                          @if (field.description) {
                            <p class="text-xs text-zinc-400 mt-1">{{ field.description }}</p>
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
    </div>
  `
})
export class FormRendererComponent implements OnInit, OnDestroy {
  @Input() docType!: DocType;
  frm!: FormContext;

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

  private buildForm() {
    const group = this.fb.group({});
    const allFields = this.docType.sections.flatMap(s => s.columns.flatMap(c => c.fields));

    allFields.forEach(field => {
      const validators = (field.reqd || field.mandatory) ? [Validators.required] : [];
      const val = field.default ?? (field.fieldtype === 'Check' ? false : null);
      group.addControl(field.fieldname, this.fb.control({ value: val, disabled: field.read_only }, validators));
    });

    this.frm = new FormContext(allFields, group);

    // Evaluate depends_on on value changes
    this.sub.add(group.valueChanges.subscribe(() => this.evaluateDependsOn(group.getRawValue())));
    this.evaluateDependsOn(group.getRawValue());

    // Fire individual field change events
    Object.keys(group.controls).forEach(key => {
      this.sub.add(group.get(key)!.valueChanges.subscribe(val => this.frm.trigger(`${key}_change`, val)));
    });
  }

  private evaluateDependsOn(doc: any) {
    const allFields = this.docType.sections.flatMap(s => s.columns.flatMap(c => c.fields));
    allFields.forEach(field => {
      if (!field.depends_on) return;
      try {
        const expr = field.depends_on.startsWith('eval:') ? field.depends_on.slice(5) : field.depends_on;
        const visible = new Function('doc', `return !!(${expr})`)(doc);
        this.frm.set_df_property(field.fieldname, 'hidden', !visible);
      } catch { /* ignore expression errors */ }
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
