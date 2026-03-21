import { Component, computed, inject, HostListener, OnInit, OnChanges, SimpleChanges, signal, effect, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { VfBuilderState } from '../../services/builder-state.service';
import { VfUtilityService } from '../../services/app-utility.service';
import { VfPalette } from './field-palette.component';
import { VfCanvasSection } from './canvas-section.component';
import { VfPropertyEditor } from './property-editor.component';
import { VfScriptEditor } from './script-editor.component';
import { VfRenderer } from '../form-renderer/form-renderer.component';
import { DocumentDefinition } from '../../models/document.model';
import { VfUiPrimitivesModule } from '../../ui/ui-primitives.module';
import { VfDashedAction } from '../shared/dashed-action.component';
import { VfEmptyState } from '../shared/empty-state.component';
import { VfEyebrow } from '../shared/eyebrow.component';
import { VfIconButton } from '../shared/icon-button.component';
import { VfTopSheet } from '../shared/top-sheet.component';

type RightTab = 'properties' | 'script';

@Component({
  selector: 'vf-builder',
  standalone: true,
  providers: [VfBuilderState],
  imports: [
    CommonModule, FormsModule, DragDropModule,
    VfPalette, VfCanvasSection, VfPropertyEditor,
    VfScriptEditor, VfRenderer, VfUiPrimitivesModule,
    VfDashedAction, VfEmptyState, VfEyebrow, VfIconButton, VfTopSheet
  ],
  template: `
  <div class="flex flex-col h-full bg-zinc-100 overflow-hidden">
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
        <span class="text-sm font-semibold text-zinc-800">VantFlow</span>
      </div>

      <!-- Document Name edit -->
      <input
        class="text-sm font-medium bg-transparent border-none outline-none text-zinc-700 w-48
               hover:bg-zinc-50 focus:bg-white focus:border focus:border-zinc-200 focus:px-2 focus:rounded-md px-1 py-1 transition-all"
        [ngModel]="state.document().name"
        (ngModelChange)="state.setDocumentName($event)"
        placeholder="Document Name"
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

      <!-- Import / Export -->
      <div class="flex items-center gap-2">
        <button (click)="showImport = !showImport" class="ui-btn-ghost ui-btn-sm gap-1.5" [class.bg-zinc-100]="showImport">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 10 12 15 7 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Import
        </button>
        <button (click)="showExport = !showExport" class="ui-btn-secondary ui-btn-sm gap-1.5" [class.bg-zinc-100]="showExport">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>
      </div>
    </header>

    <!-- Global Import Overlay -->
    @if (showImport) {
      <vf-top-sheet
        title="Import Document Schema"
        description="Paste your previously exported Document JSON schema to load the builder state."
        (closed)="showImport = false">
          <textarea #importArea class="w-full h-64 bg-zinc-50 border border-zinc-200 rounded-lg p-4 font-mono text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder='{ "name": "Form Name", "sections": [...] }'></textarea>
          <div class="flex justify-end gap-3">
            <button (click)="showImport = false" class="ui-btn-secondary">Cancel</button>
            <button (click)="handleImport(importArea.value)" class="ui-btn-primary px-8">Load Schema</button>
          </div>
      </vf-top-sheet>
    }

    <!-- Global Export Overlay -->
    @if (showExport) {
      <vf-top-sheet
        title="Export Document Schema"
        description="Preview and copy your form schema, or download it as a JSON file."
        (closed)="showExport = false">
          <pre class="w-full h-64 overflow-auto bg-zinc-900 text-indigo-300 rounded-lg p-4 font-mono text-[11px] select-all leading-relaxed">{{ state.document() | json }}</pre>
          <div class="flex justify-end gap-3">
            <button (click)="showExport = false" class="ui-btn-secondary">Close</button>
            <button (click)="downloadJson()" class="ui-btn-primary px-8">Download JSON File</button>
          </div>
      </vf-top-sheet>
    }

    <!-- ── Main Layout ───────────────────────────────────── -->
    @if (state.mode() === 'builder') {
      <div class="flex flex-1 min-h-0 relative">
        <!-- LEFT: Field Palette -->
        <aside 
          class="shrink-0 bg-white border-r border-zinc-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out relative group"
          [style.width.px]="leftSidebarVisible() ? 208 : 0"
        >
          <!-- Form Settings Trigger -->
          <div class="px-3 py-4 border-b border-zinc-100 shrink-0">
            <button 
              (click)="state.selectFormSettings()"
              class="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group/btn"
              [class.bg-indigo-50]="state.showFormSettings()"
              [class.text-indigo-600]="state.showFormSettings()"
              [class.text-zinc-500]="!state.showFormSettings()"
              [class.hover:bg-zinc-50]="!state.showFormSettings()"
            >
              <div class="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="group-hover/btn:rotate-45 transition-transform duration-500">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span class="text-xs font-bold uppercase tracking-wider">Form Settings</span>
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="opacity-40"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <vf-palette class="flex-1 overflow-hidden" [connectedLists]="allColumnIds()"></vf-palette>
          
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
          @if (state.document().is_stepper) {
            <!-- Stepper Builder View -->
            <div class="flex gap-4 h-full min-h-[500px]">
              <!-- Step List Sidebar -->
              <div class="w-48 shrink-0 flex flex-col gap-2">
                <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-1">Steps</div>
                @for (step of state.document().steps; track step.id; let i = $index) {
                  <div 
                    (click)="state.selectStep(step.id)"
                    class="group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all border"
                    [class.bg-white]="state.selectedStepId() === step.id"
                    [class.border-indigo-200]="state.selectedStepId() === step.id"
                    [class.shadow-sm]="state.selectedStepId() === step.id"
                    [class.bg-zinc-50]="state.selectedStepId() !== step.id"
                    [class.border-transparent]="state.selectedStepId() !== step.id"
                  >
                    <div class="flex items-center gap-2 overflow-hidden">
                      <span class="text-[10px] font-mono text-zinc-400 w-4">{{ i + 1 }}</span>
                      <span class="text-xs font-medium truncate" [class.text-indigo-600]="state.selectedStepId() === step.id">{{ step.title }}</span>
                    </div>
                    <vf-icon-button (pressed)="state.removeStep(step.id); $event.stopPropagation()" class="opacity-0 group-hover:opacity-100 transition-opacity" tone="danger">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </vf-icon-button>
                  </div>
                }
                <button (click)="state.addStep()" class="mt-2 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 px-2 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  ADD STEP
                </button>
              </div>

              <!-- Step Content (Sections) -->
              <div class="flex-1 bg-white/50 rounded-xl border-2 border-dashed border-zinc-200 p-4">
                @if (state.selectedStep()) {
                  @for (section of state.selectedStep()!.sections; track section.id) {
                    <vf-canvas-section
                      [section]="section"
                      [allColumnIds]="allColumnIds()"
                    ></vf-canvas-section>
                  }
                  <vf-dashed-action
                    [label]="'Add Section to ' + state.selectedStep()!.title"
                    [subtle]="true"
                    (pressed)="state.addSection(state.selectedStepId()!)">
                  </vf-dashed-action>
                } @else {
                  <div class="h-full flex flex-col items-center justify-center text-zinc-400 text-sm italic">
                    Select a step to edit its contents
                  </div>
                }
              </div>
            </div>
          } @else {
            <!-- Legacy Flat Builder View -->
            @if (state.document().sections.length === 0) {
              <!-- Empty state -->
              <vf-empty-state
                title="Start Building"
                description="Add a Section from the left panel, then drag fields into it to build your form layout"
                actionLabel="Add First Section"
                iconPath="M3 3h18v18H3z | M9 9h6 | M9 12h6 | M9 15h4"
                (action)="addSection()">
              </vf-empty-state>
            } @else {
              @for (section of state.document().sections; track section.id) {
                <vf-canvas-section
                  [section]="section"
                  [allColumnIds]="allColumnIds()"
                ></vf-canvas-section>
              }
              <vf-dashed-action
                label="Add Section"
                [subtle]="true"
                (pressed)="addSection()">
              </vf-dashed-action>
            }
          }
        </main>

        <!-- RIGHT: Tools panel -->
        <div 
          class="w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors z-20 shrink-0"
          (mousedown)="startResize($event)"
          [class.bg-indigo-500]="isResizing()"
        ></div>

        @if (!rightSidebarVisible()) {
          <button 
            (click)="rightSidebarVisible.set(true)"
            class="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 bg-white border border-r-0 border-zinc-200 rounded-l-md flex items-center justify-center hover:bg-zinc-50 transition-all shadow-sm z-20 group"
          >
            <div class="w-1 h-3 bg-zinc-300 rounded-full group-hover:bg-indigo-400"></div>
          </button>
        }

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
            @if (state.showFormSettings()) {
              <button
                (click)="rightTab = 'script'"
                class="flex-1 py-2.5 text-xs font-medium transition-colors border-l border-zinc-100"
                [class.text-indigo-600]="rightTab === 'script'"
                [class.border-b-2]="rightTab === 'script'"
                [class.border-indigo-500]="rightTab === 'script'"
                [class.text-zinc-400]="rightTab !== 'script'"
              >
                <span class="flex items-center justify-center gap-1">
                  Script
                  @if (state.document().client_script?.trim()) {
                    <span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                  }
                </span>
              </button>
            }
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-hidden">
            @if (rightTab === 'properties') {
              <vf-property-editor></vf-property-editor>
            } @else {
              <vf-script-editor></vf-script-editor>
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
        
        <div class="w-full max-w-6xl px-4 pt-6">
          <div class="rounded-2xl border border-sky-200 bg-white shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-sky-100 bg-sky-50/80 flex items-start justify-between gap-4">
              <div>
                <vf-eyebrow label="Test frm.metadata" tone="sky"></vf-eyebrow>
                <p class="text-xs text-sky-900/80 mt-1">This JSON feeds <code>frm.metadata</code> in preview so scripts that depend on host metadata can run correctly. It is not saved to the schema or included in export.</p>
              </div>
              <vf-eyebrow label="Preview Only" tone="sky"></vf-eyebrow>
            </div>
            <div class="p-5 space-y-3">
              <textarea
                class="w-full min-h-44 rounded-xl border bg-zinc-950 text-emerald-300 font-mono text-[11px] leading-relaxed p-4 outline-none transition-all"
                [class.border-red-300]="previewMetadataError"
                [class.focus:border-red-400]="previewMetadataError"
                [class.border-zinc-800]="!previewMetadataError"
                [class.focus:border-sky-400]="!previewMetadataError"
                [ngModel]="previewMetadataInput"
                (ngModelChange)="onPreviewMetadataInput($event)"
                placeholder="{&#10;  &quot;currentUser&quot;: { &quot;role&quot;: &quot;Manager&quot; }&#10;}">
              </textarea>

              @if (previewMetadataError) {
                <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {{ previewMetadataError }}
                </div>
              } @else {
                <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                  Preview is using the JSON above as the current runtime metadata object.
                </div>
              }
            </div>
          </div>
        </div>

        <vf-renderer class="w-full" [document]="state.document()" [metadata]="previewMetadataValue" (formAction)="onFormAction($event)"></vf-renderer>

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
export class VfBuilder implements OnInit, OnChanges {
  /** Initial form schema to load into the builder. */
  @Input() initialSchema?: DocumentDefinition;
  /** Optional runtime-only metadata used while testing scripts in preview mode. */
  @Input() previewMetadata?: Record<string, any>;

  /** Emitted whenever the form schema is modified in the builder. */
  @Output() schemaChange = new EventEmitter<DocumentDefinition>();

  state = inject(VfBuilderState);
  utils = inject(VfUtilityService);
  rightTab: RightTab = 'properties';
  showImport = false;
  showExport = false;
  lastSubmittedData: any = null;
  previewMetadataValue: Record<string, any> = {};
  previewMetadataInput = this.stringifyPreviewMetadata(this.getDefaultPreviewMetadata());
  previewMetadataError: string | null = null;

  // Sidebar controls
  leftSidebarVisible = signal(true);
  rightSidebarVisible = signal(true);
  sidebarWidth = signal(288);
  isResizing = signal(false);

  constructor() {
    // Auto-focus properties tab when a field, section, or step is selected
    effect(() => {
      if (this.state.selectedFieldId() || this.state.selectedSectionId() || this.state.selectedStepId()) {
        this.rightTab = 'properties';
        this.rightSidebarVisible.set(true);
      }
    }, { allowSignalWrites: true });

    // Emit schema changes to parent
    effect(() => {
      const doc = this.state.document();
      this.schemaChange.emit(doc);
    });
  }

  allColumnIds = computed(() => {
    const doc = this.state.document();
    if (!doc.is_stepper) {
      return doc.sections.flatMap(s => s.columns.map(c => c.id));
    }
    // In stepper mode, ONLY connect to columns on the active/selected step
    const activeStep = this.state.selectedStep();
    if (!activeStep) return [];
    return activeStep.sections.flatMap(s => s.columns.map(c => c.id));
  });

  fieldCount = computed(() => {
    const doc = this.state.document();
    const sections = doc.is_stepper ? (doc.steps?.flatMap(s => s.sections) || []) : doc.sections;
    return sections.reduce((total, s) =>
      total + s.columns.reduce((ct, c) => ct + c.fields.length, 0), 0);
  });

  sectionCount = computed(() => {
    const doc = this.state.document();
    return doc.is_stepper ? (doc.steps?.reduce((acc, s) => acc + s.sections.length, 0) || 0) : doc.sections.length;
  });

  stepCount = computed(() => this.state.document().steps?.length || 0);

  ngOnInit() {
    if (this.initialSchema) {
      this.state.document.set({ ...this.initialSchema });
    }
    this.applyPreviewMetadataInput(this.previewMetadata ?? this.getDefaultPreviewMetadata());
    // listen for palette's section add shortcut
    document.addEventListener('add-section', () => this.addSection());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['previewMetadata'] && !changes['previewMetadata'].firstChange) {
      this.applyPreviewMetadataInput(changes['previewMetadata'].currentValue ?? this.getDefaultPreviewMetadata());
    }
  }

  setMode(mode: 'builder' | 'preview') {
    this.state.mode.set(mode);
    if (mode === 'builder') this.lastSubmittedData = null;
  }

  onPreviewMetadataInput(value: string) {
    this.previewMetadataInput = value;
    this.parsePreviewMetadata(value);
  }

  addSection() { this.state.addSection(); }

  handleImport(json: string) {
    if (this.state.importDocument(json)) {
      this.showImport = false;
    } else {
      alert('Invalid JSON schema. Please check the format.');
    }
  }

  onFormAction(event: any) {
    this.lastSubmittedData = event?.data ?? event;
    console.log('[Preview Mode] Action Triggered:', event);
  }

  private applyPreviewMetadataInput(metadata: Record<string, any>) {
    const value = this.stringifyPreviewMetadata(metadata);
    this.previewMetadataInput = value;
    this.parsePreviewMetadata(value);
  }

  private parsePreviewMetadata(raw: string) {
    try {
      const parsed = raw.trim() ? JSON.parse(raw) : {};
      if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
        this.previewMetadataError = 'Runtime metadata must be a JSON object.';
        return;
      }

      this.previewMetadataValue = parsed;
      this.previewMetadataError = null;
    } catch {
      this.previewMetadataError = 'Invalid JSON. Preview keeps using the last valid metadata object.';
    }
  }

  private stringifyPreviewMetadata(metadata: Record<string, any>) {
    return JSON.stringify(metadata, null, 2);
  }

  private getDefaultPreviewMetadata(): Record<string, any> {
    return {
      currentUser: {
        name: 'Alice Manager',
        role: 'Manager'
      },
      inspectionMode: 'strict',
      maxTransactionLimit: 5000,
      featureFlags: {
        clearanceOverride: true
      }
    };
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

  downloadJson() {
    const json = JSON.stringify(this.state.document(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.state.document().name.replace(/\s+/g, '_')}.json`;
    a.click();
    this.showExport = false;
  }
}
