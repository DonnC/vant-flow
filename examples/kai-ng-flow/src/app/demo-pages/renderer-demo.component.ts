import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VfRenderer, VfToastOutlet, VfUtilityService, VfMediaHandler, VfMediaHandlerContext, VfMediaHandlerPayload, VfRendererButtonEvent, VfRendererChangeEvent, VfFormContext } from 'vant-flow';
import { EXAMPLE_DOCUMENT } from './example-data';

@Component({
  selector: 'app-renderer-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, VfRenderer, VfToastOutlet],
  template: `
    <div class="min-h-screen bg-zinc-50 flex flex-col">
      <header class="bg-white border-b border-zinc-200 px-4 py-2 flex items-center justify-between z-40 sticky top-0 shadow-sm">
        <div class="flex items-center gap-3">
          <a routerLink="/" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </a>
          <div>
            <h2 class="text-sm font-bold text-zinc-800 tracking-tight">Vant Flow Renderer</h2>
            <p class="text-[10px] text-zinc-400 font-medium">Previewing Quality Inspection Report</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
           <a routerLink="/demo/builder-host-controls" class="ui-btn-secondary ui-btn-sm">
             Builder Host Controls
           </a>
           <button type="button" (click)="runValidation()" class="ui-btn-secondary ui-btn-sm">
             Validate Form
           </button>
           <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
             <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span class="text-[10px] font-bold text-emerald-700 uppercase">Production Ready</span>
           </div>
        </div>
      </header>

      <main class="flex-1 py-10 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="mb-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs leading-relaxed flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>
              <p class="font-bold mb-1">Renderer Demo</p>
              <p>This page demonstrates the <code>&lt;vf-renderer&gt;</code> component loading a complex JSON schema with host-controlled field/button state, metadata injection, validation, and client-side scripting hooks.</p>
            </div>
          </div>

          <div class="mb-8 rounded-2xl border border-amber-200 bg-white shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-amber-100 bg-amber-50/80 flex items-start justify-between gap-4">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">Host Controls</p>
                <p class="text-xs text-amber-900/80 mt-1">These toggles are driven from Angular host code and passed into <code>&lt;vf-renderer&gt;</code> through <code>readonly</code>, <code>readonlyFields</code>, <code>hiddenFields</code>, <code>disabledActionButtons</code>, and <code>hiddenActionButtons</code>.</p>
              </div>
              <span class="px-2 py-1 rounded-full border border-amber-200 bg-white text-[10px] font-bold uppercase tracking-widest text-amber-700">Host App</span>
            </div>
            <div class="p-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <label class="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" [ngModel]="runFormScripts" (ngModelChange)="runFormScripts = !!$event">
                <span>
                  <span class="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">Run Form Scripts</span>
                  <span class="block text-xs text-zinc-500">Turn off schema client scripts entirely. This suppresses refresh handlers, field event handlers, and schema action scripts.</span>
                </span>
              </label>

              <label class="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" [ngModel]="hostReadonly" (ngModelChange)="hostReadonly = !!$event">
                <span>
                  <span class="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">Whole Form Readonly</span>
                  <span class="block text-xs text-zinc-500">Lets you compare full-form readonly with field-level readonly arrays.</span>
                </span>
              </label>

              <label class="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" [ngModel]="lockReviewFields" (ngModelChange)="lockReviewFields = !!$event">
                <span>
                  <span class="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">Readonly Selected Fields</span>
                  <span class="block text-xs text-zinc-500">Locks <code>batch_id</code>, <code>quality_score</code>, and the clearance button field only.</span>
                </span>
              </label>

              <label class="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" [ngModel]="hideClearanceSectionFields" (ngModelChange)="hideClearanceSectionFields = !!$event">
                <span>
                  <span class="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">Hide Clearance Fields</span>
                  <span class="block text-xs text-zinc-500">Hides the text editor and field-level button in the clearance area.</span>
                </span>
              </label>

              <label class="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" [ngModel]="hideSubmitAction" (ngModelChange)="hideSubmitAction = !!$event">
                <span>
                  <span class="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">Hide Submit Action</span>
                  <span class="block text-xs text-zinc-500">Removes the renderer header submit button through <code>hiddenActionButtons</code>.</span>
                </span>
              </label>

              <label class="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 md:col-span-2 xl:col-span-2">
                <input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" [ngModel]="disableSubmitWhileReadonly" (ngModelChange)="disableSubmitWhileReadonly = !!$event">
                <span>
                  <span class="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">Disable Submit During Readonly</span>
                  <span class="block text-xs text-zinc-500">This uses <code>disabledActionButtons</code>. Turn on whole-form readonly above to see the submit action become disabled instead of hidden.</span>
                </span>
              </label>
            </div>
          </div>

          <div class="mb-8 rounded-2xl border border-sky-200 bg-white shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-sky-100 bg-sky-50/80 flex items-start justify-between gap-4">
              <div>
                <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Test frm.metadata</p>
                <p class="text-xs text-sky-900/80 mt-1">Edit this JSON to feed <code>frm.metadata</code> in the renderer so scripts that depend on metadata can run correctly. It is client-side test data only and is not persisted with the schema.</p>
              </div>
              <span class="px-2 py-1 rounded-full border border-sky-200 bg-white text-[10px] font-bold uppercase tracking-widest text-sky-700">Client Side</span>
            </div>
            <div class="p-5 space-y-3">
              <textarea
                class="w-full min-h-44 rounded-xl border bg-zinc-950 text-emerald-300 font-mono text-[11px] leading-relaxed p-4 outline-none transition-all"
                [class.border-red-300]="metadataError"
                [class.focus:border-red-400]="metadataError"
                [class.border-zinc-800]="!metadataError"
                [class.focus:border-sky-400]="!metadataError"
                [ngModel]="metadataInput"
                (ngModelChange)="onMetadataInput($event)">
              </textarea>

              @if (metadataError) {
                <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {{ metadataError }}
                </div>
              } @else {
                <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                  The renderer is currently using the JSON above as <code>frm.metadata</code>.
                </div>
              }
            </div>
          </div>
          
          <vf-renderer 
            [document]="schema" 
            [runFormScripts]="runFormScripts"
            [readonly]="hostReadonly"
            [readonlyFields]="readonlyFields"
            [hiddenFields]="hiddenFields"
            [disabledActionButtons]="disabledActionButtons"
            [hiddenActionButtons]="hiddenActionButtons"
            [metadata]="runtimeMetadata"
            [mediaHandler]="mediaHandler"
            (formAction)="onFormAction($event)"
            (formChange)="onFormChange($event)"
            (formReady)="onFormReady($event)">
          </vf-renderer>

          @if (submittedData) {
            <div class="mt-8 p-6 bg-zinc-900 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-xs font-bold uppercase tracking-widest text-zinc-400">Captured Submission Data</h4>
                <button (click)="submittedData = null" class="text-[10px] text-zinc-500 hover:text-white underline">Clear</button>
              </div>
              <pre class="text-[11px] text-emerald-400 font-mono bg-black/30 p-4 rounded-xl overflow-auto max-h-96 leading-relaxed">{{ submittedData | json }}</pre>
            </div>
          }
        </div>
      </main>
      <vf-toast-outlet></vf-toast-outlet>
    </div>
  `
})
export class RendererDemoComponent {
  @ViewChild(VfRenderer) renderer?: VfRenderer;
  private utils = inject(VfUtilityService);
  schema = EXAMPLE_DOCUMENT;
  submittedData: any = null;
  runtimeMetadata = this.getDefaultMetadata();
  metadataInput = JSON.stringify(this.runtimeMetadata, null, 2);
  metadataError: string | null = null;
  runFormScripts = true;
  hostReadonly = false;
  lockReviewFields = true;
  hideClearanceSectionFields = false;
  hideSubmitAction = false;
  disableSubmitWhileReadonly = true;

  get readonlyFields() {
    return this.lockReviewFields
      ? ['batch_id', 'quality_score', 'btn_request_clearance']
      : [];
  }

  get hiddenFields() {
    return this.hideClearanceSectionFields
      ? ['clearance_request', 'btn_request_clearance']
      : [];
  }

  get disabledActionButtons() {
    return this.disableSubmitWhileReadonly ? ['submit'] : [];
  }

  get hiddenActionButtons() {
    return this.hideSubmitAction ? ['submit'] : [];
  }

  onMetadataInput(value: string) {
    this.metadataInput = value;

    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
        this.metadataError = 'Runtime metadata must be a JSON object.';
        return;
      }

      this.runtimeMetadata = parsed;
      this.metadataError = null;
    } catch {
      this.metadataError = 'Invalid JSON. The renderer is still using the last valid metadata object.';
    }
  }

  onFormAction(event: VfRendererButtonEvent) {
    this.submittedData = event?.data ?? event;
    console.log('[Renderer Demo] Action Triggered:', event);

    if (event?.action === 'submit') {
      if (!event.frm.validate()) {
        return;
      }
      this.utils.show_alert(`Renderer action: ${event.buttonName}`, 'success');
      return;
    }

    if (event?.action === 'approve' && !event.frm.validate()) {
      return;
    }

    this.utils.show_alert(`Renderer action: ${event?.buttonName || event?.action}`, 'info');
    // TODO: Move renderer button handling into a shared host-level workflow callback/service
    // once the demo app has a centralized action orchestration layer.
  }

  onFormChange(event: VfRendererChangeEvent) {
    if (['quality_score', 'batch_id'].includes(event.fieldname)) {
      event.frm.validate();
    }
  }

  onFormReady(frm: VfFormContext) {
    console.log('[Renderer Demo] Form initialized with API context.');
  }

  mediaHandler: VfMediaHandler = async (payload: VfMediaHandlerPayload, context: VfMediaHandlerContext) => {
    if (!context.frm.validate()) {
      throw new Error('Please fix validation issues before uploading media.');
    }

    this.utils.show_alert(`Handling ${context.fieldtype.toLowerCase()} for ${context.fieldname}`, 'info');
    return payload.fieldtype === 'Attach'
      ? `mock://uploads/${context.fieldname}`
      : `data:${context.fieldtype.toLowerCase()}`;
  };

  runValidation() {
    const valid = this.renderer?.validate();
    this.utils.show_alert(valid ? 'Validation passed.' : 'Validation found issues.', valid ? 'success' : 'warning');
  }

  private getDefaultMetadata() {
    return {
      currentUser: {
        name: 'Alice Manager',
        role: 'Manager'
      },
      inspectionMode: 'strict',
      featureFlags: {
        clearanceOverride: true
      }
    };
  }
}
