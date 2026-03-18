import { Component, Input, Output, EventEmitter, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { DocumentField, VfMediaHandler, VfStoredMedia } from '../models/document.model';
import { VfFormContext } from '../services/form-context';

import QuillTableBetter from 'quill-table-better';
import Quill from "quill";
Quill.register({ 'modules/table-better': QuillTableBetter }, true);

@Component({
  selector: 'vf-field',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
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
              <div class="rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-50/50 transition-all border border-zinc-200"
                   [class.editor-readonly]="disabled">
                <quill-editor
                  class="ql-frappe-style"
                  [ngModel]="value"
                  (onContentChanged)="onValueChange($event.html)"
                  [readOnly]="disabled"
                  [placeholder]="disabled ? '' : (field.placeholder || 'Type here...')"
                  theme="snow"
                ></quill-editor>
              </div>
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
                      <button type="button" (click)="clearSignature()" 
                        class="p-1.5 rounded-lg bg-white shadow-sm border border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
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
                          <button type="button" (click)="downloadFile(file)" class="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                          </button>
                          @if (!disabled) {
                            <button type="button" (click)="removeFile(i)" class="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
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

    /* Text Editor Specific */
    .editor-readonly ::ng-deep .ql-toolbar {
      @apply hidden !important;
    }
    .editor-readonly ::ng-deep .ql-frappe-style .ql-container {
      @apply border-0 min-h-[10px] !important;
    }
    .editor-readonly ::ng-deep .ql-editor {
      @apply px-4 py-2 opacity-90;
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
  `]
})
export class VfField implements AfterViewInit {
  @ViewChild('signatureCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  @Input() field!: DocumentField;
  @Input() value: any;
  @Input() readOnly: boolean = false;
  @Input() hideLabel: boolean = false;
  @Input() compact: boolean = false;
  @Input() mediaHandler?: VfMediaHandler;
  @Input() formMetadata?: any;
  @Output() valueChange = new EventEmitter<any>();

  public submitted: boolean = false;

  ctx = inject(VfFormContext, { optional: true });

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
      const img = new Image();
      img.onload = () => this.ctx2d?.drawImage(img, 0, 0);
      img.src = this.getMediaUrl(this.value);
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

  downloadFile(file: any) {
    const targetUrl = file?.downloadUrl || this.getMediaUrl(file);
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
    if (typeof value === 'string') return value;
    return value.url || value.downloadUrl || '';
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
