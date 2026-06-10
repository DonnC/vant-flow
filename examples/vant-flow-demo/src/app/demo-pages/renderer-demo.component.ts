import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VfRenderer, VfBuilder, VfToastOutlet, VfUtilityService, VfMediaHandler, VfMediaHandlerContext, VfMediaHandlerPayload, VfRendererButtonEvent, VfRendererChangeEvent, VfFormContext, extractBaobabDocumentContract } from 'vant-flow';
import { DETACHED_CLIENT_SCRIPT, EXAMPLE_DOCUMENT } from './example-data';

@Component({
  selector: 'app-renderer-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, VfRenderer, VfBuilder, VfToastOutlet],
  template: `
    <div class="h-screen flex overflow-hidden bg-white selection:bg-indigo-500/20 text-zinc-900">
      <!-- Left Sidebar: Controls -->
      <aside class="w-[340px] flex-shrink-0 border-r border-zinc-200 bg-zinc-50/50 flex flex-col z-20 overflow-hidden">
        <header class="h-16 flex-shrink-0 px-6 flex items-center justify-between border-b border-zinc-200 bg-white">
          <div class="flex items-center gap-3">
            <a routerLink="/" class="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </a>
            <h2 class="text-xs font-black uppercase tracking-widest text-zinc-800">Runner Info</h2>
          </div>
          <div class="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </header>

        <div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <!-- Description -->
          <section>
             <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Context</p>
             <div class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 text-[11px] leading-relaxed text-indigo-900/70">
                Author, render, and control complex forms via host-driven logic.
             </div>
          </section>

          <!-- Host Controls -->
          <section>
            <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">Host Directives</p>
            <div class="space-y-1.5">

              <div class="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Run Form Scripts</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Enable/disable client-side JS</span>
                </div>
                <button type="button" (click)="runFormScripts = !runFormScripts"
                  class="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  [class.bg-zinc-900]="runFormScripts" [class.bg-zinc-200]="!runFormScripts">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [class.translate-x-4]="runFormScripts"></span>
                </button>
              </div>

              <div class="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Whole Form Readonly</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Lock all fields from the host</span>
                </div>
                <button type="button" (click)="hostReadonly = !hostReadonly"
                  class="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  [class.bg-zinc-900]="hostReadonly" [class.bg-zinc-200]="!hostReadonly">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [class.translate-x-4]="hostReadonly"></span>
                </button>
              </div>

              <div class="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Lock Review Fields</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Readonly batch/score fields</span>
                </div>
                <button type="button" (click)="lockReviewFields = !lockReviewFields"
                  class="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  [class.bg-zinc-900]="lockReviewFields" [class.bg-zinc-200]="!lockReviewFields">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [class.translate-x-4]="lockReviewFields"></span>
                </button>
              </div>

              <div class="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Hide Clearance</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Hide sensitive section fields</span>
                </div>
                <button type="button" (click)="hideClearanceSectionFields = !hideClearanceSectionFields"
                  class="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  [class.bg-zinc-900]="hideClearanceSectionFields" [class.bg-zinc-200]="!hideClearanceSectionFields">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [class.translate-x-4]="hideClearanceSectionFields"></span>
                </button>
              </div>

              <div class="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Hide Submit</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Remove submit from header</span>
                </div>
                <button type="button" (click)="hideSubmitAction = !hideSubmitAction"
                  class="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  [class.bg-zinc-900]="hideSubmitAction" [class.bg-zinc-200]="!hideSubmitAction">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [class.translate-x-4]="hideSubmitAction"></span>
                </button>
              </div>

              <div class="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Block Submit in Readonly</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Disable instead of hide</span>
                </div>
                <button type="button" (click)="disableSubmitWhileReadonly = !disableSubmitWhileReadonly"
                  class="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  [class.bg-zinc-900]="disableSubmitWhileReadonly" [class.bg-zinc-200]="!disableSubmitWhileReadonly">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [class.translate-x-4]="disableSubmitWhileReadonly"></span>
                </button>
              </div>


              <div class="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Section Navigator</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Sticky sidebar for sections</span>
                </div>
                <button type="button" (click)="showSectionNavigator = !showSectionNavigator"
                  class="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  [class.bg-zinc-900]="showSectionNavigator" [class.bg-zinc-200]="!showSectionNavigator">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [class.translate-x-4]="showSectionNavigator"></span>
                </button>
              </div>

              <div class="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 transition-all">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Show Baobab Contract</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Live extract of the current schema wrapper</span>
                </div>
                <button type="button" (click)="showBaobabContract = !showBaobabContract"
                  class="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
                  [class.bg-zinc-900]="showBaobabContract" [class.bg-zinc-200]="!showBaobabContract">
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [class.translate-x-4]="showBaobabContract"></span>
                </button>
              </div>

            </div>
          </section>

          @if (showBaobabContract) {
            <section>
              <div class="flex items-center justify-between mb-4">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Baobab Contract</p>
                <span class="text-[9px] font-bold uppercase italic text-indigo-500">
                  {{ baobabContract.fields.length }} fields
                </span>
              </div>
              <pre class="w-full max-h-80 overflow-auto rounded-2xl border border-zinc-800 bg-[#0a0c10] p-4 text-[10px] leading-relaxed text-cyan-300 custom-scrollbar">{{ baobabContractJson }}</pre>
            </section>
          }

          <!-- Metadata Editor -->
          <section>
            <div class="flex items-center justify-between mb-4">
              <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">Metadata Context</p>
              <div [class]="metadataError ? 'text-red-500' : 'text-emerald-500'" class="text-[9px] font-bold uppercase italic">
                {{ metadataError ? 'Invalid JSON' : 'Sync Active' }}
              </div>
            </div>
            <div class="relative group">
              <textarea
                class="w-full h-52 rounded-2xl border bg-[#0a0c10] text-emerald-400 font-mono text-[10px] leading-relaxed p-4 outline-none transition-all border-zinc-800 focus:border-indigo-500/50 shadow-inner custom-scrollbar"
                [ngModel]="metadataInput"
                (ngModelChange)="onMetadataInput($event)">
              </textarea>
            </div>
          </section>
        </div>

        <footer class="p-5 border-t border-zinc-200 bg-white">
           <button (click)="runValidation()" class="w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-800 active:scale-[0.98] shadow-lg shadow-zinc-200">
             Validate Form
           </button>
        </footer>
      </aside>

      <!-- Main Canvas -->
      <main class="flex-1 flex flex-col overflow-hidden bg-zinc-50 relative min-w-0">
        <header class="h-16 flex-shrink-0 px-8 flex items-center justify-between border-b border-zinc-100 bg-white/80 backdrop-blur-md z-10">
           <div class="flex items-center gap-4">
             <div class="h-8 w-8 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-white shadow-md">VF</div>
             <h1 class="text-xs font-black uppercase tracking-[0.1em] text-zinc-900 italic">Quality Inspection
               <span class="text-zinc-300 mx-1">/</span>
               <span class="text-zinc-500 font-medium normal-case italic">{{ activeView === 'form' ? 'Live Preview' : 'Schema Builder' }}</span>
             </h1>
           </div>
           <div class="flex items-center gap-4">
             <!-- View toggle pill -->
             <div class="flex items-center p-1 bg-zinc-100 rounded-xl gap-1">
               <button (click)="activeView = 'form'"
                 class="h-7 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                 [class.bg-white]="activeView === 'form'" [class.text-zinc-900]="activeView === 'form'"
                 [class.shadow-sm]="activeView === 'form'" [class.text-zinc-400]="activeView !== 'form'">
                 Form
               </button>
               <button (click)="activeView = 'builder'"
                 class="h-7 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                 [class.bg-white]="activeView === 'builder'" [class.text-zinc-900]="activeView === 'builder'"
                 [class.shadow-sm]="activeView === 'builder'" [class.text-zinc-400]="activeView !== 'builder'">
                 Builder
               </button>
             </div>
             <div class="px-3 py-1.5 rounded-full border flex items-center gap-2 transition-colors"
               [class.bg-emerald-500/10]="activeView === 'form'" [class.border-emerald-500/20]="activeView === 'form'"
               [class.bg-indigo-50]="activeView === 'builder'" [class.border-indigo-100]="activeView === 'builder'">
               <span class="w-1.5 h-1.5 rounded-full"
                 [class.bg-emerald-500]="activeView === 'form'" [class.bg-indigo-500]="activeView === 'builder'"
                 [class.animate-pulse]="activeView === 'builder'"></span>
               <span class="text-[9px] font-black uppercase tracking-widest"
                 [class.text-emerald-700]="activeView === 'form'" [class.text-indigo-700]="activeView === 'builder'">
                 {{ activeView === 'form' ? 'Production Mode' : 'Design Mode' }}
               </span>
             </div>
           </div>
        </header>

        <!-- Form View -->
        @if (activeView === 'form') {
          <div class="flex-1 overflow-y-auto p-12 lg:p-20 flex justify-center custom-scrollbar">
            <div class="w-full max-w-4xl animate-in fade-in duration-300">
              <vf-renderer
                [document]="schema"
                [runFormScripts]="runFormScripts"
                [readonly]="hostReadonly"
                [readonlyFields]="readonlyFields"
                [hiddenFields]="hiddenFields"
                [disabledActionButtons]="disabledActionButtons"
                [hiddenActionButtons]="hiddenActionButtons"
                [metadata]="runtimeMetadata"
                [clientScript]="activeClientScript"
                [mediaHandler]="mediaHandler"
                [showSectionNavigator]="showSectionNavigator"
                (formAction)="onFormAction($event)"
                (formChange)="onFormChange($event)"
                (formReady)="onFormReady($event)">
              </vf-renderer>
            </div>
          </div>
        }

        <!-- Builder View -->
        @if (activeView === 'builder') {
          <div class="flex-1 overflow-hidden relative animate-in fade-in duration-300">
            <vf-builder
              [initialSchema]="schema"
              [previewMetadata]="runtimeMetadata"
              [detachedClientScript]="activeClientScript"
              [useDetachedClientScript]="true"
              [showScriptEditor]="true"
              (clientScriptChange)="activeClientScript = $event"
              (schemaChange)="onSchemaChange($event)">
            </vf-builder>
          </div>
        }

        <!-- Submitted Data Overlay -->
        @if (submittedData) {
          <div class="absolute inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div class="w-full max-w-2xl bg-zinc-950 rounded-[2.5rem] border border-zinc-800 shadow-[0_32px_80px_rgba(0,0,0,0.5)] overflow-hidden">
              <div class="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                   <h4 class="text-xs font-black uppercase tracking-[0.2em] text-white">Submission Captured</h4>
                   <p class="text-[10px] text-zinc-500 mt-1 font-medium">Raw payload emitted by the renderer.</p>
                </div>
                <button (click)="submittedData = null" class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div class="p-8">
                 <pre class="bg-black/40 rounded-2xl p-6 text-[11px] text-emerald-400 font-mono overflow-auto max-h-[50vh] leading-relaxed custom-scrollbar border border-zinc-900">{{ submittedData | json }}</pre>
              </div>
              <div class="px-8 py-6 bg-zinc-900 flex justify-end">
                 <button (click)="submittedData = null" class="px-6 py-2 bg-white text-[10px] font-black uppercase tracking-widest text-zinc-950 rounded-full transition-transform active:scale-95">Close</button>
              </div>
            </div>
          </div>
        }

        <vf-toast-outlet></vf-toast-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      @apply bg-zinc-200 rounded-full;
    }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb {
      @apply bg-zinc-300;
    }
  `]
})
export class RendererDemoComponent {
  @ViewChild(VfRenderer) renderer?: VfRenderer;
  private utils = inject(VfUtilityService);
  schema = EXAMPLE_DOCUMENT;
  activeClientScript = DETACHED_CLIENT_SCRIPT;
  submittedData: any = null;
  runtimeMetadata = this.getDefaultMetadata();
  metadataInput = JSON.stringify(this.runtimeMetadata, null, 2);
  metadataError: string | null = null;
  showBaobabContract = true;

  // View toggle: 'form' | 'builder'
  showSectionNavigator = true;

  activeView: 'form' | 'builder' = 'form';


  // Discrete state for controls
  private _runFormScripts = true;
  private _hostReadonly = false;
  private _lockReviewFields = true;
  private _hideClearanceSectionFields = false;
  private _hideSubmitAction = false;
  private _disableSubmitWhileReadonly = true;

  // Setters/Getters for two-way binding in template
  get runFormScripts() { return this._runFormScripts; }
  set runFormScripts(v: boolean) { this._runFormScripts = v; }

  get hostReadonly() { return this._hostReadonly; }
  set hostReadonly(v: boolean) { this._hostReadonly = v; }

  get lockReviewFields() { return this._lockReviewFields; }
  set lockReviewFields(v: boolean) { this._lockReviewFields = v; }

  get hideClearanceSectionFields() { return this._hideClearanceSectionFields; }
  set hideClearanceSectionFields(v: boolean) { this._hideClearanceSectionFields = v; }

  get hideSubmitAction() { return this._hideSubmitAction; }
  set hideSubmitAction(v: boolean) { this._hideSubmitAction = v; }

  get disableSubmitWhileReadonly() { return this._disableSubmitWhileReadonly; }
  set disableSubmitWhileReadonly(v: boolean) { this._disableSubmitWhileReadonly = v; }

  get readonlyFields() {
    return this._lockReviewFields
      ? ['batch_id', 'quality_score', 'btn_request_clearance']
      : [];
  }

  get hiddenFields() {
    return this._hideClearanceSectionFields
      ? ['clearance_request', 'btn_request_clearance']
      : [];
  }

  get disabledActionButtons() {
    return this._disableSubmitWhileReadonly ? ['submit'] : [];
  }

  get hiddenActionButtons() {
    return this._hideSubmitAction ? ['submit'] : [];
  }

  get baobabContract() {
    return extractBaobabDocumentContract(this.schema);
  }

  get baobabContractJson() {
    return JSON.stringify(this.baobabContract, null, 2);
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
  }

  onFormChange(event: VfRendererChangeEvent) {
    if (['quality_score', 'batch_id'].includes(event.fieldname)) {
      event.frm.validate();
    }
  }

  onFormReady(frm: VfFormContext) {
    console.log('[Renderer Demo] Form initialized with API context.');

    // Demonstrate scripted printing
    // The user can now purely drive printing from a custom button action
    frm.add_custom_button('Print Report', (f) => f.print(), 'secondary');
  }

  onSchemaChange(newSchema: any) {
    this.schema = newSchema;
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
      tenant: {
        id: 'acme',
        name: 'Acme Manufacturing'
      },
      host: {
        mode: 'strict'
      },
      featureFlags: {
        clearanceOverride: true
      }
    };
  }
}
