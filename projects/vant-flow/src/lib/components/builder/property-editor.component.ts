import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VfBuilderState } from '../../services/builder-state.service';
import { DocumentField, FieldType } from '../../models/document.model';
import { VfUiPrimitivesModule } from '../../ui/ui-primitives.module';
import { VfChoiceGroup, VfChoiceOption } from './shared/choice-group.component';
import { VfToggleCard } from './shared/toggle-card.component';
import { VfEyebrow } from '../shared/eyebrow.component';

const FIELD_TYPES: FieldType[] = ['Data', 'Select', 'Link', 'Check', 'Int', 'Text', 'Text Editor', 'Table', 'Date', 'Datetime', 'Time', 'Float', 'Password', 'Button', 'Signature', 'Attach'];

@Component({
  selector: 'vf-property-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, VfUiPrimitivesModule, VfChoiceGroup, VfToggleCard, VfEyebrow],
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
          <vf-eyebrow label="Form Settings" tone="indigo"></vf-eyebrow>
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

        <!-- Stepper Toggle -->
        <div class="space-y-3 pt-2">
          <vf-toggle-card
            title="Stepper Mode"
            description="Transform this form into a multi-step wizard"
            [checked]="!!state.document().is_stepper"
            (checkedChange)="state.setDocumentMetadata({ is_stepper: $event })">
          </vf-toggle-card>
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
                      <vf-choice-group
                        [options]="buttonStyleOptions"
                        [selected]="btn.type || 'primary'"
                        [columns]="4"
                        size="sm"
                        (selectedChange)="state.updateAction(btnId, { type: $event })">
                      </vf-choice-group>
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
    @else if (field()) {
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

        <!-- Data Group -->
        @if (field()!.fieldtype !== 'Button') {
          <div>
            <label class="ui-label">Data Group <span class="text-zinc-400 font-normal">(e.g. user.profile)</span></label>
            <input class="ui-input font-mono" 
              [ngModel]="field()!.data_group" 
              (ngModelChange)="update('data_group', $event)"
              list="dataGroupOptions"
              placeholder="Flattened JSON path">
            <datalist id="dataGroupOptions">
              @for (group of state.dataGroupSuggestions(); track group) {
                <option [value]="group">{{ group }}</option>
              }
            </datalist>
            <p class="text-[9px] text-zinc-400 mt-1 italic">Groups fields into nested objects in final JSON</p>
          </div>
        }

        <!-- Field Type -->
        <div>
          <label class="ui-label">Field Type</label>
          <select class="ui-select" [ngModel]="field()!.fieldtype" (ngModelChange)="update('fieldtype', $event)">
            @for (t of fieldTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>

        <!-- Options (for Select / Attach) -->
        @if (field()!.fieldtype === 'Select' || field()!.fieldtype === 'Attach') {
          <div>
            <label class="ui-label">
              @if (field()!.fieldtype === 'Select') { Options (one per line) }
              @else { Attach Config (extensions | maxSize | maxFiles) }
            </label>
            @if (field()!.fieldtype === 'Select') {
              <textarea class="ui-textarea font-mono" rows="4" 
                [ngModel]="field()!.options" (ngModelChange)="update('options', $event)"
                placeholder="Option 1&#10;Option 2&#10;Option 3">
              </textarea>
            } @else {
              <input class="ui-input" [ngModel]="field()!.options" (ngModelChange)="update('options', $event)" 
                placeholder=".pdf,.jpg | 5MB | 1">
            }
          </div>
        }

        @if (field()!.fieldtype === 'Link') {
          <div class="space-y-4 p-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
            <div class="space-y-1">
              <label class="ui-label">Data Source Endpoint</label>
              <input class="ui-input font-mono" [ngModel]="field()!.link_config?.data_source" (ngModelChange)="updateLinkConfig({ data_source: $event })" placeholder="/api/items/search">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="ui-label">ID Field</label>
                <input class="ui-input font-mono" [ngModel]="field()!.link_config?.mapping?.id" (ngModelChange)="updateLinkConfigMapping({ id: $event })" placeholder="id">
              </div>
              <div class="space-y-1">
                <label class="ui-label">Title Field</label>
                <input class="ui-input font-mono" [ngModel]="field()!.link_config?.mapping?.title" (ngModelChange)="updateLinkConfigMapping({ title: $event })" placeholder="name">
              </div>
            </div>

            <div class="space-y-1">
              <label class="ui-label">Description Field <span class="text-zinc-400">(optional)</span></label>
              <input class="ui-input font-mono" [ngModel]="field()!.link_config?.mapping?.description" (ngModelChange)="updateLinkConfigMapping({ description: $event })" placeholder="description">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="ui-label">HTTP Method</label>
                <select class="ui-select" [ngModel]="field()!.link_config?.method || 'GET'" (ngModelChange)="updateLinkConfig({ method: $any($event) })">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="ui-label">Min Query Length</label>
                <input class="ui-input" type="number" [ngModel]="field()!.link_config?.min_query_length ?? 0" (ngModelChange)="updateLinkConfig({ min_query_length: toNumber($event) })" placeholder="0">
              </div>
            </div>

            <div class="space-y-1">
              <label class="ui-label">Filters JSON</label>
              <textarea #linkFiltersInput class="ui-textarea font-mono text-xs" rows="4" [value]="stringifyJson(field()!.link_config?.filters || {})" (change)="updateLinkFilters(linkFiltersInput.value)" placeholder="{&#10;  &quot;category&quot;: &quot;Voucher&quot;&#10;}"></textarea>
              <p class="text-[9px] text-zinc-400 italic">Stored as an object and can also be changed at runtime with <code>frm.set_filter()</code>.</p>
            </div>
          </div>
        }

        <!-- Button Style (only for Button) -->
        @if (field()!.fieldtype === 'Button') {
          <div>
            <label class="ui-label">Button Style</label>
            <vf-choice-group
              [options]="buttonStyleOptions"
              [selected]="field()!.options || 'primary'"
              [columns]="2"
              (selectedChange)="update('options', $event)">
            </vf-choice-group>
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
          <div class="ui-sep"></div>
          <details class="group/table-main border border-zinc-200 rounded-lg overflow-hidden shadow-sm" open>
            <summary class="flex items-center justify-between px-3 py-2 bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition-colors list-none">
              <span class="text-xs font-black text-zinc-500 uppercase tracking-tighter">Table Columns ({{ field()!.table_fields?.length || 0 }})</span>
              <div class="flex items-center gap-2">
                <button (click)="$event.preventDefault(); $event.stopPropagation(); state.addTableColumn(field()!.id)" 
                        class="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded hover:bg-indigo-100 border border-indigo-100/50">+ Add Column</button>
                <svg class="w-3.5 h-3.5 text-zinc-400 group-open/table-main:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </summary>
            
            <div class="p-2 bg-white space-y-1.5">
              @for (col of field()!.table_fields; track col.id) {
                <details class="group/col border border-zinc-100 rounded-md overflow-hidden shadow-sm">
                  <summary class="flex items-center justify-between px-2 py-1.5 bg-zinc-50/50 cursor-pointer hover:bg-zinc-100/50 transition-colors list-none">
                    <div class="flex items-center gap-2 min-w-0 pr-2">
                       <span class="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400 text-[8px] font-bold uppercase shrink-0">{{ col.fieldtype }}</span>
                       <span class="text-[11px] font-bold text-zinc-600 truncate">{{ col.label || 'Unnamed Column' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 opacity-60 group-hover/col:opacity-100">
                      <button (click)="$event.preventDefault(); $event.stopPropagation(); state.removeTableColumn(field()!.id, col.id)" 
                        class="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                      <svg class="w-3 h-3 text-zinc-300 group-open/col:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </summary>
                  
                  <div class="p-2 border-t border-zinc-100 bg-white space-y-2.5">
                    <div class="grid grid-cols-2 gap-2">
                      <div class="space-y-1">
                        <label class="text-[9px] font-bold text-zinc-400 uppercase">Label</label>
                        <input class="ui-input !p-1.5 !text-[11px]" 
                          [ngModel]="col.label" 
                          (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { label: $event, fieldname: slugify($event) })"
                          placeholder="Column Name">
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
                      <div class="space-y-1">
                        <label class="text-[9px] font-bold text-zinc-400 uppercase">Default</label>
                        <input class="ui-input !p-1.5 !text-[11px]" [ngModel]="col.default" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { default: $event })">
                      </div>
                    </div>

                    @if (['Select', 'Link', 'Attach'].includes(col.fieldtype)) {
                      <div class="space-y-1">
                        <label class="text-[9px] font-bold text-zinc-400 uppercase">Options / Config</label>
                        <input class="ui-input !p-1.5 !text-[11px]" [ngModel]="col.options" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { options: $event })" placeholder="config...">
                      </div>
                    }

                    <div class="flex items-center gap-4 pt-1">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" class="w-3 h-3 rounded" [ngModel]="col.mandatory" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { mandatory: $event })">
                        <span class="text-[10px] font-medium text-zinc-600">Mandatory</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" class="w-3 h-3 rounded" [ngModel]="col.hidden" (ngModelChange)="state.updateTableColumn(field()!.id, col.id, { hidden: $event })">
                        <span class="text-[10px] font-medium text-zinc-600">Hidden</span>
                      </label>
                    </div>
                  </div>
                </details>
              }
            </div>
          </details>
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
                  <div>frm.set_df_property('fieldname', 'reqd', 1);</div>
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
    @else if (section()) {
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4 animate-in fade-in duration-300">
        <div class="flex items-center gap-2">
          <vf-eyebrow label="Section Settings" tone="amber"></vf-eyebrow>
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

        <!-- Section Toggles -->
        <div class="space-y-3 pt-2">
          <vf-toggle-card
            title="Collapsible"
            description="Allow users to toggle section visibility"
            [checked]="!!section()!.collapsible"
            activeClass="border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50"
            inactiveClass="border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50"
            (checkedChange)="state.updateSectionProperty(section()!.id, 'collapsible', $event)">
          </vf-toggle-card>

          @if (section()!.collapsible) {
            <vf-toggle-card
              class="animate-in slide-in-from-top-1 duration-200"
              title="Default Collapsed"
              description="Start with section minimized"
              [checked]="!!section()!.collapsed"
              activeClass="border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50"
              inactiveClass="border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50"
              (checkedChange)="state.updateSectionProperty(section()!.id, 'collapsed', $event)">
            </vf-toggle-card>
          }
        </div>

        <div class="ui-sep"></div>

        <!-- Delete -->
        <button (click)="state.removeSection(section()!.id)" class="ui-btn-destructive w-full justify-center">
          Remove Section
        </button>
      </div>
    }
    @else if (step()) {
      <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4 animate-in fade-in duration-300">
        <div class="flex items-center gap-2">
          <vf-eyebrow label="Step Settings" tone="indigo"></vf-eyebrow>
        </div>

        <!-- Title -->
        <div>
          <label class="ui-label">Step Title</label>
          <input class="ui-input" [ngModel]="step()!.title" (ngModelChange)="state.updateStep(step()!.id, { title: $event })" placeholder="e.g. Basic Details">
        </div>

        <!-- Description -->
        <div>
          <label class="ui-label">Step Description (Optional)</label>
          <textarea class="ui-textarea text-xs" rows="2" [ngModel]="step()!.description" (ngModelChange)="state.updateStep(step()!.id, { description: $event })" placeholder="Help help for this step..."></textarea>
        </div>

        <div class="ui-sep"></div>

        <!-- Delete -->
        <button (click)="state.removeStep(step()!.id)" class="ui-btn-destructive w-full justify-center">
          Remove Step
        </button>
      </div>
    }
  </div>
  `
})
export class VfPropertyEditor {
  state = inject(VfBuilderState);
  field = this.state.selectedField;
  section = this.state.selectedSection;
  step = this.state.selectedStep;
  fieldTypes = FIELD_TYPES;
  tableChildTypes = ['Data', 'Int', 'Float', 'Text', 'Select', 'Link', 'Check', 'Date', 'Datetime', 'Time', 'Password', 'Text Editor', 'Attach', 'Signature'];
  actionButtonIds: Array<'submit'> = ['submit'];
  buttonStyleOptions: VfChoiceOption<string>[] = [
    { value: 'primary', label: 'primary' },
    { value: 'secondary', label: 'secondary' },
    { value: 'danger', label: 'danger' },
    { value: 'ghost', label: 'ghost' },
  ];

  getActionConfig(id: string) {
    return (this.state.document().actions as any)?.[id];
  }

  toggles: Array<{ label: string; prop: keyof DocumentField }> = [
    { label: 'Mandatory / Required', prop: 'mandatory' },
    { label: 'Indexed', prop: 'indexed' },
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

  updateLinkConfig(patch: Record<string, any>) {
    const f = this.field();
    if (!f) return;

    this.state.updateField(f.id, {
      link_config: {
        data_source: '',
        mapping: { id: 'id', title: 'title' },
        ...(f.link_config || {}),
        ...patch
      }
    });
  }

  updateLinkConfigMapping(patch: Record<string, any>) {
    const f = this.field();
    if (!f) return;

    this.state.updateField(f.id, {
      link_config: {
        data_source: '',
        ...(f.link_config || {}),
        mapping: {
          id: 'id',
          title: 'title',
          ...((f.link_config?.mapping || {}) as any),
          ...patch
        }
      }
    });
  }

  updateLinkFilters(raw: string) {
    const f = this.field();
    if (!f) return;

    try {
      const parsed = raw.trim() ? JSON.parse(raw) : {};
      this.updateLinkConfig({ filters: parsed });
    } catch {
      // Ignore invalid JSON while typing; the user can continue editing.
    }
  }

  stringifyJson(value: any) {
    return JSON.stringify(value ?? {}, null, 2);
  }

  toNumber(value: any) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
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
