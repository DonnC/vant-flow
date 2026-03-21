import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef, AfterViewInit, OnInit, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { QuillModule } from 'ngx-quill';
import { firstValueFrom } from 'rxjs';
import { DocumentField, VfLinkDataSource, VfLinkFieldConfig, VfLinkRequestObserver, VfMediaHandler, VfMediaResolver, VfStoredMedia } from '../models/document.model';
import { VfFormContext } from '../services/form-context';
import { VfUiPrimitivesModule } from '../ui/ui-primitives.module';
import { VfIconButton } from './shared/icon-button.component';

import QuillTableBetter from 'quill-table-better';
import Quill from "quill";
Quill.register({ 'modules/table-better': QuillTableBetter }, true);

@Component({
  selector: 'vf-field',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [CommonModule, FormsModule, QuillModule, VfUiPrimitivesModule, VfIconButton],
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
          <!-- ... switches ... -->
          @case ('Check') {
            <label class="flex items-center gap-2 py-1.5 cursor-pointer">
              <input type="checkbox"
                class="ui-checkbox"
                [ngModel]="value === 1 || value === true"
                (ngModelChange)="onValueChange($event ? 1 : 0)"
                [disabled]="disabled">
              @if (!compact) {
                <span class="text-xs text-zinc-600 font-medium">{{ field.label }}</span>
              }
            </label>
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
          @case ('Link') {
            @if (compact) {
              <div class="ui-input cursor-pointer truncate" (click)="onInputClick($event)">
                {{ getLinkDisplayValue(value) || placeholder }}
              </div>
            } @else if (hasLinkDataSource) {
              <div class="relative">
                <input
                  type="text"
                  class="ui-input"
                  autocomplete="off"
                  [ngModel]="linkInputValue"
                  (ngModelChange)="onLinkSearchChange($event)"
                  (focus)="openLinkDropdown()"
                  (blur)="onLinkBlur()"
                  [placeholder]="placeholder || 'Search and select...'"
                  [disabled]="disabled">

                @if (linkLoading) {
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300">
                    <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  </div>
                } @else if (value && !disabled) {
                  <vf-icon-button
                    (mousedown)="$event.preventDefault()"
                    (click)="clearLinkSelection()"
                    class="absolute right-2 top-1/2 -translate-y-1/2"
                    tone="danger" [soft]="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </vf-icon-button>
                }

                @if (showLinkDropdown) {
                  <div class="absolute z-30 mt-1 w-full rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
                    @if (linkError) {
                      <div class="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
                        {{ linkError }}
                      </div>
                    }

                    @if (linkResults.length > 0) {
                      <div class="max-h-72 overflow-y-auto">
                        @for (item of linkResults; track getLinkItemTrack(item)) {
                          <button
                            type="button"
                            (mousedown)="$event.preventDefault()"
                            (click)="selectLinkOption(item)"
                            class="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-b-0">
                            <div class="text-[14px] font-medium text-zinc-800 leading-tight">{{ getLinkTitle(item) }}</div>
                            @if (getLinkDescription(item)) {
                              <div class="text-[12px] text-zinc-500 mt-1 leading-snug">{{ getLinkDescription(item) }}</div>
                            }
                          </button>
                        }
                      </div>
                    } @else if (!linkLoading && !linkError) {
                      <div class="px-4 py-3 text-sm text-zinc-400">
                        No results found.
                      </div>
                    }

                    @if (linkFilterSummary.length > 0) {
                      <div class="px-4 py-3 text-xs text-zinc-500 bg-zinc-50 border-t border-zinc-100 italic">
                        Filtered by: {{ linkFilterSummary }}
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <input
                type="text"
                class="ui-input"
                (click)="onInputClick($event)"
                [ngModel]="value"
                (ngModelChange)="onValueChange($event)"
                [placeholder]="placeholder"
                [disabled]="disabled">
            }
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
            @if (compact) {
              <div class="ui-input cursor-pointer truncate italic text-zinc-500" (click)="onInputClick($event)">
                {{ stripHtml(value) || placeholder }}
              </div>
            } @else {
              @if (disabled) {
                <div class="editor-preview rounded-lg overflow-hidden bg-white transition-all border border-zinc-200">
                  <div class="editor-preview__content" [innerHTML]="getReadonlyEditorHtml(value)"></div>
                </div>
              } @else {
                <div class="rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-50/50 transition-all border border-zinc-200">
                  <quill-editor
                    class="ql-frappe-style"
                    [ngModel]="value"
                    (onContentChanged)="onValueChange($event.html)"
                    [readOnly]="false"
                    [placeholder]="field.placeholder || 'Type here...'"
                    theme="snow"
                  ></quill-editor>
                </div>
              }
            }
          }
          @case ('Date') {
            @if (compact) {
              <div class="ui-input cursor-pointer truncate font-mono text-[11px]" (click)="onInputClick($event)">
                {{ value || placeholder }}
              </div>
            } @else {
              <input type="date"
                class="ui-input"
                (click)="onInputClick($event)"
                [ngModel]="value"
                (ngModelChange)="onValueChange($event)"
                [disabled]="disabled">
            }
          }
          @case ('Datetime') {
            @if (compact) {
              <div class="ui-input cursor-pointer truncate font-mono text-[11px]" (click)="onInputClick($event)">
                {{ value | date:'short' }}
              </div>
            } @else {
              <input type="datetime-local"
                class="ui-input"
                (click)="onInputClick($event)"
                [ngModel]="value"
                (ngModelChange)="onValueChange($event)"
                [disabled]="disabled">
            }
          }
          @case ('Time') {
            @if (compact) {
              <div class="ui-input cursor-pointer truncate font-mono text-[11px]" (click)="onInputClick($event)">
                {{ value || placeholder }}
              </div>
            } @else {
              <input type="time"
                class="ui-input"
                (click)="onInputClick($event)"
                [ngModel]="value"
                (ngModelChange)="onValueChange($event)"
                [disabled]="disabled">
            }
          }
          @case ('Signature') {
            @if (compact) {
              <div class="flex items-center gap-1.5 py-1 px-2 rounded bg-zinc-50 border border-zinc-200 w-fit cursor-pointer"
                   (click)="onInputClick($event)">
                @if (value) {
                  <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span class="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Signed</span>
                } @else {
                  <div class="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">No Signature</span>
                }
              </div>
            } @else {
              <div class="space-y-2">
                <div class="relative bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden group/sig">
                  <canvas #signatureCanvas
                    class="w-full h-40 cursor-crosshair touch-none"
                    (mousedown)="startDrawing($event)"
                    (mousemove)="draw($event)"
                    (mouseup)="stopDrawing()"
                    (mouseleave)="stopDrawing()"
                    (touchstart)="startDrawing($event)"
                    (touchmove)="draw($event)"
                    (touchend)="stopDrawing()"></canvas>
                  
                  @if (!value && !isDrawing) {
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span class="text-xs text-zinc-400 font-medium">Draw your signature here</span>
                    </div>
                  }
  
                  @if (value && !isDrawing) {
                    <div class="absolute top-2 right-2 flex gap-1.5 opacity-0 group-sig:opacity-100 group-hover/sig:opacity-100 transition-opacity">
                      <vf-icon-button (pressed)="clearSignature()" 
                        class="bg-white shadow-sm border border-zinc-200"
                        size="md" tone="danger">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </vf-icon-button>
                    </div>
                  }
                </div>
                @if (value) {
                  <div class="flex items-center gap-2 px-1">
                    <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span class="text-[10px] text-emerald-600 font-bold tracking-tight uppercase">Signature Captured</span>
                  </div>
                }
              </div>
            }
          }
          @case ('Attach') {
            @if (compact) {
              <div class="flex items-center gap-1.5 py-1 px-2 rounded bg-zinc-50 border border-zinc-200 w-fit cursor-pointer"
                   (click)="onInputClick($event)">
                @if (attachments.length > 0) {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-indigo-600"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                  <span class="text-[10px] font-bold text-zinc-600">{{ attachments.length }} {{ attachments.length === 1 ? 'file' : 'files' }}</span>
                } @else {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-zinc-300"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Empty</span>
                }
              </div>
            } @else {
              <div class="space-y-3">
                <!-- Dropzone -->
                @if (!disabled) {
                  <div 
                    class="relative border-2 border-dashed border-zinc-200 rounded-xl p-6 transition-all group/drop cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30"
                    [class.border-indigo-500]="isDraggingFile"
                    [class.bg-indigo-50]="isDraggingFile"
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event)"
                    (click)="triggerFileInput()">
                    
                    <input type="file" #fileInput class="hidden" 
                      [accept]="attachConfig.accept"
                      [multiple]="attachConfig.maxFiles > 1"
                      (change)="onFileSelected($event)">
    
                    <div class="flex flex-col items-center gap-2 text-center">
                      <div class="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover/drop:bg-indigo-100 group-hover/drop:text-indigo-600 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                      </div>
                      <div>
                        <p class="text-[13px] text-zinc-600 font-bold">Click or drag to upload</p>
                        <p class="text-[11px] text-zinc-400">{{ attachConfig.accept || 'All files' }} • Max {{ attachConfig.maxSizeText }}</p>
                      </div>
                    </div>
                  </div>
                } @else if (attachments.length === 0) {
                  <div class="p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-center">
                    <p class="text-[11px] text-zinc-400 font-bold uppercase tracking-widest italic">No files attached</p>
                  </div>
                }
  
                <!-- File List -->
                @if (attachments.length > 0) {
                  <div class="space-y-2">
                    @for (file of attachments; track file.name; let i = $index) {
                      <div class="flex items-center justify-between p-2.5 bg-white border border-zinc-100 rounded-lg group/file hover:border-zinc-200 transition-all shadow-sm">
                        <div class="flex items-center gap-3 min-w-0">
                          <!-- Preview Icon -->
                          <div class="w-9 h-9 rounded-md bg-zinc-50 flex items-center justify-center shrink-0 overflow-hidden">
                            @if (isImage(file.type)) {
                              <img [src]="getMediaUrl(file)" class="w-full h-full object-cover">
                            } @else {
                              <svg class="text-zinc-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            }
                          </div>
                          <div class="min-w-0">
                            <p class="text-[12px] font-bold text-zinc-700 truncate leading-none mb-1">{{ file.name }}</p>
                            <p class="text-[10px] text-zinc-400 font-medium tracking-tight uppercase">{{ getFileSize(file.size) }}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-1 transition-opacity" 
                            [ngClass]="{'opacity-0': !disabled, 'group-hover/file:opacity-100': !disabled}">
                          <vf-icon-button (pressed)="downloadFile(file)" tone="brand">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                          </vf-icon-button>
                          @if (!disabled) {
                            <vf-icon-button (pressed)="removeFile(i)" tone="danger">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </vf-icon-button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
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

        @if (disabled && !isEditor && field.fieldtype !== 'Attach') {
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

    /* Quill Table Better Styling */
    ::ng-deep .ql-editor table {
      border-collapse: collapse;
      width: 100% !important;
      margin-bottom: 1rem;
    }
    ::ng-deep .ql-editor table td {
      border: 1px solid #e2e8f0 !important;
      padding: 8px !important;
      min-width: 50px;
    }

    /* Read-only Text Editor Preview */
    .editor-preview__content {
      @apply px-4 py-3 text-zinc-700 leading-relaxed;
      min-height: 110px;
      font-size: 13.5px;
    }
    .editor-preview__content:empty::before {
      content: 'No content';
      @apply text-zinc-400 italic;
    }
    .editor-preview__content ::ng-deep p {
      margin: 0 0 0.75rem;
    }
    .editor-preview__content ::ng-deep p:last-child {
      margin-bottom: 0;
    }
    .editor-preview__content ::ng-deep table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.75rem 0 1rem;
      table-layout: auto;
    }
    .editor-preview__content ::ng-deep th,
    .editor-preview__content ::ng-deep td {
      border: 1px solid #d4d4d8;
      padding: 0.55rem 0.7rem;
      vertical-align: top;
      text-align: left;
    }
    .editor-preview__content ::ng-deep th {
      @apply bg-zinc-50 font-semibold text-zinc-800;
    }
    .editor-preview__content ::ng-deep ul,
    .editor-preview__content ::ng-deep ol {
      margin: 0.75rem 0 0.75rem 1.25rem;
      padding-left: 1rem;
    }
    .editor-preview__content ::ng-deep blockquote {
      border-left: 3px solid #cbd5e1;
      margin: 0.75rem 0;
      padding-left: 0.9rem;
      color: #52525b;
    }
    .editor-preview__content ::ng-deep pre {
      @apply bg-zinc-950 text-emerald-300 rounded-xl;
      padding: 0.85rem 1rem;
      overflow-x: auto;
      margin: 0.75rem 0;
      font-size: 12px;
    }
    .editor-preview__content ::ng-deep img {
      max-width: 100%;
      height: auto;
      border-radius: 0.75rem;
      margin: 0.75rem 0;
    }
  `]
})
export class VfField implements AfterViewInit, OnInit, DoCheck {
  @ViewChild('signatureCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  @Input() field!: DocumentField;
  @Input() value: any;
  @Input() readOnly: boolean = false;
  @Input() hideLabel: boolean = false;
  @Input() compact: boolean = false;
  @Input() mediaHandler?: VfMediaHandler;
  @Input() mediaResolver?: VfMediaResolver;
  @Input() linkDataSource?: VfLinkDataSource;
  @Input() linkRequestObserver?: VfLinkRequestObserver;
  @Input() formMetadata?: any;
  @Output() valueChange = new EventEmitter<any>();

  public submitted: boolean = false;

  ctx = inject(VfFormContext, { optional: true });
  http = inject(HttpClient);

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
    return this.isProcessingMedia || this.readOnly || (this.ctx?.isReadOnly() || this.ctx?.getFieldSignal(this.field.fieldname, 'read_only')() || false);
  }

  get isEditor() {
    return this.field.fieldtype === 'Text Editor';
  }

  get options() {
    const opt = this.ctx?.getFieldSignal(this.field.fieldname, 'options')() ?? this.field.options;
    if (!opt) return [];
    if (this.field.fieldtype === 'Attach') return [opt];
    return String(opt).split('\n').map(o => o.trim()).filter(Boolean);
  }

  get regex() {
    return this.ctx?.getFieldSignal(this.field.fieldname, 'regex')() ?? this.field.regex;
  }

  get resolvedLinkConfig(): VfLinkFieldConfig | undefined {
    return this.ctx?.getFieldSignal(this.field.fieldname, 'link_config')() ?? this.field.link_config;
  }

  get hasLinkDataSource() {
    return this.field.fieldtype === 'Link' && !!this.resolvedLinkConfig?.data_source;
  }

  get linkFilterSummary() {
    const filters = this.resolvedLinkConfig?.filters || {};
    return Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${this.humanizeKey(key)} equals "${value}"`)
      .join(', ');
  }

  get attachConfig() {
    // Expected format in options: ".pdf,.jpg | 5MB | 1" or a JSON string
    const opt = (this.options[0] as string) || '';
    if (opt.startsWith('{')) {
      try { return JSON.parse(opt); } catch { }
    }
    const parts = opt.split('|').map(p => p.trim());
    return {
      accept: parts[0] || '',
      maxSize: this.parseFileSize(parts[1] || '5MB'),
      maxSizeText: parts[1] || '5MB',
      maxFiles: parseInt(parts[2]) || 1
    };
  }

  get attachments(): any[] {
    if (!this.value) return [];
    return Array.isArray(this.value) ? this.value : [this.value];
  }

  onValueChange(val: any) {
    this.valueChange.emit(val);
  }

  onInputClick(event: Event) {
    // Only stop propagation for interactive elements to avoid triggering table row edit modal
    if (this.compact && (this.field.fieldtype !== 'Text' && this.field.fieldtype !== 'Attach')) {
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
    if (!this.regex || !this.value) return false;
    try {
      return !new RegExp(this.regex).test(String(this.value));
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

  // ── Link Field Logic ─────────────────────────────────────────
  private static linkCache = new Map<string, any[]>();
  showLinkDropdown = false;
  linkLoading = false;
  linkError = '';
  linkResults: any[] = [];
  linkInputValue = '';
  private linkBlurTimer?: ReturnType<typeof setTimeout>;
  private activeLinkRequestId = 0;
  private lastLinkRefreshTick = 0;

  ngOnInit() {
    if (this.field.fieldtype === 'Link') {
      this.syncLinkInputWithValue();
    }
  }

  ngDoCheck() {
    if (this.field.fieldtype === 'Link' && !this.showLinkDropdown) {
      this.syncLinkInputWithValue();
    }

    if (this.field.fieldtype !== 'Link' || !this.ctx) return;
    const tick = this.ctx.getLinkRefreshSignal(this.field.fieldname)();
    if (tick !== this.lastLinkRefreshTick) {
      this.lastLinkRefreshTick = tick;
      if (this.showLinkDropdown) {
        void this.loadLinkOptions(this.linkInputValue);
      }
      this.syncLinkInputWithValue();
    }
  }

  onLinkSearchChange(value: string) {
    this.linkInputValue = value;
    this.showLinkDropdown = true;

    if (!value.trim() && this.value) {
      this.onValueChange(null);
    }

    void this.loadLinkOptions(value);
  }

  openLinkDropdown() {
    if (this.disabled || !this.hasLinkDataSource) return;
    if (this.linkBlurTimer) clearTimeout(this.linkBlurTimer);
    this.showLinkDropdown = true;
    const initialQuery = this.value ? '' : this.linkInputValue;
    void this.loadLinkOptions(initialQuery, true);
  }

  onLinkBlur() {
    this.linkBlurTimer = setTimeout(() => {
      this.showLinkDropdown = false;
      this.syncLinkInputWithValue();
    }, 180);
  }

  clearLinkSelection() {
    this.onValueChange(null);
    this.linkInputValue = '';
    this.linkResults = [];
    this.linkError = '';
  }

  selectLinkOption(item: any) {
    this.onValueChange(item);
    this.linkInputValue = this.getLinkTitle(item);
    this.showLinkDropdown = false;
  }

  getLinkDisplayValue(value: any) {
    if (!value) return '';
    if (!this.resolvedLinkConfig?.mapping) return typeof value === 'string' ? value : '';
    return this.getLinkTitle(value);
  }

  getLinkTitle(item: any) {
    return String(this.getValueByPath(item, this.resolvedLinkConfig?.mapping?.title) ?? '');
  }

  getLinkDescription(item: any) {
    const path = this.resolvedLinkConfig?.mapping?.description;
    if (!path) return '';
    const value = this.getValueByPath(item, path);
    return value === undefined || value === null ? '' : String(value);
  }

  getLinkItemTrack(item: any) {
    const idPath = this.resolvedLinkConfig?.mapping?.id;
    return String(this.getValueByPath(item, idPath) ?? this.getLinkTitle(item));
  }

  private syncLinkInputWithValue() {
    if (!this.hasLinkDataSource) return;
    this.linkInputValue = this.getLinkDisplayValue(this.value);
  }

  private async loadLinkOptions(query: string, preloadOnEmpty: boolean = false) {
    const config = this.resolvedLinkConfig;
    if (!config?.data_source) return;

    const minQueryLength = config.min_query_length ?? 0;
    const normalizedQuery = (query || '').trim();
    const shouldBypassMinQueryLength = preloadOnEmpty && normalizedQuery.length === 0;

    if (!shouldBypassMinQueryLength && normalizedQuery.length < minQueryLength) {
      this.linkResults = [];
      this.linkError = '';
      this.emitLinkRequestState(query, 'idle');
      return;
    }

    const filters = { ...(config.filters || {}) };
    const requestId = ++this.activeLinkRequestId;
    const cacheKey = this.getLinkCacheKey(config, query, filters);

    if (config.cache !== false && VfField.linkCache.has(cacheKey)) {
      this.linkResults = VfField.linkCache.get(cacheKey) || [];
      this.linkError = '';
      this.emitLinkRequestState(query, 'success', this.linkResults.length);
      return;
    }

    this.linkLoading = true;
    this.linkError = '';
    this.emitLinkRequestState(query, 'loading');

    try {
      const results = this.linkDataSource
        ? await this.linkDataSource({
          field: this.field,
          query,
          filters,
          config,
          formMetadata: this.formMetadata ?? this.ctx?.metadata
        })
        : await this.fetchLinkOptionsFromEndpoint(query, filters, config);

      if (requestId !== this.activeLinkRequestId) return;

      this.linkResults = Array.isArray(results) ? results : [];
      if (config.cache !== false) {
        VfField.linkCache.set(cacheKey, this.linkResults);
      }
      this.emitLinkRequestState(query, 'success', this.linkResults.length);
    } catch (error) {
      if (requestId !== this.activeLinkRequestId) return;
      this.linkResults = [];
      this.linkError = error instanceof Error ? error.message : 'Failed to load link options.';
      this.emitLinkRequestState(query, 'error', 0, this.linkError);
    } finally {
      if (requestId === this.activeLinkRequestId) {
        this.linkLoading = false;
      }
    }
  }

  private async fetchLinkOptionsFromEndpoint(query: string, filters: Record<string, any>, config: VfLinkFieldConfig): Promise<any[]> {
    const searchParam = config.search_param || 'q';
    const limitParam = config.limit_param || 'limit';
    const pageSize = config.page_size ?? 20;
    const method = config.method || 'GET';

    let response: any;
    if (method === 'POST') {
      response = await firstValueFrom(this.http.post<any>(config.data_source, {
        [searchParam]: query,
        filters,
        fieldname: this.field.fieldname,
        fieldtype: this.field.fieldtype,
        [limitParam]: pageSize
      }));
    } else {
      let params = new HttpParams()
        .set(searchParam, query)
        .set(limitParam, String(pageSize))
        .set('fieldname', this.field.fieldname)
        .set('fieldtype', this.field.fieldtype);

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(`filters.${key}`, String(value));
        }
      });

      response = await firstValueFrom(this.http.get<any>(config.data_source, { params }));
    }

    const extracted = config.results_path
      ? this.getValueByPath(response, config.results_path)
      : (Array.isArray(response) ? response : response?.results || response?.items || response?.data || []);

    return Array.isArray(extracted) ? extracted : [];
  }

  private emitLinkRequestState(query: string, status: 'idle' | 'loading' | 'success' | 'error', resultCount?: number, error?: string) {
    this.linkRequestObserver?.({
      fieldname: this.field.fieldname,
      query,
      filters: { ...(this.resolvedLinkConfig?.filters || {}) },
      status,
      resultCount,
      error
    });
    this.ctx?.linkRequestObserver?.({
      fieldname: this.field.fieldname,
      query,
      filters: { ...(this.resolvedLinkConfig?.filters || {}) },
      status,
      resultCount,
      error
    });
  }

  private getLinkCacheKey(config: VfLinkFieldConfig, query: string, filters: Record<string, any>) {
    return JSON.stringify({
      data_source: config.data_source,
      query,
      filters
    });
  }

  private getValueByPath(obj: any, path?: string) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((prev, curr) => prev != null ? prev[curr] : undefined, obj);
  }

  getReadonlyEditorHtml(value: any) {
    if (!value) return '';
    return String(value)
      .replace(/<temporary\b[^>]*>[\s\S]*?<\/temporary>/gi, '')
      .replace(/\sclass="ql-cell-focused"/gi, '');
  }

  private humanizeKey(key: string) {
    return key.replace(/[_\.]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  }

  private mediaUrlCache = new Map<string, string>();
  private mediaUrlInflight = new Map<string, Promise<string>>();

  // ── Signature Logic ──────────────────────────────────────────
  isDrawing = false;
  isProcessingMedia = false;
  private ctx2d?: CanvasRenderingContext2D;

  ngAfterViewInit() {
    if (this.canvasRef) {
      this.initCanvas();
    }
  }

  private initCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx2d = canvas.getContext('2d') || undefined;
    if (this.ctx2d) {
      this.ctx2d.strokeStyle = '#18181b'; // zinc-900
      this.ctx2d.lineWidth = 2.5;
      this.ctx2d.lineCap = 'round';
      this.ctx2d.lineJoin = 'round';
    }

    // Set internal resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Loading existing signature if any
    if (this.value && this.field.fieldtype === 'Signature') {
      void this.renderSignatureValue(this.value);
    }
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    if (this.disabled) return;
    this.isDrawing = true;
    const pos = this.getPos(event);
    this.ctx2d?.beginPath();
    this.ctx2d?.moveTo(pos.x, pos.y);
    event.preventDefault();
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing || !this.ctx2d || this.disabled) return;
    const pos = this.getPos(event);
    this.ctx2d.lineTo(pos.x, pos.y);
    this.ctx2d.stroke();
    event.preventDefault();
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    void this.saveSignature();
  }

  clearSignature() {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas && this.ctx2d) {
      this.ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      this.onValueChange('');
    }
  }

  private async saveSignature() {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      if (!this.mediaHandler) {
        this.onValueChange(dataUrl);
        return;
      }

      this.isProcessingMedia = true;
      try {
        const blob = await this.canvasToBlob(canvas);
        const result = await this.mediaHandler({
          fieldtype: 'Signature',
          blob,
          dataUrl
        }, {
          field: this.field,
          fieldname: this.field.fieldname,
          fieldtype: 'Signature',
          currentValue: this.value,
          formMetadata: this.formMetadata ?? this.ctx?.metadata
        });

        this.onValueChange(result ?? '');
      } catch (error) {
        this.handleMediaError(error, 'Failed to process signature');
      } finally {
        this.isProcessingMedia = false;
      }
    }
  }

  private getPos(event: MouseEvent | TouchEvent) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    } else {
      return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
  }

  // ── Attach Logic ─────────────────────────────────────────────
  isDraggingFile = false;

  triggerFileInput() {
    if (this.disabled) return;
    this.fileInputRef?.nativeElement.click();
  }

  onDragOver(event: DragEvent) {
    if (this.disabled) return;
    event.preventDefault();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDraggingFile = false;
  }

  onDrop(event: DragEvent) {
    if (this.disabled) return;
    event.preventDefault();
    this.isDraggingFile = false;
    const files = event.dataTransfer?.files;
    if (files) this.handleFiles(files);
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) this.handleFiles(files);
  }

  private async handleFiles(fileList: FileList) {
    const config = this.attachConfig;
    let current = [...this.attachments];
    const newFiles = Array.from(fileList);

    for (const file of newFiles) {
      if (current.length >= config.maxFiles && config.maxFiles > 1) {
        this.ctx?.msgprint(`Maximum ${config.maxFiles} files allowed`, 'warning');
        break;
      }
      if (file.size > config.maxSize) {
        this.ctx?.msgprint(`File ${file.name} exceeds max size of ${config.maxSizeText}`, 'error');
        continue;
      }
      if (config.accept && !this.isAccepted(file, config.accept)) {
        this.ctx?.msgprint(`File ${file.name} type is not accepted`, 'error');
        continue;
      }

      const fileObj = await this.createAttachValue(file);
      if (!fileObj) continue;

      if (config.maxFiles === 1) {
        current = [fileObj];
      } else {
        current.push(fileObj);
      }
    }

    this.onValueChange(config.maxFiles === 1 ? current[0] : current);
    if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
  }

  removeFile(index: number) {
    if (this.disabled) return;
    const current = [...this.attachments];
    current.splice(index, 1);
    this.onValueChange(this.attachConfig.maxFiles === 1 ? null : current);
  }

  async downloadFile(file: any) {
    const targetUrl = await this.resolveMediaUrl(file, 'download');
    if (!targetUrl) {
      this.ctx?.msgprint('No downloadable URL is available for this file.', 'warning');
      return;
    }
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = file?.name || 'download';
    link.click();
  }

  isImage(type: string) {
    return type?.startsWith('image/');
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  }

  getMediaUrl(value: any): string {
    if (!value) return '';
    const directUrl = this.getDirectMediaUrl(value);
    if (directUrl) return directUrl;

    const cacheKey = this.getMediaCacheKey(value);
    if (cacheKey && this.mediaUrlCache.has(cacheKey)) {
      return this.mediaUrlCache.get(cacheKey) || '';
    }

    void this.resolveMediaUrl(value, 'preview');
    return '';
  }

  private getDirectMediaUrl(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.url || value.downloadUrl || '';
  }

  private getMediaCacheKey(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value.fileId || value.downloadUrl || value.url || value.name || null;
  }

  private async resolveMediaUrl(value: any, action: 'preview' | 'download'): Promise<string> {
    const directUrl = this.getDirectMediaUrl(value);
    if (directUrl) return directUrl;
    if (!value || !this.mediaResolver) return '';

    const cacheKey = this.getMediaCacheKey(value);
    if (cacheKey && this.mediaUrlCache.has(cacheKey)) {
      return this.mediaUrlCache.get(cacheKey) || '';
    }

    const existing = cacheKey ? this.mediaUrlInflight.get(cacheKey) : undefined;
    if (existing) return existing;

    const pending = (async () => {
      try {
        const result = await this.mediaResolver!(value, {
          field: this.field,
          fieldname: this.field.fieldname,
          fieldtype: this.field.fieldtype === 'Signature' ? 'Signature' : 'Attach',
          currentValue: this.value,
          formMetadata: this.formMetadata ?? this.ctx?.metadata,
          action
        });

        const resolvedUrl = typeof result === 'string' ? result : this.getDirectMediaUrl(result);
        if (cacheKey && resolvedUrl) {
          this.mediaUrlCache.set(cacheKey, resolvedUrl);
        }
        return resolvedUrl || '';
      } catch (error) {
        this.handleMediaError(error, 'Failed to resolve media URL');
        return '';
      } finally {
        if (cacheKey) this.mediaUrlInflight.delete(cacheKey);
      }
    })();

    if (cacheKey) this.mediaUrlInflight.set(cacheKey, pending);
    return pending;
  }

  private async renderSignatureValue(value: any) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx2d || !value) return;

    const src = await this.resolveMediaUrl(value, 'preview');
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      this.ctx2d?.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx2d?.drawImage(img, 0, 0);
    };
    img.src = src;
  }

  private isAccepted(file: File, accept: string): boolean {
    const types = accept.split(',').map(t => t.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    return types.some(t => {
      if (t.startsWith('.')) return fileName.endsWith(t);
      if (t.includes('/*')) return file.type.startsWith(t.replace('/*', ''));
      return file.type === t;
    });
  }

  private async createAttachValue(file: File): Promise<VfStoredMedia | null> {
    if (!this.mediaHandler) {
      const dataUrl = await this.readFileAsDataURL(file);
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        url: dataUrl
      };
    }

    this.isProcessingMedia = true;
    try {
      const result = await this.mediaHandler({
        fieldtype: 'Attach',
        file
      }, {
        field: this.field,
        fieldname: this.field.fieldname,
        fieldtype: 'Attach',
        currentValue: this.value,
        formMetadata: this.formMetadata ?? this.ctx?.metadata
      });

      if (!result) return null;
      if (typeof result === 'string') {
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          url: result
        };
      }

      return {
        name: result.name || file.name,
        size: result.size ?? file.size,
        type: result.type || file.type,
        url: result.url,
        fileId: result.fileId,
        metadata: result.metadata,
        downloadUrl: result.downloadUrl
      };
    } catch (error) {
      this.handleMediaError(error, `Failed to process file ${file.name}`);
      return null;
    } finally {
      this.isProcessingMedia = false;
    }
  }

  private async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | undefined> {
    return await new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob || undefined), 'image/png');
    });
  }

  private handleMediaError(error: unknown, fallbackMessage: string) {
    const message = error instanceof Error ? error.message : fallbackMessage;
    this.ctx?.msgprint(message || fallbackMessage, 'error');
    console.error('[VfField] Media handler failed', error);
  }

  private parseFileSize(size: string): number {
    const units: any = { kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = size.toLowerCase().match(/^(\d+)\s*(kb|mb|gb)$/);
    if (match) return parseInt(match[1]) * units[match[2]];
    return 5 * 1024 * 1024; // Default 5MB
  }

  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }
}
