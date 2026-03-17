import { Component, effect, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { DocumentDefinition, DocumentField, DocumentSection } from '../../models/document.model';
import { VfFormContext } from '../../services/form-context';
import { VfUtilityService } from '../../services/app-utility.service';

import { VfField } from '../form-field.component';

@Component({
  selector: 'vf-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule, VfField],
  providers: [VfFormContext],
  template: `
    <div class="w-full max-w-[1400px] mx-auto py-8 px-4">
      <div class="card bg-white shadow-2xl">
        <!-- Combined Sticky Header (Frappe style) -->
        <div
          class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-8 py-5 flex items-center justify-between rounded-t-[1.5rem]">
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold text-zinc-900 tracking-tight">{{ document.name }}</h2>
              @if (ctx.isReadOnly()) {
                <span
                  class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-100 uppercase tracking-tighter">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect
                    x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Read Only
                </span>
              }
              <span
                class="px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-500 font-mono text-[10px] tracking-widest uppercase">
                {{ document.version || 'v1.0.0' }}
              </span>
            </div>
            @if (document.description || document.module) {
              <div class="flex items-center gap-1.5 opacity-60">
                @if (document.module) {
                  <span
                    class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-r border-zinc-200 pr-2">{{ document.module }}</span>
                }
                @if (document.description) {
                  <span class="text-[11px] text-zinc-400 leading-tight max-w-2xl">{{ document.description }}</span>
                }
              </div>
            }
          </div>
          <div class="flex items-center gap-2">
            <!-- Custom Buttons -->
            @for (btn of ctx.customButtons(); track btn.id) {
              <button (click)="btn.action()"
                      [disabled]="disabled || (ctx.isReadOnly() && btn.disable_on_readonly !== false)"
                      [class]="'px-4 py-2 text-sm font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ' + getButtonClass(btn.type)">
                {{ btn.label }}
              </button>
            }

            <!-- Default Actions (shown unless showActions=false) -->
            @if (showActions && (!document.is_stepper || isLastStep)) {
              @if (ctx.actionsConfig()?.save?.visible !== false) {
                <button (click)="onAction('save')"
                        [disabled]="disabled || (ctx.isReadOnly() && ctx.actionsConfig()?.save?.disable_on_readonly !== false)"
                        class="px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {{ draftLabel || ctx.actionsConfig()?.save?.label || 'Save' }}
                </button>
              }
              @if (ctx.actionsConfig()?.submit?.visible !== false) {
                <button (click)="onAction('submit')"
                        [disabled]="disabled || (ctx.isReadOnly() && ctx.actionsConfig()?.submit?.disable_on_readonly !== false)"
                        class="ui-btn-primary px-6 py-2 text-sm shadow-indigo-100 shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
                  {{ submitLabel || ctx.actionsConfig()?.submit?.label || 'Submit' }}
                </button>
              }
            }
          </div>
        </div>

        <div class="p-8">

          <!-- System Intro (Static) -->
          @if (document.intro_text && !ctx.dynamicIntro()) {
            <div class="mb-8 p-5 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-500"
                 [ngClass]="getIntroClass(document.intro_color || 'gray')">
              <div class="flex gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     class="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <div class="text-[13px] leading-relaxed" [innerHTML]="document.intro_text"></div>
              </div>
            </div>
          }

          <!-- Dynamic Intro (Scripted) -->
          @if (ctx.dynamicIntro()) {
            <div class="mb-8 p-5 rounded-xl border shadow-sm animate-in zoom-in-95 duration-300"
                 [ngClass]="getIntroClass(ctx.dynamicIntro()!.color)">
              <div class="flex gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     class="shrink-0 mt-0.5">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="text-[13px] font-medium leading-relaxed" [innerHTML]="ctx.dynamicIntro()!.message"></div>
              </div>
            </div>
          }

          @if (document.is_stepper && document.steps?.length) {
            <!-- Stepper UI -->
            <div class="mb-10">
              <!-- Progress Bar -->
              <div class="flex items-center justify-between mb-8 px-4">
                @for (step of document.steps; track step.id; let i = $index) {
                  <div class="flex flex-col items-center gap-2 flex-1 relative">
                    <!-- Line -->
                    @if (i > 0) {
                      <div class="absolute right-[50%] top-4 w-full h-[2px] -z-10 transition-colors duration-500"
                           [class.bg-indigo-600]="i <= ctx.currentStepIndex()"
                           [class.bg-zinc-100]="i > ctx.currentStepIndex()"></div>
                    }

                    <button (click)="i < ctx.currentStepIndex() ? ctx.go_to_step(i) : null"
                            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2"
                            [class.bg-indigo-600]="i <= ctx.currentStepIndex()"
                            [class.border-indigo-600]="i <= ctx.currentStepIndex()"
                            [class.text-white]="i <= ctx.currentStepIndex()"
                            [class.bg-white]="i > ctx.currentStepIndex()"
                            [class.border-zinc-200]="i > ctx.currentStepIndex()"
                            [class.text-zinc-400]="i > ctx.currentStepIndex()"
                            [class.shadow-lg]="i === ctx.currentStepIndex()"
                            [class.shadow-indigo-100]="i === ctx.currentStepIndex()">
                       @if (i < ctx.currentStepIndex()) {
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                       } @else {
                         {{ i + 1 }}
                       }
                    </button>
                    <span class="text-[10px] font-bold uppercase tracking-widest transition-colors duration-300"
                          [class.text-indigo-600]="i === ctx.currentStepIndex()"
                          [class.text-zinc-400]="i !== ctx.currentStepIndex()">
                      {{ step.title }}
                    </span>
                  </div>
                }
              </div>

              <!-- Current Step Content -->
              <div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div class="mb-6">
                  <h3 class="text-lg font-bold text-zinc-900">{{ document.steps![ctx.currentStepIndex()].title }}</h3>
                  @if (document.steps![ctx.currentStepIndex()].description) {
                    <p class="text-xs text-zinc-500 mt-1">{{ document.steps![ctx.currentStepIndex()].description }}</p>
                  }
                </div>

                @for (section of document.steps![ctx.currentStepIndex()].sections; track section.id) {
                   <ng-container *ngTemplateOutlet="sectionTemplate; context: { $implicit: section }"></ng-container>
                }
              </div>

              <!-- Stepper Navigation Footer -->
              <div class="mt-12 pt-8 border-t border-zinc-100 flex items-center justify-between">
                <button (click)="ctx.prev_step()"
                        [disabled]="ctx.currentStepIndex() === 0"
                        class="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all disabled:opacity-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Back
                </button>

                <div class="flex items-center gap-3">
                  @if (ctx.currentStepIndex() < document.steps!.length - 1) {
                    <button (click)="nextStepWithValidation()"
                            class="ui-btn-primary px-8 py-2.5 text-sm flex items-center gap-2 shadow-indigo-100 shadow-xl active:scale-95 transition-all">
                      Continue
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  } @else {
                    @if (showActions && ctx.actionsConfig()?.submit?.visible !== false) {
                      <button (click)="onAction('submit')"
                              [disabled]="disabled || (ctx.isReadOnly() && ctx.actionsConfig()?.submit?.disable_on_readonly !== false)"
                              class="ui-btn-primary px-10 py-2.5 text-sm shadow-indigo-100 shadow-xl active:scale-95 transition-all">
                        {{ submitLabel || ctx.actionsConfig()?.submit?.label || 'Complete Submission' }}
                      </button>
                    }
                  }
                </div>
              </div>
            </div>
          } @else {
            <!-- Flat Sections (Original) -->
            <div class="space-y-6">
              @for (section of document.sections; track section.id) {
                <ng-container *ngTemplateOutlet="sectionTemplate; context: { $implicit: section }"></ng-container>
              }
            </div>
          }

        </div>

        <ng-template #sectionTemplate let-section>
          @if (!ctx.getSectionSignal(section.id, 'hidden')()) {
            <div class="section-card bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  <!-- Section Header (Clickable if collapsible) -->
                  <div class="px-6 py-5 flex items-center justify-between gap-4 transition-all bg-zinc-50/30 border-b border-transparent"
                       [class.border-zinc-100]="!ctx.getSectionSignal(section.id, 'collapsed')()"
                       [class.cursor-pointer]="section.collapsible"
                       (click)="section.collapsible ? toggleSection(section.id) : null">
                    
                    <div class="space-y-1">
                      @if (section.label) {
                        <h3 class="text-xs font-bold text-zinc-900 uppercase tracking-wider transition-colors"
                            [class.text-indigo-600]="section.collapsible && !ctx.getSectionSignal(section.id, 'collapsed')()">
                          {{ section.label }}
                        </h3>
                      }
                      @if (section.description) {
                        <p class="text-[11px] text-zinc-400 italic leading-snug">{{ section.description }}</p>
                      }
                    </div>

                    @if (ctx.getSectionSignal(section.id, 'collapsible')()) {
                      <div class="w-7 h-7 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 transition-all shadow-xs"
                           [class.rotate-180]="ctx.getSectionSignal(section.id, 'collapsed')()">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </div>
                    }
                  </div>

                  <!-- Collapsible Content Area -->
                  <div class="grid transition-all duration-500 ease-in-out"
                       [style.grid-template-rows]="ctx.getSectionSignal(section.id, 'collapsed')() ? '0fr' : '1fr'"
                       [class.opacity-0]="ctx.getSectionSignal(section.id, 'collapsed')()"
                       [class.pointer-events-none]="ctx.getSectionSignal(section.id, 'collapsed')()">
                    <div class="overflow-hidden">
                      <div class="p-6">
                        <div class="flex flex-wrap -mx-3">
                          @for (col of section.columns; track col.id) {
                            <div class="px-3" [ngClass]="getColumnClass(section)">
                              <div class="space-y-6">
                                @for (field of col.fields; track field.id) {
                                  @if (!ctx.getFieldSignal(field.fieldname, 'hidden')()) {
                                    <div class="field-group transition-all duration-200">
                                      <div class="relative group/input"
                                           [class.regex-error]="field.regex && formData[field.fieldname] && !isValidRegex(field.fieldname, field.regex)">
                                        @if (field.fieldtype === 'Table') {
                                          <div class="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div class="overflow-x-auto">
                                              <!-- Table -->
                                              <table class="w-full text-left border-collapse">
                                                <thead>
                                                <tr class="bg-zinc-50/80 border-b border-zinc-200">
                                                  <th
                                                    class="p-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-12 text-center">
                                                    #
                                                  </th>
                                                  @for (col of (ctx.getFieldSignal(field.fieldname, 'table_fields')() || []).slice(0, 6); track col.id) {
                                                    @if (!col.hidden) {
                                                      <th
                                                        class="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                                        {{ col.label }}
                                                        @if (col.mandatory) {
                                                          <span class="text-red-500">*</span>
                                                        }
                                                      </th>
                                                    }
                                                  }
                                                  @if ((field.table_fields?.length ?? 0) > 6) {
                                                    <th
                                                      class="p-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
                                                      +{{ field.table_fields!.length - 6 }} more
                                                    </th>
                                                  }
                                                  <th class="p-3 w-20"></th>
                                                </tr>
                                                </thead>
                                                <tbody class="divide-y divide-zinc-100">
                                                  @for (row of formData[field.fieldname]; track $index) {
                                                    <tr class="hover:bg-zinc-50/50 transition-colors group/row">
                                                      <td
                                                        class="p-3 text-center text-[11px] font-mono text-zinc-400">{{ $index + 1 }}
                                                      </td>
                                                      @for (col of (ctx.getFieldSignal(field.fieldname, 'table_fields')() || []).slice(0, 6); track col.id) {
                                                        @if (!col.hidden) {
                                                          <td class="p-2 relative group/cell" 
                                                              [class.cursor-pointer]="['Text', 'Text Editor', 'Attach', 'Signature', 'Datetime'].includes(col.fieldtype)"
                                                              (click)="['Text', 'Text Editor', 'Attach', 'Signature', 'Datetime'].includes(col.fieldtype) ? editTableRow(field, $index) : null">
                                                            <vf-field
                                                              [field]="col"
                                                              [(value)]="row[col.fieldname]"
                                                              (valueChange)="onFieldChange(field.fieldname)"
                                                              [compact]="true"
                                                              [hideLabel]="true">
                                                            </vf-field>
                                                            @if (!['Data', 'Int', 'Float', 'Check', 'Select', 'Link', 'Date', 'Time'].includes(col.fieldtype)) {
                                                              <button (click)="$event.stopPropagation(); editTableRow(field, $index)" 
                                                                      class="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover/cell:opacity-100 transition-all bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-100">
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                                              </button>
                                                            }
                                                          </td>
                                                        }
                                                      }
                                                      @if ((field.table_fields?.length ?? 0) > 6) {
                                                        <td class="p-2 text-zinc-300 text-[10px] italic">...</td>
                                                      }
                                                      <td class="p-2 text-right flex items-center justify-end gap-1">
                                                        <button (click)="editTableRow(field, $index)"
                                                                class="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                               stroke="currentColor" stroke-width="2">
                                                            @if (!ctx.isReadOnly()) {
                                                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                            } @else {
                                                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                              <circle cx="12" cy="12" r="3"/>
                                                            }
                                                          </svg>
                                                        </button>
                                                        @if (!ctx.isReadOnly()) {
                                                          <button (click)="removeTableRow(field.fieldname, $index)"
                                                                  [disabled]="ctx.isReadOnly()"
                                                                  class="p-1.5 rounded-md text-zinc-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-0 opacity-0 group-hover/row:opacity-100 transition-all">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                                 stroke="currentColor" stroke-width="2.5">
                                                              <line x1="18" y1="6" x2="6" y2="18"></line>
                                                              <line x1="6" y1="6" x2="18" y2="18"></line>
                                                            </svg>
                                                          </button>
                                                        }
                                                      </td>
                                                    </tr>
                                                  }
                                                  @if (!formData[field.fieldname]?.length) {
                                                    <tr>
                                                      <td
                                                        [attr.colspan]="Math.min(field.table_fields?.length ?? 0, 6) + ((field.table_fields?.length ?? 0) > 6 ? 3 : 2)"
                                                        class="p-8 text-center">
                                                        <div class="flex flex-col items-center gap-2">
                                                          <div
                                                            class="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                                                 stroke="currentColor" stroke-width="2">
                                                              <path d="M12 5v14M5 12h14"/>
                                                            </svg>
                                                          </div>
                                                          <p class="text-[12px] text-zinc-400 font-medium">No rows added
                                                            yet</p>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  }
                                                </tbody>
                                              </table>
                                            </div>
                                            @if (!ctx.isReadOnly()) {
                                              <div class="p-3 bg-zinc-50/50 border-t border-zinc-200">
                                                <button (click)="addTableRow(field.fieldname)"
                                                        class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
                                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                                       stroke="currentColor" stroke-width="3">
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                  </svg>
                                                  Add Row
                                                </button>
                                              </div>
                                            }
                                          </div>
                                        } @else {
                                          <vf-field
                                            [field]="field"
                                            [(value)]="formData[field.fieldname]"
                                            (valueChange)="onFieldChange(field.fieldname)">
                                          </vf-field>
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
                    </div>
                  </div>
                </div>
              }
        </ng-template>

        <!-- Submit placeholder (Bottom) -->
        <div class="px-8 pb-10 flex items-center justify-center">
          <p class="text-[10px] text-zinc-300 font-medium uppercase tracking-[0.3em]">End of Form</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .card {
      border-radius: 1.5rem;
      box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.1);
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

    .grid {
      transition: grid-template-rows 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
    }
  `]
})
export class VfRenderer implements OnInit, OnChanges, OnDestroy {
  @Input() document!: DocumentDefinition;
  @Input() initialData?: Record<string, any>;
  @Input() readonly?: boolean;
  @Input() showActions: boolean = true;
  @Input() submitLabel?: string;
  @Input() draftLabel?: string;
  @Input() disabled: boolean = false;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() formDraft = new EventEmitter<any>();
  @Output() formChange = new EventEmitter<{ fieldname: string; value: any; data: Record<string, any> }>();
  @Output() formError = new EventEmitter<string[]>();
  @Output() formReady = new EventEmitter<VfFormContext>();

  formData: any = {};
  ctx = inject(VfFormContext);
  utils = inject(VfUtilityService);

  get isLastStep(): boolean {
    if (!this.document.is_stepper || !this.document.steps) return true;
    return this.ctx.currentStepIndex() === this.document.steps.length - 1;
  }

  constructor() {
    effect(() => {
      this.evaluateDependsOn();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.initForm();
    this.ctx.initialize(this.document, this.formData);
    if (this.readonly) {
      this.ctx.set_readonly(true);
    }
    this.ctx.execute(this.document.client_script || '', 'refresh');
    this.ctx.trigger('refresh');
    this.formReady.emit(this.ctx);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['readonly'] && !changes['readonly'].firstChange) {
      this.ctx.set_readonly(!!this.readonly);
    }
    if (changes['initialData'] && !changes['initialData'].firstChange && this.initialData) {
      Object.assign(this.formData, this.initialData);
      this.initForm();
    }
  }

  ngOnDestroy() {
    this.ctx.destroy();
  }

  private initForm() {
    const rawData = { ...(this.initialData || {}), ...this.formData };
    this.formData = {};

    const allSections: DocumentSection[] = [];
    if (this.document.is_stepper && this.document.steps) {
      this.document.steps.forEach(s => allSections.push(...s.sections));
    } else if (this.document.sections) {
      allSections.push(...this.document.sections);
    }

    allSections.forEach((s: DocumentSection) => {
      s.columns.forEach((c) => {
        c.fields.forEach((f: DocumentField) => {
          const path = f.data_group ? `${f.data_group}.${f.fieldname}` : f.fieldname;
          let val = this.utils.getDeepValue(rawData, path);
          if (val === undefined) val = rawData[f.fieldname];

          if (f.fieldtype === 'Table') {
            const defaultRows = val || f.default || [];
            this.formData[f.fieldname] = defaultRows.map((r: any, i: number) => ({
              ...r,
              idx: i
            }));
          } else if (f.fieldtype === 'Check') {
            this.formData[f.fieldname] = val !== undefined ? (val ? 1 : 0) : (f.default ? 1 : 0);
          } else {
            this.formData[f.fieldname] = val !== undefined ? val : (f.default !== undefined ? f.default : '');
          }
        });
      });
    });
    this.ctx.valueUpdateSignal.update(n => n + 1);
  }

  onFieldChange(fieldname: string, val?: any) {
    if (val !== undefined) {
      this.formData[fieldname] = val;
    }
    this.ctx.triggerChange(fieldname, this.formData[fieldname]);
    this.formChange.emit({
      fieldname,
      value: this.formData[fieldname],
      data: { ...this.formData }
    });
  }

  validateForm(): boolean {
    const invalidFields: string[] = [];
    const allSections: DocumentSection[] = [];
    if (this.document.is_stepper && this.document.steps) {
      this.document.steps.forEach(s => allSections.push(...s.sections));
    } else {
      allSections.push(...this.document.sections);
    }

    allSections.forEach((s: DocumentSection) => {
      if (this.ctx.getSectionSignal(s.id, 'hidden')()) return;
      s.columns.forEach((c) => {
        c.fields.forEach((f: DocumentField) => {
          if (this.ctx.getFieldSignal(f.fieldname, 'hidden')()) return;
          const isMandatory = this.ctx.getFieldSignal(f.fieldname, 'mandatory')();
          const val = this.formData[f.fieldname];

          if (isMandatory && (val === undefined || val === null || val === '')) {
            invalidFields.push(f.fieldname);
          }

          if (f.regex && val && !this.isValidRegex(f.fieldname, f.regex)) {
            invalidFields.push(f.fieldname);
          }

          if (f.fieldtype === 'Table' && this.formData[f.fieldname]) {
            const rows = this.formData[f.fieldname] as any[];
            rows.forEach(row => {
              f.table_fields?.forEach((tf: any) => {
                const cellVal = row[tf.fieldname];
                if (tf.mandatory && (cellVal === undefined || cellVal === null || cellVal === '')) {
                  invalidFields.push(`${f.fieldname}.${tf.fieldname}`);
                }
                if (tf.regex && cellVal && !this.isValidRegex(tf.fieldname, tf.regex, cellVal)) {
                  invalidFields.push(`${f.fieldname}.${tf.fieldname}`);
                }
              });
            });
          }
        });
      });
    });

    if (invalidFields.length > 0) {
      this.utils.show_alert('Please fill in all mandatory fields correctly before staying.', 'error');
      // console.log('Invalid Fields:', invalidFields);
      this.formError.emit(invalidFields);
      return false;
    }

    const result = this.ctx.trigger('validate');
    if (result === false) {
      return false;
    }

    return true;
  }

  nextStepWithValidation() {
    if (this.validateStep()) {
      this.ctx.next_step();
    }
  }

  validateStep(): boolean {
    const currentIndex = this.ctx.currentStepIndex();
    const step = this.document.steps?.[currentIndex];
    if (!step) return true;

    const invalidFields: string[] = [];
    step.sections.forEach(s => {
      if (this.ctx.getSectionSignal(s.id, 'hidden')()) return;
      s.columns.forEach(c => {
        c.fields.forEach(f => {
          if (this.ctx.getFieldSignal(f.fieldname, 'hidden')()) return;
          const isMandatory = this.ctx.getFieldSignal(f.fieldname, 'mandatory')();
          const val = this.formData[f.fieldname];

          if (isMandatory && (val === undefined || val === null || val === '')) {
            invalidFields.push(f.fieldname);
          }

          if (f.regex && val && !this.isValidRegex(f.fieldname, f.regex)) {
            invalidFields.push(f.fieldname);
          }

          if (f.fieldtype === 'Table' && this.formData[f.fieldname]) {
            const rows = this.formData[f.fieldname] as any[];
            rows.forEach(row => {
              f.table_fields?.forEach((tf: any) => {
                const cellVal = row[tf.fieldname];
                if (tf.mandatory && (cellVal === undefined || cellVal === null || cellVal === '')) {
                  invalidFields.push(`${f.fieldname}.${tf.fieldname}`);
                }
                if (tf.regex && cellVal && !this.isValidRegex(tf.fieldname, tf.regex, cellVal)) {
                  invalidFields.push(`${f.fieldname}.${tf.fieldname}`);
                }
              });
            });
          }
        });
      });
    });

    if (invalidFields.length > 0) {
      this.utils.show_alert('Please fill in all mandatory fields before proceeding.', 'error');
      this.formError.emit(invalidFields);
      return false;
    }
    return true;
  }

  saveDraft() {
    const packed = this.packData();
    this.formDraft.emit(packed);
    this.utils.show_alert('Draft saved successfully', 'success');
  }

  submit() {
    if (this.validateForm()) {
      const packed = this.packData();
      this.formSubmit.emit(packed);
      this.utils.show_alert('Form submitted successfully', 'success');
    }
  }

  private packData(): any {
    const packedData: any = {};
    const allSections: DocumentSection[] = [];
    if (this.document.is_stepper && this.document.steps) {
      this.document.steps.forEach(s => allSections.push(...s.sections));
    } else {
      allSections.push(...this.document.sections);
    }

    allSections.forEach((s: DocumentSection) => {
      s.columns.forEach((c) => {
        c.fields.forEach((f: DocumentField) => {
          if (f.fieldtype === 'Button') return;
          const val = this.formData[f.fieldname];
          const path = f.data_group ? `${f.data_group}.${f.fieldname}` : f.fieldname;
          this.utils.setDeepValue(packedData, path, val);
        });
      });
    });
    return packedData;
  }

  private evaluateDependsOn() {
    // Read the signal to make this effect reactive to ANY data change
    this.ctx.valueUpdateSignal();

    const allSections: DocumentSection[] = [];
    if (this.document.is_stepper && this.document.steps) {
      this.document.steps.forEach(s => allSections.push(...s.sections));
    } else {
      allSections.push(...this.document.sections);
    }

    allSections.forEach((s: DocumentSection) => {
      s.columns.forEach((c) => {
        c.fields.forEach((f: DocumentField) => {
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

    allSections.forEach((s: DocumentSection) => {
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

  toggleSection(sectionId: string) {
    const current = this.ctx.getSectionSignal(sectionId, 'collapsed')();
    this.ctx.set_section_property(sectionId, 'collapsed', !current);
  }

  isSingleFieldSection(section: DocumentSection): boolean {
    let count = 0;
    section.columns.forEach(c => count += c.fields.length);
    return count === 1;
  }

  getColumnClass(section: DocumentSection) {
    if (this.isSingleFieldSection(section)) return 'w-full';
    const count = section.columns.length || 1;

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

  onAction(action: string) {
    if (this.disabled) return;

    if (action === 'delete') {
      // not implemented
      return;
    }

    // Both save and submit require full form validation now
    if (!this.validateForm()) return;

    if (action === 'save') {
      this.saveDraft();
    } else if (action === 'submit') {
      this.submit();
    } else {
      const config = (this.ctx.actionsConfig() as any)?.[action.toLowerCase()];
      if (config?.runtimeAction) {
        config.runtimeAction(this.ctx);
      } else if (config?.action) {
        this.ctx.execute(config.action, action);
      } else {
        this.utils.show_alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action triggered`, 'info');
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

  public readonly Math = Math;

  editTableRow(field: DocumentField, index: number) {
    const row = this.formData[field.fieldname][index];
    const tableFields = field.table_fields || [];

    const promptFields: DocumentField[] = tableFields.map(tf => ({
      id: tf.id,
      fieldname: tf.fieldname,
      label: tf.label,
      fieldtype: tf.fieldtype as any,
      mandatory: tf.mandatory,
      options: tf.options,
      regex: tf.regex,
      default: row[tf.fieldname],
      read_only: this.ctx.isReadOnly()
    }));

    this.ctx.prompt(promptFields, (values) => {
      Object.assign(row, values);
      this.onFieldChange(field.fieldname);
    }, this.ctx.isReadOnly() ? (field.label || 'Row Detail') : `Edit Row #${index + 1}`, this.ctx.isReadOnly());
  }

  addTableRow(fieldname: string) {
    this.ctx.add_row(fieldname);
  }

  removeTableRow(fieldname: string, index: number) {
    this.ctx.remove_row(fieldname, index);
  }
}
