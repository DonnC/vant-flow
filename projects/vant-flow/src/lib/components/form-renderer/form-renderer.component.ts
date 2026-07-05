import { Component, effect, EventEmitter, HostListener, inject, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { DEFAULT_FORM_ACTIONS, DocumentDefinition, DocumentField, DocumentSection, VfButtonActionContext, VfLinkDataSource, VfLinkRequestObserver, VfMediaHandler, VfMediaResolver, VfRendererButtonEvent, VfRendererChangeEvent } from '../../models/document.model';
import { VfFormContext } from '../../services/form-context';
import { VfUtilityService } from '../../services/app-utility.service';
import { getRegexPresetOption, resolveRegexPattern } from '../../utils/regex-presets';

import { VfField } from '../form-field.component';
import { VfUiPrimitivesModule } from '../../ui/ui-primitives.module';
import { VfAlertBox } from '../shared/alert-box.component';
import { VfDashedAction } from '../shared/dashed-action.component';
import { VfIconButton } from '../shared/icon-button.component';
import { VfSectionShell } from '../shared/section-shell.component';

@Component({
  selector: 'vf-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule, VfField, VfUiPrimitivesModule, VfAlertBox, VfDashedAction, VfIconButton, VfSectionShell],
  providers: [VfFormContext],
  template: `
    <div class="vf-renderer-container w-full max-w-[1600px] mx-auto py-8 px-6 flex items-start gap-10 transition-all duration-500 relative"
         [class.justify-center]="!navigatorVisible || !(showSectionNavigator || document.show_section_navigator) || allSections.length <= 1">
      
      <!-- Side Handle (shown when hidden) -->
      @if ((showSectionNavigator || document.show_section_navigator) && !navigatorVisible && allSections.length > 1) {
        <button (click)="navigatorVisible = true" 
          class="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 bg-white shadow-xl rounded-full border border-zinc-200 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-all hover:scale-110 group print:hidden"
          title="Show Navigator">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          <div class="absolute left-12 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap font-bold uppercase tracking-widest">Show Navigator</div>
        </button>
      }

      <!-- Section Navigator (Sidebar) -->
      @if ((showSectionNavigator || document.show_section_navigator) && navigatorVisible && allSections.length > 1) {
        <div class="vf-section-navigator hidden lg:block w-64 shrink-0 transition-opacity duration-300 print:hidden">
          <div class="sticky top-8 space-y-1">
             <div class="px-4 py-3 mb-2 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100 flex items-center justify-between group">
               <h4 class="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                 Sections
               </h4>
               <button (click)="navigatorVisible = false" class="text-white/60 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10" title="Collapse Navigator">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="15 18 9 12 15 6" /></svg>
               </button>
            </div>
            <div class="space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] pr-2 scrollbar-thin">
              @for (section of allSections; track section.id) {
                @if (ctx.getSectionSignal(section.id, 'hidden')() !== true) {
                  <button (click)="scrollToSection(section.id)" 
                          [class]="'w-full text-left px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 ' + (activeSectionId === section.id ? 'bg-white text-indigo-600 shadow-md ring-1 ring-zinc-200 translate-x-1' : 'text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm')">
                    {{ section.label }}
                  </button>
                }
              }
            </div>
          </div>
        </div>
      }

      <div class="vf-form-card flex-1 max-w-[1100px] min-w-0 card bg-white shadow-2xl transition-all duration-300">
        <!-- Combined Sticky Header (Frappe style) -->

        <div
          class="bg-white border-b border-zinc-100 shadow-sm px-8 py-5 flex items-center justify-between rounded-t-[1.5rem]">
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
          <div class="flex flex-wrap items-center justify-end gap-2">
            <!-- Custom Buttons -->
            @for (btn of ctx.customButtons(); track btn.id) {
              <button (click)="onCustomButtonClick(btn)"
                      [disabled]="disabled || (ctx.isReadOnly() && btn.disable_on_readonly !== false)"
                      [class]="'shrink-0 whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ' + getButtonClass(btn.type)">
                {{ btn.label }}
              </button>
            }

            <!-- Default Actions (shown unless showActions=false) -->
            @if (showActions && (!document.is_stepper || isLastStep)) {
              @if (getSubmitActionConfig().visible !== false) {
                <button (click)="onAction('submit')"
                        [disabled]="disabled || (ctx.isReadOnly() && getSubmitActionConfig().disable_on_readonly !== false)"
                        [class]="'shrink-0 whitespace-nowrap px-6 py-2 text-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ' + getButtonClass(submitButtonType())">
                  {{ submitLabel || getSubmitActionConfig().label || 'Submit' }}
                </button>
              }
            }

          </div>
        </div>


        <div class="p-8">
          @if (validationErrors.length > 0) {
            <vf-alert-box
              class="mb-8 block"
              tone="error"
              title="Please review the highlighted fields."
              message="Some required values are missing or invalid."
              dismissLabel="Dismiss"
              (dismiss)="clearValidationErrors()">
              <div class="mt-3 flex flex-wrap gap-2">
                @for (field of validationErrors; track field) {
                  <span class="rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-900">
                    {{ describeFieldError(field) }}
                  </span>
                }
              </div>
            </vf-alert-box>
          }

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
                    @if (showActions && getSubmitActionConfig().visible !== false) {
                      <button (click)="onAction('submit')"
                              [disabled]="disabled || (ctx.isReadOnly() && getSubmitActionConfig().disable_on_readonly !== false)"
                              [class]="'px-10 py-2.5 text-sm shadow-xl active:scale-95 transition-all ' + getButtonClass(submitButtonType())">
                        {{ submitLabel || getSubmitActionConfig().label || 'Submit' }}
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
            <vf-section-shell
              [id]="'section-' + section.id"
              class="section-anchor"
              [title]="section.label || ''"
              [description]="section.description || ''"
              [collapsible]="ctx.getSectionSignal(section.id, 'collapsible')()"
              [collapsed]="ctx.getSectionSignal(section.id, 'collapsed')()"
              (toggled)="toggleSection(section.id)">
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
                                        @if (isTableField(field.fieldtype)) {
                                          <div class="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div class="overflow-x-auto">
                                              <!-- Table -->
                                              <table class="min-w-full text-left border-collapse child-grid-table">
                                                <thead>
                                                <tr class="bg-zinc-50/80 border-b border-zinc-200">
                                                  <th
                                                    class="px-2 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-10 text-center">
                                                    #
                                                  </th>
                                                  @for (col of getGridTableColumns(field); track col.id) {
                                                    @if (!col.hidden) {
                                                      <th class="px-2 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider min-w-28">
                                                        {{ col.label }}
                                                        @if (col.mandatory) {
                                                          <span class="text-red-500">*</span>
                                                        }
                                                      </th>
                                                    }
                                                  }
                                                  @if (getHiddenGridColumnCount(field) > 0) {
                                                    <th
                                                      class="px-2 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">
                                                      +{{ getHiddenGridColumnCount(field) }} more
                                                    </th>
                                                  }
                                                  <th class="px-2 py-2 w-16"></th>
                                                </tr>
                                                </thead>
                                                <tbody class="divide-y divide-zinc-100">
                                                  @for (row of formData[field.fieldname]; track $index) {
                                                    <tr class="hover:bg-zinc-50/50 transition-colors group/row">
                                                      <td
                                                        class="px-2 py-1.5 text-center text-[11px] font-mono text-zinc-400">{{ $index + 1 }}
                                                      </td>
                                                      @for (col of getGridTableColumns(field); track col.id) {
                                                        @if (!col.hidden) {
                                                          <td class="px-1.5 py-1.5 relative group/cell align-middle" 
                                                              [class.cursor-pointer]="['Text', 'Text Editor', 'Attach', 'Signature', 'Datetime'].includes(col.fieldtype)"
                                                              (click)="['Text', 'Text Editor', 'Attach', 'Signature', 'Datetime'].includes(col.fieldtype) ? editTableRow(field, $index) : null">
                                                            <vf-field
                                                              [field]="col"
                                                              [(value)]="row[col.fieldname]"
                                                              (valueChange)="onFieldChange(field.fieldname)"
                                                              [mediaHandler]="mediaHandler"
                                                              [mediaResolver]="mediaResolver"
                                                              [linkDataSource]="linkDataSource"
                                                              [linkRequestObserver]="linkRequestObserver"
                                                              [formMetadata]="metadata"
                                                              [compact]="true"
                                                              [hideLabel]="true">
                                                            </vf-field>
                                                            @if (!['Data', 'Int', 'Float', 'Check', 'Select', 'Url', 'Link', 'Date', 'Time'].includes(col.fieldtype)) {
                                                              <vf-icon-button (pressed)="$event.stopPropagation(); editTableRow(field, $index)"
                                                                      class="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-all bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-100 rounded-md"
                                                                      tone="brand" [soft]="true">
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                                              </vf-icon-button>
                                                            }
                                                          </td>
                                                        }
                                                      }
                                                      @if (getHiddenGridColumnCount(field) > 0) {
                                                        <td class="px-2 py-1.5 text-zinc-300 text-[10px] italic">...</td>
                                                      }
                                                      <td class="px-1.5 py-1.5 text-right">
                                                        <div class="flex items-center justify-end gap-1">
                                                        <vf-icon-button (pressed)="editTableRow(field, $index)" tone="brand">
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
                                                        </vf-icon-button>
                                                        @if (!ctx.isReadOnly()) {
                                                          <vf-icon-button (pressed)="removeTableRow(field.fieldname, $index)"
                                                                  [disabled]="ctx.isReadOnly()"
                                                                  class="disabled:opacity-0 opacity-0 group-hover/row:opacity-100 transition-all"
                                                                  tone="danger" [soft]="true">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                                                 stroke="currentColor" stroke-width="2.5">
                                                              <line x1="18" y1="6" x2="6" y2="18"></line>
                                                              <line x1="6" y1="6" x2="18" y2="18"></line>
                                                            </svg>
                                                          </vf-icon-button>
                                                        }
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  }
                                                  @if (!formData[field.fieldname]?.length) {
                                                    <tr>
                                                      <td
                                                        [attr.colspan]="getTableEmptyStateColspan(field)"
                                                        class="px-4 py-6 text-center">
                                                        <div class="flex flex-col items-center gap-1.5">
                                                          <div
                                                            class="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
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
                                              <div class="px-2 py-2 bg-zinc-50/50 border-t border-zinc-200">
                                                <vf-dashed-action label="Add Row" [compact]="true" [fullWidth]="false" (pressed)="addTableRow(field.fieldname)"></vf-dashed-action>
                                              </div>
                                            }
                                          </div>
                                        } @else {
                                          <vf-field
                                            [field]="field"
                                            [(value)]="formData[field.fieldname]"
                                            [mediaHandler]="mediaHandler"
                                                              [mediaResolver]="mediaResolver"
                                            [linkDataSource]="linkDataSource"
                                            [linkRequestObserver]="linkRequestObserver"
                                            [formMetadata]="metadata"
                                            (valueChange)="onFieldChange(field.fieldname)">
                                          </vf-field>
                                        }

                                        <!-- Read Only Overlay if needed -->
                                        @if (shouldShowReadonlyOverlay(field)) {
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
            </vf-section-shell>
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
    }

    @media print {
      body.vf-printing > :not(vf-renderer),
      body.vf-printing > * > :not(vf-renderer),
      body.vf-printing > * > * > :not(vf-renderer) {
        display: none !important;
      }

      :host {
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
      }
      .vf-renderer-container {
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
      }
      .vf-form-card {
        max-width: 100% !important;
        width: 100% !important;
      }
      .vf-section-navigator {
        display: none !important;
      }
      .py-8 { padding-top: 0 !important; padding-bottom: 0 !important; }
      .px-4 { padding-left: 0 !important; padding-right: 0 !important; }
      .card {
        box-shadow: none !important;
        border: none !important;
        background: white !important;
        border-radius: 0 !important;
      }
      .bg-white { background-color: white !important; }
      .shadow-2xl, .shadow-sm, .shadow-xl { box-shadow: none !important; }
      .border-b { border-bottom: 1px solid #f4f4f5 !important; }
      
      /* Hide navigation components */
      .hidden.lg\:block.w-64.shrink-0 { display: none !important; }
      .flex.flex-wrap.items-center.justify-end.gap-2,
      .mt-12.pt-8.border-t.border-zinc-100 {
        display: none !important;
      }

      /* Table Print Improvements */
      .overflow-x-auto { overflow: visible !important; }
      table { width: 100% !important; table-layout: auto !important; }
      th, td { border: 1px solid #f4f4f5 !important; }

      /* Force expand all contents */
      .ql-container { height: auto !important; max-height: none !important; }
      .ql-editor { overflow: visible !important; height: auto !important; padding: 0 !important; }

      /* Page breaks */
      .vf-section-shell {
        page-break-inside: avoid;
        margin-bottom: 2rem !important;
        border: 1px solid #f4f4f5 !important; 
        display: block !important;
      }
      h2, h3 { page-break-after: avoid; }
    }
    
    .ql-frappe-style .ql-container::-webkit-resizer {
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

    .section-anchor {
      scroll-margin-top: 150px;
    }
  `]
})
export class VfRenderer implements OnInit, OnChanges, OnDestroy {
  @Input() document!: DocumentDefinition;
  @Input() initialData?: Record<string, any>;
  @Input() readonly?: boolean;
  @Input() runFormScripts: boolean = true;
  @Input() readonlyFields: string[] = [];
  @Input() hiddenFields: string[] = [];
  @Input() disabledActionButtons: string[] = [];
  @Input() hiddenActionButtons: string[] = [];
  @Input() showActions: boolean = true;
  @Input() submitLabel?: string;
  @Input() disabled: boolean = false;
  @Input() metadata?: any;
  @Input() clientScript?: string | null;
  @Input() mediaHandler?: VfMediaHandler;
  @Input() mediaResolver?: VfMediaResolver;
  @Input() linkDataSource?: VfLinkDataSource;
  @Input() linkRequestObserver?: VfLinkRequestObserver;
  @Input() showSectionNavigator = false;


  @Output() formAction = new EventEmitter<VfRendererButtonEvent>();
  @Output() formChange = new EventEmitter<VfRendererChangeEvent>();
  @Output() formError = new EventEmitter<string[]>();
  @Output() formReady = new EventEmitter<VfFormContext>();
  @ViewChildren(VfField) fieldComponents!: QueryList<VfField>;

  navigatorVisible = true;
  formData: any = {};
  validationErrors: string[] = [];
  ctx = inject(VfFormContext);
  utils = inject(VfUtilityService);

  private appliedReadonlyFields = new Set<string>();
  private appliedHiddenFields = new Set<string>();
  private appliedDisabledActionButtons = new Set<string>();
  private appliedHiddenActionButtons = new Set<string>();

  activeSectionId: string | null = null;

  get allSections(): DocumentSection[] {
    if (this.document.is_stepper && this.document.steps) {
      const activeStep = this.document.steps[this.ctx.currentStepIndex()];
      return activeStep ? activeStep.sections : [];
    }
    return this.document.sections || [];
  }

  scrollToSection(sectionId: string) {
    const el = document.getElementById('section-' + sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeSectionId = sectionId;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!(this.showSectionNavigator || this.document.show_section_navigator)) return;

    const sections = this.allSections;
    let current: string | null = null;

    for (const section of sections) {
      const el = document.getElementById('section-' + section.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        // If the top of the section is in the top part of the viewport
        if (rect.top <= 200) {
          current = section.id;
        }
      }
    }
    this.activeSectionId = current;
  }

  get isLastStep(): boolean {
    if (!this.document.is_stepper || !this.document.steps) return true;
    return this.ctx.currentStepIndex() === this.document.steps.length - 1;
  }

  getSubmitActionConfig() {
    return {
      ...DEFAULT_FORM_ACTIONS.submit!,
      ...(this.ctx.actionsConfig()?.submit || {})
    };
  }

  submitButtonType(): string {
    return this.getSubmitActionConfig().type || 'primary';
  }

  onPrint() {
    if (typeof document !== 'undefined') {
      document.body.classList.add('vf-printing');

      // Short delay to allow CSS to apply before browser captures print state
      setTimeout(() => {
        this.ctx.print();

        // Remove class after print dialog is closed
        // This is tricky as window.print() is blocking in some browsers
        // Use a longer timeout or ideally the afterprint event
        const clear = () => {
          document.body.classList.remove('vf-printing');
          window.removeEventListener('afterprint', clear);
        };
        window.addEventListener('afterprint', clear);

        // Fallback for browsers that don't support afterprint reliably
        setTimeout(clear, 1000);
      }, 100);
    }
  }

  constructor() {
    effect(() => {
      this.evaluateDependsOn();
    }, { allowSignalWrites: true });

    effect(() => {
      // Reset active section when stepper index changes
      this.ctx.currentStepIndex();
      this.activeSectionId = null;
    });
  }

  ngOnInit() {
    this.initForm();
    this.initializeRuntimeContext(true);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['runFormScripts'] && !changes['runFormScripts'].firstChange) {
      this.initializeRuntimeContext(true);
      return;
    }
    if (changes['readonly'] && !changes['readonly'].firstChange) {
      this.ctx.set_readonly(!!this.readonly);
    }
    if (changes['initialData'] && !changes['initialData'].firstChange && this.initialData) {
      Object.assign(this.formData, this.initialData);
      this.initForm();
    }
    if (changes['metadata'] && !changes['metadata'].firstChange) {
      this.ctx.metadata = this.metadata;
    }
    if (changes['mediaHandler'] && !changes['mediaHandler'].firstChange) {
      this.ctx.mediaHandler = this.mediaHandler;
    }
    if (changes['mediaResolver'] && !changes['mediaResolver'].firstChange) {
      this.ctx.mediaResolver = this.mediaResolver;
    }
    if (changes['linkDataSource'] && !changes['linkDataSource'].firstChange) {
      this.ctx.linkDataSource = this.linkDataSource;
    }
    if (changes['linkRequestObserver'] && !changes['linkRequestObserver'].firstChange) {
      this.ctx.linkRequestObserver = this.linkRequestObserver;
    }
    if (
      (changes['readonlyFields'] && !changes['readonlyFields'].firstChange) ||
      (changes['hiddenFields'] && !changes['hiddenFields'].firstChange) ||
      (changes['disabledActionButtons'] && !changes['disabledActionButtons'].firstChange) ||
      (changes['hiddenActionButtons'] && !changes['hiddenActionButtons'].firstChange)
    ) {
      this.applyHostStateOverrides();
    }
  }

  ngOnDestroy() {
    this.ctx.destroy();
  }

  private initializeRuntimeContext(emitReady: boolean = false) {
    this.ctx.destroy();
    this.ctx.initialize(this.document, this.formData, this.metadata);
    this.ctx.mediaHandler = this.mediaHandler;
    this.ctx.mediaResolver = this.mediaResolver;
    this.ctx.linkDataSource = this.linkDataSource;
    this.ctx.linkRequestObserver = this.linkRequestObserver;
    this.ctx.set_validation_handlers(
      () => this.validateForm(),
      () => this.validateForm(false),
      () => this.validateStep()
    );
    if (this.readonly) {
      this.ctx.set_readonly(true);
    }
    if (this.runFormScripts) {
      this.ctx.execute(this.resolveClientScript(), 'refresh');
    }
    this.ctx.trigger('refresh');
    this.ctx.on('print', () => this.onPrint());
    this.applyHostStateOverrides();
    if (emitReady) {
      this.formReady.emit(this.ctx);
    }
  }

  private initForm() {
    const rawData = { ...this.formData, ...(this.initialData || {}) };
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

          if (this.isTableField(f.fieldtype)) {
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
    this.validationErrors = this.validationErrors.filter(error => {
      if (error === fieldname) return false;
      return !error.startsWith(`${fieldname}.`);
    });
    this.ctx.triggerChange(fieldname, this.formData[fieldname]);
    this.formChange.emit({
      fieldname,
      value: this.formData[fieldname],
      data: { ...this.formData },
      frm: this.ctx
    });
  }

  validate(): boolean {
    return this.validateForm();
  }

  validateForm(triggerValidateHook: boolean = true): boolean {
    const invalidFields = this.collectValidationErrors(this.getAllSections());
    if (invalidFields.length > 0) {
      this.validationErrors = [...new Set(invalidFields)];
      this.markFieldsSubmitted();
      this.utils.show_alert('Please review the highlighted fields and try again.', 'error');
      this.formError.emit(this.validationErrors);
      return false;
    }

    this.validationErrors = [];

    if (triggerValidateHook) {
      this.ctx.begin_validation_hook();
      try {
        const result = this.ctx.trigger('validate');
        if (result === false) {
          return false;
        }
      } finally {
        this.ctx.end_validation_hook();
      }
    }

    return true;
  }

  nextStepWithValidation() {
    if (this.validateStep()) {
      this.ctx.next_step();
    }
  }

  validateStep(): boolean {
    const step = this.document.steps?.[this.ctx.currentStepIndex()];
    if (!step) return true;

    const invalidFields = this.collectValidationErrors(step.sections);
    if (invalidFields.length > 0) {
      this.validationErrors = [...new Set(invalidFields)];
      this.markFieldsSubmitted();
      this.utils.show_alert('Please review the highlighted fields and try again.', 'error');
      this.formError.emit(this.validationErrors);
      return false;
    }
    this.validationErrors = [];
    return true;
  }

  submit() {
    if (this.validateForm()) {
      const packed = this.packData();
      this.emitButtonEvent('submit', this.submitLabel || this.getSubmitActionConfig().label || 'Submit', packed, 'default');
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

  private getAllSections(): DocumentSection[] {
    const allSections: DocumentSection[] = [];
    if (this.document.is_stepper && this.document.steps) {
      this.document.steps.forEach(s => allSections.push(...s.sections));
    } else {
      allSections.push(...this.document.sections);
    }
    return allSections;
  }

  private resolveClientScript(): string {
    return this.clientScript ?? this.document.client_script ?? '';
  }

  isTableField(fieldtype: string | undefined): boolean {
    return fieldtype === 'Table' || fieldtype === 'JSONTable' || fieldtype === 'ChildTable';
  }

  private collectValidationErrors(sections: DocumentSection[]): string[] {
    const invalidFields: string[] = [];

    sections.forEach((s: DocumentSection) => {
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

          if (this.isTableField(f.fieldtype) && this.formData[f.fieldname]) {
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

    return invalidFields;
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

  private applyHostStateOverrides() {
    this.syncFieldOverride(this.appliedReadonlyFields, this.readonlyFields, 'read_only');
    this.syncFieldOverride(this.appliedHiddenFields, this.hiddenFields, 'hidden');
    this.syncButtonOverride(this.appliedDisabledActionButtons, this.disabledActionButtons, 'disable_on_readonly');
    this.syncButtonOverride(this.appliedHiddenActionButtons, this.hiddenActionButtons, 'visible', false);
  }

  private syncFieldOverride(
    applied: Set<string>,
    nextItems: string[],
    prop: 'read_only' | 'hidden'
  ) {
    const next = new Set((nextItems || []).map(item => item?.trim()).filter(Boolean));

    applied.forEach(fieldname => {
      if (!next.has(fieldname)) {
        this.ctx.set_df_property(fieldname, prop, false);
      }
    });

    next.forEach(fieldname => {
      if (!applied.has(fieldname)) {
        this.ctx.set_df_property(fieldname, prop, true);
      }
    });

    applied.clear();
    next.forEach(fieldname => applied.add(fieldname));
  }

  private syncButtonOverride(
    applied: Set<string>,
    nextItems: string[],
    prop: 'disable_on_readonly' | 'visible',
    enabledValue: boolean = true
  ) {
    const next = new Set((nextItems || []).map(item => item?.trim()).filter(Boolean));

    applied.forEach(buttonId => {
      if (!next.has(buttonId)) {
        this.ctx.set_button_property(buttonId, prop, prop === 'visible' ? true : false);
      }
    });

    next.forEach(buttonId => {
      if (!applied.has(buttonId)) {
        this.ctx.set_button_property(buttonId, prop, enabledValue);
      }
    });

    applied.clear();
    next.forEach(buttonId => applied.add(buttonId));
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

  private emitButtonEvent(action: string, buttonName: string, packedData: any, source: 'default' | 'custom') {
    this.formAction.emit({
      action,
      buttonName,
      data: packedData,
      rawData: { ...this.formData },
      frm: this.ctx,
      source
    });
  }

  async onCustomButtonClick(btn: { id: string; label: string; action: (frm: VfFormContext, context?: VfButtonActionContext) => boolean | void | Promise<boolean | void> }) {
    if (this.disabled) return;

    const allowEmit = await this.resolveActionDecision(
      btn.action(this.ctx, { action: btn.id, label: btn.label, source: 'custom' })
    );
    if (!allowEmit) {
      return;
    }
    this.emitButtonEvent(btn.id, btn.label, this.packData(), 'custom');
  }

  async onAction(action: string) {
    if (this.disabled) return;

    if (action === 'delete') {
      // not implemented
      return;
    }

    if (action === 'submit') {
      this.submit();
    } else {
      const config = (this.ctx.actionsConfig() as any)?.[action.toLowerCase()];
      let allowEmit = true;
      const actionContext: VfButtonActionContext = {
        action,
        label: config?.label || action,
        source: 'custom'
      };
      if (config?.runtimeAction) {
        allowEmit = await this.resolveActionDecision(config.runtimeAction(this.ctx, actionContext));
      } else if (config?.action && this.runFormScripts) {
        allowEmit = this.ctx.execute(config.action, action) !== false;
      }

      if (!allowEmit) {
        return;
      }
      this.emitButtonEvent(action, config?.label || action, this.packData(), 'custom');
    }
  }

  private async resolveActionDecision(result: unknown): Promise<boolean> {
    const resolved = result && typeof (result as Promise<unknown>).then === 'function'
      ? await (result as Promise<unknown>)
      : result;
    return resolved !== false;
  }

  shouldShowReadonlyOverlay(field: DocumentField): boolean {
    if (!this.ctx.getFieldSignal(field.fieldname, 'read_only')()) {
      return false;
    }

    const value = this.formData[field.fieldname];
    if (value === undefined || value === null || value === '') {
      return true;
    }

    const runtimeRegex = this.ctx.getFieldSignal(field.fieldname, 'regex')();
    const presetKind = getRegexPresetOption(runtimeRegex ?? field.regex)?.kind;
    return presetKind !== 'email' && presetKind !== 'url';
  }

  isValidRegex(fieldname: string, pattern: string, customValue?: any): boolean {
    const value = customValue !== undefined ? customValue : this.formData[fieldname];
    if (value === undefined || value === null || value === '') return true;
    try {
      const resolvedPattern = resolveRegexPattern(pattern);
      if (!resolvedPattern) {
        return true;
      }
      const regex = new RegExp(resolvedPattern);
      return regex.test(String(value));
    } catch (e) {
      return false;
    }
  }

  public readonly Math = Math;

  getGridTableColumns(field: DocumentField) {
    const currentColumns = this.ctx.getFieldSignal(field.fieldname, 'table_fields')() || [];
    const visibleColumns = currentColumns.filter((col: any) => !col.hidden);
    const listViewColumns = visibleColumns.filter((col: any) => col.in_list_view);
    return (listViewColumns.length > 0 ? listViewColumns : visibleColumns).slice(0, 6);
  }

  getHiddenGridColumnCount(field: DocumentField) {
    const currentColumns = this.ctx.getFieldSignal(field.fieldname, 'table_fields')() || [];
    const visibleColumns = currentColumns.filter((col: any) => !col.hidden);
    const listViewColumns = visibleColumns.filter((col: any) => col.in_list_view);
    const sourceColumns = listViewColumns.length > 0 ? listViewColumns : visibleColumns;
    return Math.max(0, sourceColumns.length - this.getGridTableColumns(field).length);
  }

  getTableEmptyStateColspan(field: DocumentField) {
    return this.getGridTableColumns(field).length + (this.getHiddenGridColumnCount(field) > 0 ? 3 : 2);
  }

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

  private markFieldsSubmitted() {
    this.fieldComponents?.forEach(field => {
      field.submitted = true;
    });
  }

  clearValidationErrors() {
    this.validationErrors = [];
  }

  describeFieldError(path: string) {
    const [parentFieldname, childFieldname] = path.split('.');
    const parentField = this.findField(parentFieldname);

    if (childFieldname && parentField && this.isTableField(parentField.fieldtype)) {
      const childField = parentField.table_fields?.find(field => field.fieldname === childFieldname);
      const parentLabel = parentField.label || parentFieldname;
      const childLabel = childField?.label || childFieldname;
      return `${parentLabel} -> ${childLabel}`;
    }

    return parentField?.label || path;
  }

  private findField(fieldname: string) {
    const allSections: DocumentSection[] = [];
    if (this.document.is_stepper && this.document.steps) {
      this.document.steps.forEach(step => allSections.push(...step.sections));
    } else {
      allSections.push(...this.document.sections);
    }

    for (const section of allSections) {
      for (const column of section.columns) {
        for (const field of column.fields) {
          if (field.fieldname === fieldname) {
            return field;
          }
        }
      }
    }

    return null;
  }
}
