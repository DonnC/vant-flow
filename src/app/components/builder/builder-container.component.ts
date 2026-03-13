import { Component, computed, inject, HostListener, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { BuilderStateService } from '../../services/builder-state.service';
import { FieldPaletteComponent } from './field-palette.component';
import { CanvasSectionComponent } from './canvas-section.component';
import { PropertyEditorComponent } from './property-editor.component';
import { ScriptEditorComponent } from './script-editor.component';
import { FormRendererComponent } from '../form-renderer/form-renderer.component';

type RightTab = 'properties' | 'script' | 'json';

@Component({
  selector: 'app-builder-container',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DragDropModule,
    FieldPaletteComponent, CanvasSectionComponent, PropertyEditorComponent,
    ScriptEditorComponent, FormRendererComponent
  ],
  template: `
  <div class="flex flex-col h-screen bg-zinc-100 overflow-hidden">
    <!-- ── Top Toolbar ─────────────────────────────────────── -->
    <header class="z-30 h-12 bg-white border-b border-zinc-200 flex items-center px-4 gap-3 shrink-0 shadow-sm">
      <!-- Logo / Title -->
      <div class="flex items-center gap-2 mr-4">
        <div class="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9h6M9 12h6M9 15h4"/>
          </svg>
        </div>
        <span class="text-sm font-semibold text-zinc-800">FormFlow</span>
      </div>

      <!-- DocType name edit -->
      <input
        class="text-sm font-medium bg-transparent border-none outline-none text-zinc-700 w-48
               hover:bg-zinc-50 focus:bg-white focus:border focus:border-zinc-200 focus:px-2 focus:rounded-md px-1 py-1 transition-all"
        [ngModel]="state.docType().name"
        (ngModelChange)="state.setDocTypeName($event)"
        placeholder="DocType Name"
      >

      <div class="flex-1"></div>

      <!-- Stats -->
      <span class="text-xs text-zinc-400 hidden md:block">
        {{ fieldCount() }} fields &bull; {{ sectionCount() }} sections
      </span>

      <!-- Mode toggle -->
      <div class="flex items-center bg-zinc-100 rounded-lg p-0.5 gap-0.5">
        <button
          (click)="setMode('builder')"
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
          [class.bg-white]="state.mode() === 'builder'"
          [class.shadow-sm]="state.mode() === 'builder'"
          [class.text-zinc-900]="state.mode() === 'builder'"
          [class.text-zinc-500]="state.mode() !== 'builder'"
        >
          <span class="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6"/></svg>
            Builder
          </span>
        </button>
        <button
          (click)="setMode('preview')"
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
          [class.bg-white]="state.mode() === 'preview'"
          [class.shadow-sm]="state.mode() === 'preview'"
          [class.text-zinc-900]="state.mode() === 'preview'"
          [class.text-zinc-500]="state.mode() !== 'preview'"
        >
          <span class="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview
          </span>
        </button>
      </div>

      <!-- Export JSON -->
      <button (click)="exportJson()" class="ui-btn-secondary ui-btn-sm gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export
      </button>
    </header>

    <!-- ── Main Layout ───────────────────────────────────── -->
    @if (state.mode() === 'builder') {
      <div class="flex flex-1 min-h-0 relative">
        <!-- LEFT: Field Palette -->
        <aside 
          class="shrink-0 bg-white border-r border-zinc-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out relative group"
          [style.width.px]="leftSidebarVisible() ? 208 : 0"
        >
          <app-field-palette [connectedLists]="allColumnIds()"></app-field-palette>
          
          <!-- Collapse Toggle Left -->
          <button 
            (click)="leftSidebarVisible.set(!leftSidebarVisible())"
            class="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 bg-white border border-zinc-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-zinc-50 transition-all shadow-sm z-10"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [class.rotate-180]="!leftSidebarVisible()">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </aside>

        @if (!leftSidebarVisible()) {
          <button 
            (click)="leftSidebarVisible.set(true)"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-12 bg-white border border-l-0 border-zinc-200 rounded-r-md flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm z-20 group"
          >
            <div class="w-1 h-3 bg-zinc-300 rounded-full group-hover:bg-indigo-400"></div>
          </button>
        }

        <!-- CENTER: Canvas -->
        <main class="flex-1 overflow-y-auto p-5">
          @if (state.docType().sections.length === 0) {
            <!-- Empty state -->
            <div class="h-full flex flex-col items-center justify-center text-center">
              <div class="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-zinc-200 flex items-center justify-center mb-4 shadow-sm">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-zinc-300">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
              </div>
              <h3 class="text-base font-semibold text-zinc-700 mb-1">Start Building</h3>
              <p class="text-sm text-zinc-400 mb-5 max-w-xs">Add a Section from the left panel, then drag fields into it to build your form layout</p>
              <button (click)="addSection()" class="ui-btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add First Section
              </button>
            </div>
          } @else {
            @for (section of state.docType().sections; track section.id) {
              <app-canvas-section
                [section]="section"
                [allColumnIds]="allColumnIds"
              ></app-canvas-section>
            }
            <button (click)="addSection()" class="flex items-center gap-2 text-sm text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg px-4 py-2.5 w-full border border-dashed border-zinc-200 hover:border-indigo-300 mt-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Section
            </button>
          }
        </main>

        <!-- RIGHT: Tools panel -->
        <div 
          class="w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors z-20 shrink-0"
          (mousedown)="startResize($event)"
          [class.bg-indigo-500]="isResizing()"
        ></div>

        <aside 
          class="shrink-0 bg-white border-l border-zinc-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out relative group"
          [style.width.px]="rightSidebarVisible() ? sidebarWidth() : 0"
        >
          <!-- Collapse Toggle Right -->
          <button 
            (click)="rightSidebarVisible.set(!rightSidebarVisible())"
            class="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-12 bg-white border border-zinc-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-zinc-50 transition-all shadow-sm z-10"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [class.rotate-180]="rightSidebarVisible()">
               <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <!-- Tab bar -->
          <div class="flex border-b border-zinc-100 shrink-0">
            <button
              (click)="rightTab = 'properties'"
              class="flex-1 py-2.5 text-xs font-medium transition-colors"
              [class.text-indigo-600]="rightTab === 'properties'"
              [class.border-b-2]="rightTab === 'properties'"
              [class.border-indigo-500]="rightTab === 'properties'"
              [class.text-zinc-400]="rightTab !== 'properties'"
            >Properties</button>
            <button
              (click)="rightTab = 'script'"
              class="flex-1 py-2.5 text-xs font-medium transition-colors"
              [class.text-indigo-600]="rightTab === 'script'"
              [class.border-b-2]="rightTab === 'script'"
              [class.border-indigo-500]="rightTab === 'script'"
              [class.text-zinc-400]="rightTab !== 'script'"
            >
              <span class="flex items-center justify-center gap-1">
                Script
                @if (state.docType().client_script?.trim()) {
                  <span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                }
              </span>
            </button>
            <button
              (click)="rightTab = 'json'"
              class="flex-1 py-2.5 text-xs font-medium transition-colors"
              [class.text-indigo-600]="rightTab === 'json'"
              [class.border-b-2]="rightTab === 'json'"
              [class.border-indigo-500]="rightTab === 'json'"
              [class.text-zinc-400]="rightTab !== 'json'"
            >JSON</button>
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-hidden">
            @if (rightTab === 'properties') {
              <app-property-editor></app-property-editor>
            } @else if (rightTab === 'script') {
              <app-script-editor></app-script-editor>
            } @else {
              <div class="h-full flex flex-col">
                <div class="px-4 py-3 border-b border-zinc-100 shrink-0 flex items-center justify-between bg-zinc-50/50">
                  <p class="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Schema Preview</p>
                  <button (click)="showImport = !showImport" class="text-[10px] px-2 py-1 bg-white border border-zinc-200 rounded shadow-sm hover:bg-zinc-50 transition-colors">
                    {{ showImport ? 'Cancel' : 'Import JSON' }}
                  </button>
                </div>
                <div class="flex-1 min-h-0 bg-zinc-950 p-4 relative">
                  @if (showImport) {
                    <div class="absolute inset-0 z-10 p-4 bg-zinc-900/95 flex flex-col gap-3 backdrop-blur-sm animate-in fade-in duration-200">
                      <p class="text-[10px] text-zinc-400 font-medium">Paste your <code>DocType</code> JSON here:</p>
                      <textarea #importArea class="flex-1 w-full bg-zinc-800 text-green-400 font-mono text-xs p-3 rounded border border-zinc-700 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600"
                        placeholder='&#123; "name": "...", "sections": [...] &#125;'></textarea>
                      <button (click)="handleImport(importArea.value)" class="ui-btn-primary justify-center py-2 text-xs">Load Schema</button>
                    </div>
                  }
                  <pre class="w-full h-full text-[11px] text-green-400 font-mono overflow-auto scrollbar-thin select-all" [class.opacity-50]="showImport">{{ state.docType() | json }}</pre>
                </div>
              </div>
            }
          </div>
        </aside>
      </div>
    } @else {
      <!-- PREVIEW MODE -->
      <div class="flex-1 overflow-y-auto bg-zinc-50 flex flex-col items-center">
        <div class="w-full px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span class="text-xs font-medium text-amber-700">Preview Mode — Client scripts are active. Changes made here won't affect the builder.</span>
        </div>
        
        <app-form-renderer [docType]="state.docType()" (formSubmit)="onFormSubmit($event)"></app-form-renderer>

        @if (lastSubmittedData) {
          <div class="w-full max-w-3xl px-4 py-8 border-t border-zinc-200 mt-auto bg-white shadow-inner animate-in slide-in-from-bottom-4 duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                <h4 class="text-xs font-bold uppercase tracking-widest text-zinc-400">Submission Payload (Live Simulation)</h4>
              </div>
              <button (click)="lastSubmittedData = null" class="text-[10px] text-zinc-400 hover:text-zinc-600 underline">Clear</button>
            </div>
            <pre class="w-full text-[11px] text-green-600 font-mono bg-zinc-50 p-4 rounded-lg border border-zinc-200 overflow-auto max-h-64">{{ lastSubmittedData | json }}</pre>
          </div>
        }
      </div>
    }
  </div>
  `
})
export class BuilderContainerComponent implements OnInit {
  state = inject(BuilderStateService);
  rightTab: RightTab = 'properties';
  showImport = false;
  lastSubmittedData: any = null;

  // Sidebar controls
  leftSidebarVisible = signal(true);
  rightSidebarVisible = signal(true);
  sidebarWidth = signal(288);
  isResizing = signal(false);

  constructor() {
    // Auto-focus properties tab when a field is selected
    effect(() => {
      if (this.state.selectedFieldId()) {
        this.rightTab = 'properties';
        this.rightSidebarVisible.set(true);
      }
    }, { allowSignalWrites: true });
  }

  allColumnIds = computed(() =>
    this.state.docType().sections.flatMap(s => s.columns.map(c => c.id))
  );

  fieldCount = computed(() =>
    this.state.docType().sections.reduce((total, s) =>
      total + s.columns.reduce((ct, c) => ct + c.fields.length, 0), 0)
  );

  sectionCount = computed(() => this.state.docType().sections.length);

  ngOnInit() {
    // listen for palette's section add shortcut
    document.addEventListener('add-section', () => this.addSection());
  }

  setMode(mode: 'builder' | 'preview') {
    this.state.mode.set(mode);
    if (mode === 'builder') this.lastSubmittedData = null;
  }

  addSection() { this.state.addSection(); }

  handleImport(json: string) {
    if (this.state.importDocType(json)) {
      this.showImport = false;
    } else {
      alert('Invalid JSON schema. Please check the format.');
    }
  }

  onFormSubmit(data: any) {
    this.lastSubmittedData = data;
    console.log('[Preview Mode] Form Submitted:', data);
  }

  // Sidebar resizing
  startResize(e: MouseEvent) {
    this.isResizing.set(true);
    e.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isResizing()) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 200 && newWidth < window.innerWidth * 0.7) {
      this.sidebarWidth.set(newWidth);
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isResizing.set(false);
  }

  exportJson() {
    const json = JSON.stringify(this.state.docType(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.state.docType().name.replace(/\s+/g, '_')}.json`;
    a.click();
  }
}
