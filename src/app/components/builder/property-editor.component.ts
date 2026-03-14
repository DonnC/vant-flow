import { Component, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderStateService } from '../../services/builder-state.service';
import { DocumentField, FieldType } from '../../models/document.model';

const FIELD_TYPES: FieldType[] = ['Data', 'Select', 'Link', 'Check', 'Int', 'Text', 'Text Editor', 'Table', 'Date', 'Float', 'Password', 'Button'];

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

    <!-- ── FORM SETTINGS ── -->
    @if (state.showFormSettings()) {
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-5 animate-in fade-in duration-300">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Form Settings</span>
        </div>

        <!-- Document Name -->
        <div class="space-y-1.5">
          <label class="ui-label font-bold text-zinc-600">Document / Form Name</label>
          <input class="ui-input" [ngModel]="state.document().name" (ngModelChange)="updateFormMetadata({ name: $event })" placeholder="e.g. Lead, Customer">
        </div>

        <!-- Module -->
        <div class="space-y-1.5">
          <label class="ui-label font-bold text-zinc-600">Module / Package</label>
          <input class="ui-input" [ngModel]="state.document().module" (ngModelChange)="updateFormMetadata({ module: $event })" placeholder="e.g. Core System">
        </div>

        <!-- Version -->
        <div class="space-y-1.5">
          <label class="ui-label font-bold text-zinc-600">Version</label>
          <input class="ui-input" [ngModel]="state.document().version" (ngModelChange)="updateFormMetadata({ version: $event })" placeholder="e.g. 1.0.0">
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <label class="ui-label font-bold text-zinc-600">Description</label>
          <textarea class="ui-textarea text-xs" rows="2" [ngModel]="state.document().description" (ngModelChange)="updateFormMetadata({ description: $event })" placeholder="Overview of this Document..."></textarea>
        </div>

        <div class="ui-sep"></div>

        <!-- Intro Section -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-500"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h4 class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Intro Banner</h4>
          </div>

          <div class="space-y-1.5">
            <label class="ui-label font-bold text-zinc-600">Intro Message (HTML supported)</label>
            <textarea class="ui-textarea text-xs leading-relaxed" rows="5" 
              [ngModel]="state.document().intro_text" 
              (ngModelChange)="updateFormMetadata({ intro_text: $event })"
              placeholder="Helpful documentation or instructions for users shown at the top of this form..."></textarea>
          </div>

          <div class="space-y-1.5">
            <label class="ui-label font-bold text-zinc-600">Banner Theme</label>
            <div class="grid grid-cols-6 gap-1.5">
              @for (c of introColors; track c) {
                <button (click)="updateFormMetadata({ intro_color: c })" 
                  class="h-8 rounded-md border-2 transition-all flex items-center justify-center relative group overflow-hidden"
                  [title]="c | titlecase"
                  [class.border-indigo-600]="state.document().intro_color === c"
                  [class.border-zinc-200]="state.document().intro_color !== c"
                  [ngClass]="getIntroPreviewClass(c)"
                >
                  @if (state.document().intro_color === c) {
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12" /></svg>
                  }
                </button>
              }
            </div>
          </div>
        </div>

        <div class="ui-sep"></div>

        <!-- Action Buttons Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-500"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <h4 class="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Action Header Buttons</h4>
          </div>

          @for (btnId of actionButtonIds; track btnId) {
            @if (getActionConfig(btnId); as btn) {
              <div class="p-3 bg-zinc-50 border border-zinc-100 rounded-lg space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-zinc-500 tracking-tighter">{{ btnId }}</span>
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" 
                      class="w-3.5 h-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" 
                      [ngModel]="btn.visible" 
                      (ngModelChange)="state.updateAction(btnId, { visible: $event })">
                    <span class="text-[10px] font-bold text-zinc-400 uppercase">Visible</span>
                  </label>
                </div>

                @if (btn.visible) {
                  <div class="space-y-2 animate-in slide-in-from-top-1 duration-200">
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-zinc-400 uppercase">Label</label>
                      <input class="ui-input !p-1.5 !text-[11px]" 
                        [ngModel]="btn.label" 
                        (ngModelChange)="state.updateAction(btnId, { label: $event })"
                        placeholder="Button Label">
                    </div>
                    
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-zinc-400 uppercase">Style / Type</label>
                      <div class="grid grid-cols-4 gap-1">
                        @for (t of ['primary', 'secondary', 'danger', 'ghost']; track t) {
                          <button (click)="state.updateAction(btnId, { type: t })"
                            class="py-1 text-[9px] font-bold rounded border transition-all capitalize"
                            [class.bg-white]="btn.type === t"
                            [class.border-indigo-500]="btn.type === t"
                            [class.text-indigo-600]="btn.type === t"
                            [class.text-zinc-400]="btn.type !== t"
                            [class.border-transparent]="btn.type !== t"
                          >{{ t }}</button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>

        <div class="ui-sep"></div>

        <div class="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <p class="text-[11px] text-zinc-500 font-medium leading-relaxed">
            <span class="font-bold text-zinc-700 uppercase tracking-tighter mr-1 text-[9px]">Designer Tip:</span> 
            Global settings apply to the whole Form. The Intro banner is often used for warnings or reminders.
          </p>
        </div>
      </div>
    }
    @else if (section()) {
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4 animate-in fade-in duration-300">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-2 py-1 rounded">Section Settings</span>
        </div>

        <!-- Label -->
        <div>
          <label class="ui-label">Section Label (Optional)</label>
          <input class="ui-input" [ngModel]="section()!.label" (ngModelChange)="state.updateSectionLabel(section()!.id, $event)" placeholder="e.g. Basic Details">
        </div>

        <!-- Description -->
        <div>
          <label class="ui-label">Section Description (Optional)</label>
          <textarea class="ui-textarea text-xs" rows="2" [ngModel]="section()!.description" (ngModelChange)="state.updateSectionDescription(section()!.id, $event)" placeholder="Help help for this section..."></textarea>
        </div>

        <!-- Depends On -->
        <div>
          <label class="ui-label">Depends On <span class="text-zinc-400">(JS expression)</span></label>
          <input class="ui-input font-mono text-xs" 
            [ngModel]="section()!.depends_on" 
            (ngModelChange)="state.updateSectionDependsOn(section()!.id, $event)"
            placeholder="doc.status === 'Active'">
          <p class="text-[11px] text-zinc-400 mt-1">Section is visible when this expression is truthy</p>
        </div>

        <!-- Columns -->
        <div>
          <label class="ui-label text-zinc-400">Layout Columns</label>
          <div class="flex bg-zinc-100 p-1 rounded-lg gap-1">
            <button (click)="state.updateSectionColumns(section()!.id, 1)" 
              class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5"
              [class.bg-white]="section()!.columns_count === 1"
              [class.shadow-sm]="section()!.columns_count === 1"
              [class.text-indigo-600]="section()!.columns_count === 1"
              [class.text-zinc-500]="section()!.columns_count !== 1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
              Single
            </button>
            <button (click)="state.updateSectionColumns(section()!.id, 2)" 
              class="flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5"
              [class.bg-white]="section()!.columns_count !== 1"
              [class.shadow-sm]="section()!.columns_count !== 1"
              [class.text-indigo-600]="section()!.columns_count !== 1"
              [class.text-zinc-500]="section()!.columns_count === 1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="18" rx="1" /><rect x="13" y="3" width="8" height="18" rx="1" /></svg>
              Double
            </button>
          </div>
        </div>

        <div class="ui-sep"></div>

        <!-- Delete -->
        <button (click)="state.removeSection(section()!.id)" class="ui-btn-destructive w-full justify-center">
          Remove Section
        </button>
      </div>
    } @else if (field()) {
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <!-- Field Type Badge -->
        <div class="flex items-center gap-2">
          <span class="ui-badge-indigo">{{ field()!.fieldtype }}</span>
          <span class="text-xs text-zinc-400 font-mono">{{ field()!.id }}</span>
        </div>

        <!-- Label -->
        <div>
          <label class="ui-label">Label</label>
          <input class="ui-input" 
            [value]="field()!.label" 
            (input)="update('label', $any($event.target).value)">
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
              {{ field()!.fieldtype === 'Select' ? 'Options (one per line)' : 'Linked Document' }}
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

        <!-- Button Style (only for Button) -->
        @if (field()!.fieldtype === 'Button') {
          <div>
            <label class="ui-label">Button Style</label>
            <div class="grid grid-cols-2 gap-2">
              @for (style of ['primary', 'secondary', 'danger', 'ghost']; track style) {
                <button (click)="update('options', style)"
                  class="px-2 py-1.5 rounded border text-[10px] font-semibold transition-all capitalize"
                  [class.border-indigo-600]="field()!.options === style"
                  [class.bg-indigo-50]="field()!.options === style"
                  [class.text-indigo-600]="field()!.options === style"
                  [class.border-zinc-200]="field()!.options !== style"
                  [class.text-zinc-500]="field()!.options !== style"
                >
                  {{ style }}
                </button>
              }
            </div>
          </div>
        }

        <!-- Text Editor Content (only for Text Editor) -->
        @if (field()!.fieldtype === 'Text Editor') {
          <div>
            <label class="ui-label">Initial Content (HTML)</label>
            <textarea class="ui-textarea font-mono leading-normal h-40" 
              [ngModel]="field()!.options" (ngModelChange)="update('options', $event)" 
              placeholder="&lt;p&gt;Hello world&lt;/p&gt;"></textarea>
            <p class="text-[9px] text-zinc-400">This content will be shown when the form loads.</p>
          </div>
        }

        <!-- Table Column Configurator (only for Table) -->
        @if (field()!.fieldtype === 'Table') {
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="ui-label !mb-0">Table Columns</label>
              <button (click)="state.addTableColumn(field()!.id)" class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100">+ Add Column</button>
            </div>

            <div class="space-y-2">
              @for (col of field()!.table_fields; track col.id) {
                <div class="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2 relative group/col">
                  <button (click)="state.removeTableColumn(field()!.id, col.id)" 
                    class="absolute right-2 top-2 opacity-0 group-hover/col:opacity-100 text-zinc-400 hover:text-red-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-zinc-400 uppercase">Label</label>
                      <input class="ui-input !p-1.5 !text-[11px]" [ngModel]="col.label" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { label: $event, fieldname: slugify($event) })">
                    </div>
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-zinc-400 uppercase">Fieldname</label>
                      <input class="ui-input !p-1.5 !text-[11px] font-mono" [ngModel]="col.fieldname" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { fieldname: $event })">
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                      <label class="text-[9px] font-bold text-zinc-400 uppercase">Type</label>
                      <select class="ui-select !p-1.5 !text-[11px]" [ngModel]="col.fieldtype" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { fieldtype: $any($event) })">
                        @for (t of tableChildTypes; track t) {
                          <option [value]="t">{{ t }}</option>
                        }
                      </select>
                    </div>
                    <div class="flex items-center h-full pt-4">
                      <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" class="w-3 h-3 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" [ngModel]="col.mandatory" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { mandatory: $event })">
                        <span class="text-[10px] font-medium text-zinc-600 uppercase">Mandatory</span>
                      </label>
                    </div>
                  </div>

                  <!-- Options for Table Column (Select/Link) -->
                  @if (col.fieldtype === 'Select' || col.fieldtype === 'Link') {
                  <div class="space-y-1 pt-1">
                    <label class="text-[9px] font-bold text-zinc-400 uppercase">
                      {{ col.fieldtype === 'Select' ? 'Options (one per line)' : 'Linked Document' }}
                    </label>
                    @if (col.fieldtype === 'Select') {
                      <textarea class="ui-textarea !p-1.5 !text-[11px] font-mono" rows="2" 
                        [ngModel]="col.options" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { options: $event })"
                        placeholder="Option 1&#10;Option 2">
                      </textarea>
                    } @else {
                      <input class="ui-input !p-1.5 !text-[11px]" [ngModel]="col.options" 
                        (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { options: $event })" 
                        placeholder="e.g. Customer">
                    }
                  </div>
                  }
                </div>
              }
            </div>
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

          <!-- Regex Validator -->
          <div class="space-y-1.5 pt-2 border-t border-zinc-100">
            <div class="flex items-center justify-between">
              <label class="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Regex Validator</label>
              <span class="text-[9px] text-zinc-400 font-mono">superpower</span>
            </div>
            <input 
              type="text" 
              [ngModel]="field()!.regex" 
              (ngModelChange)="update('regex', $event)" 
              placeholder="e.g. ^\\d+$"
              class="ui-input font-mono text-xs py-2 bg-indigo-50/30 border-indigo-100 focus:border-indigo-300"
            >
            <p class="text-[9px] text-zinc-400 italic">Enforces validation at runtime</p>
          </div>
        </div>

        <div class="ui-sep"></div>

        <!-- Depends On -->
        <div>
          <label class="ui-label">Depends On <span class="text-zinc-400">(JS expression)</span></label>
          <input class="ui-input font-mono text-xs" 
            [ngModel]="field()!.depends_on" 
            (ngModelChange)="update('depends_on', $event)"
            placeholder="doc.status === 'Active'">
          <p class="text-[11px] text-zinc-400 mt-1">Field is visible when this expression is truthy</p>
        </div>

        <!-- mandatory_depends_on -->
        <div>
          <label class="ui-label">Mandatory Depends On <span class="text-zinc-400">(JS expression)</span></label>
          <input class="ui-input font-mono text-xs" 
            [ngModel]="field()!.mandatory_depends_on" 
            (ngModelChange)="update('mandatory_depends_on', $event)"
            placeholder="doc.priority === 'High'">
        </div>

        <!-- Help Accordion -->
        <div class="ui-sep"></div>
        <div class="mt-2">
          <details class="group border border-zinc-200 rounded-lg overflow-hidden">
            <summary class="flex items-center justify-between px-3 py-2 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors list-none">
              <span class="text-xs font-semibold text-zinc-600 uppercase tracking-tight">Help & Documentation</span>
              <svg class="w-4 h-4 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div class="p-3 bg-white space-y-4 text-[11px] text-zinc-600 leading-relaxed">
              <!-- Field State Examples -->
              <div>
                <p class="font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  UI Manipulation (API)
                </p>
                <div class="bg-zinc-900 text-indigo-300 p-2 rounded font-mono text-[10px] space-y-1 overflow-x-auto">
                  <div><span class="text-zinc-500">// Read Only / Hidden</span></div>
                  <div>frm.set_df_property('fieldname', 'read_only', 1);</div>
                  <div>frm.set_df_property('fieldname', 'hidden', 1);</div>
                  <div><span class="text-zinc-500">// Change Label / Desc</span></div>
                  <div>frm.set_df_property('fieldname', 'label', 'New Name');</div>
                </div>
              </div>

              <!-- Event Snippets -->
              <div>
                <p class="font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Event Listeners
                </p>
                <div class="bg-zinc-900 text-indigo-300 p-2 rounded font-mono text-[10px] space-y-2 overflow-x-auto">
                  <div><span class="text-zinc-500">// Runs on form load</span>
                  <br>frm.on('refresh', () => {{ '{' }} ... {{ '}' }});</div>
                  <div><span class="text-zinc-500">// Runs on field change</span>
                  <br>frm.on('fieldname', (val, frm) => {{ '{' }} ... {{ '}' }});</div>
                </div>
              </div>

              <!-- Dialogs -->
              <div>
                <p class="font-bold text-zinc-800 mb-1.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Prompts & Alerts
                </p>
                 <div class="bg-zinc-900 text-indigo-300 p-2 rounded font-mono text-[10px] space-y-2 overflow-x-auto">
                   <div>frm.msgprint('Success!', 'success');</div>
                   <div>frm.prompt([
                     <br>&nbsp;&nbsp;{{ '{' }} label: 'Name', fieldname: 'n', fieldtype: 'Data' {{ '}' }}
                     <br>], (v) => ..., 'Dialog Title');</div>
                 </div>
              </div>
            </div>
          </details>
        </div>

        <!-- Delete field -->
        <button (click)="deleteField()" class="ui-btn-destructive w-full justify-center mt-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" /> <path d="M19 6l-1 14H6L5 6" />
          </svg>
          Remove Field
        </button>
      </div>
    }
  </div>
  `
})
export class PropertyEditorComponent {
  state = inject(BuilderStateService);
  field = this.state.selectedField;
  section = this.state.selectedSection;
  fieldTypes = FIELD_TYPES;
  tableChildTypes = ['Data', 'Int', 'Float', 'Text', 'Select', 'Link', 'Check', 'Date', 'Password'];
  actionButtonIds: Array<'save' | 'submit' | 'approve' | 'decline'> = ['save', 'submit', 'approve', 'decline'];

  getActionConfig(id: string) {
    return (this.state.document().actions as any)?.[id];
  }

  toggles: Array<{ label: string; prop: keyof DocumentField }> = [
    { label: 'Mandatory / Required', prop: 'mandatory' },
    { label: 'Hidden', prop: 'hidden' },
    { label: 'Read Only', prop: 'read_only' },
  ];

  introColors: Array<'blue' | 'orange' | 'red' | 'green' | 'yellow' | 'gray'> = ['blue', 'orange', 'red', 'green', 'yellow', 'gray'];

  getIntroPreviewClass(c: string) {
    const classes: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600',
      orange: 'bg-amber-50 text-amber-600',
      red: 'bg-red-50 text-red-600',
      green: 'bg-emerald-50 text-emerald-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      gray: 'bg-zinc-100 text-zinc-600'
    };
    return classes[c];
  }

  updateFormMetadata(metadata: any) {
    this.state.setDocumentMetadata(metadata);
  }

  update(prop: keyof DocumentField, value: any) {
    const f = this.field();
    if (!f) return;

    const patches: Partial<DocumentField> = { [prop]: value };

    // Auto-slug fieldname from label
    if (prop === 'label') {
      const oldSlugBase = this.slugify(f.label);
      const isAutoSlug = !f.fieldname || f.fieldname === oldSlugBase ||
        new RegExp(`^${oldSlugBase}_\\d+$`).test(f.fieldname);

      if (isAutoSlug) {
        const match = f.fieldname?.match(/_(\d+)$/);
        const suffix = match ? match[0] : '';
        patches.fieldname = this.slugify(value) + suffix;
      }
    }

    this.state.updateField(f.id, patches);
  }

  public slugify(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '_')
      .replace(/^-+|-+$/g, '');
  }

  toggle_val(prop: keyof DocumentField) {
    const f = this.field();
    if (f) this.state.updateField(f.id, { [prop]: !f[prop] });
  }

  deleteField() {
    const f = this.field();
    if (f) this.state.removeField(f.id);
  }
}
