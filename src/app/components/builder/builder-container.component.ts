import { Component, computed, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { BuilderStateService } from '../../services/builder-state.service';
import { FieldPaletteComponent } from './field-palette.component';
import { CanvasSectionComponent } from './canvas-section.component';
import { PropertyEditorComponent } from './property-editor.component';
import { ScriptEditorComponent } from './script-editor.component';
import { FormRendererComponent } from '../form-renderer/form-renderer.component';

type RightTab = 'properties' | 'script';

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
      <div class="flex flex-1 min-h-0">
        <!-- LEFT: Field Palette -->
        <aside class="w-52 shrink-0 bg-white border-r border-zinc-200 flex flex-col overflow-hidden">
          <app-field-palette></app-field-palette>
        </aside>

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
        <aside class="w-72 shrink-0 bg-white border-l border-zinc-200 flex flex-col overflow-hidden">
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
          </div>

          <!-- Tab content -->
          <div class="flex-1 overflow-hidden">
            @if (rightTab === 'properties') {
              <app-property-editor></app-property-editor>
            } @else {
              <app-script-editor></app-script-editor>
            }
          </div>
        </aside>
      </div>
    } @else {
      <!-- PREVIEW MODE -->
      <div class="flex-1 overflow-y-auto bg-zinc-50">
        <div class="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span class="text-xs font-medium text-amber-700">Preview Mode — Client scripts are active. Changes made here won't affect the builder.</span>
        </div>
        <app-form-renderer [docType]="state.docType()"></app-form-renderer>
      </div>
    }
  </div>
  `
})
export class BuilderContainerComponent implements OnInit {
    state = inject(BuilderStateService);
    rightTab: RightTab = 'properties';

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

    setMode(mode: 'builder' | 'preview') { this.state.mode.set(mode); }
    addSection() { this.state.addSection(); }

    exportJson() {
        const json = JSON.stringify(this.state.docType(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${this.state.docType().name.replace(/\s+/g, '_')}.json`;
        a.click();
    }
}
