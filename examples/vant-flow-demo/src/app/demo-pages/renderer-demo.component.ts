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
    <div class="h-screen flex overflow-hidden bg-white selection:bg-indigo-500/20 text-zinc-900">
      <!-- Left Sidebar: Controls -->
      <aside class="w-[380px] flex-shrink-0 border-r border-zinc-200 bg-zinc-50/50 flex flex-col z-20 overflow-hidden">
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
            <div class="space-y-2">
              <!-- Run Form Scripts -->
              <label class="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-sm cursor-pointer">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Run Form Scripts</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Enable/disable client-side JS</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" class="sr-only peer" [(ngModel)]="runFormScripts">
                   <div class="w-8 h-4.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
                </div>
              </label>

              <!-- Whole Form Readonly -->
              <label class="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-sm cursor-pointer">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Whole Form Readonly</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Lock all fields from the host</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" class="sr-only peer" [(ngModel)]="hostReadonly">
                   <div class="w-8 h-4.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
                </div>
              </label>

              <!-- Lock Review Fields -->
              <label class="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-sm cursor-pointer">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Lock Review Fields</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Readonly batch/score fields</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" class="sr-only peer" [(ngModel)]="lockReviewFields">
                   <div class="w-8 h-4.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
                </div>
              </label>

              <!-- Hide Clearance -->
              <label class="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-sm cursor-pointer">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Hide Clearance</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Hide sensitive section fields</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" class="sr-only peer" [(ngModel)]="hideClearanceSectionFields">
                   <div class="w-8 h-4.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
                </div>
              </label>

              <!-- Hide Submit -->
              <label class="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-sm cursor-pointer">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Hide Submit</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Remove submit from header</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" class="sr-only peer" [(ngModel)]="hideSubmitAction">
                   <div class="w-8 h-4.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
                </div>
              </label>

              <!-- Block Submit -->
              <label class="group flex items-center justify-between p-3.5 rounded-2xl bg-white border border-zinc-200 transition-all hover:border-zinc-300 hover:shadow-sm cursor-pointer">
                <div class="flex flex-col">
                  <span class="text-[11px] font-bold text-zinc-700 tracking-tight">Block Submit in Readonly</span>
                  <span class="text-[9px] text-zinc-400 font-medium">Disable instead of hide</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" class="sr-only peer" [(ngModel)]="disableSubmitWhileReadonly">
                   <div class="w-8 h-4.5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-zinc-900"></div>
                </div>
              </label>
            </div>
          </section>

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
                class="w-full h-64 rounded-2xl border bg-[#0a0c10] text-emerald-400 font-mono text-[10px] leading-relaxed p-4 outline-none transition-all border-zinc-800 focus:border-indigo-500/50 shadow-inner custom-scrollbar"
                [ngModel]="metadataInput"
                (ngModelChange)="onMetadataInput($event)">
              </textarea>
              <div class="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span class="text-[8px] font-bold uppercase tracking-widest text-zinc-600">JSON Editor</span>
              </div>
            </div>
          </section>
        </div>

        <footer class="p-6 border-t border-zinc-200 bg-white">
           <button (click)="runValidation()" class="w-full py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-800 active:scale-[0.98] shadow-lg shadow-zinc-200">
             Validate Form
           </button>
        </footer>
      </aside>

      <!-- Main Canvas: Renderer -->
      <main class="flex-1 flex flex-col overflow-hidden bg-zinc-50 relative">
        <header class="h-16 flex-shrink-0 px-8 flex items-center justify-between border-b border-zinc-100 bg-white/80 backdrop-blur-md z-10">
           <div class="flex items-center gap-4">
             <div class="h-8 w-8 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] font-black text-white shadow-md">VF</div>
             <h1 class="text-xs font-black uppercase tracking-[0.1em] text-zinc-900 italic">Quality Inspection <span class="text-zinc-300 mx-1">/</span> <span class="text-zinc-500 font-medium normal-case italic">Live Preview</span></h1>
           </div>
           <div class="flex items-center gap-2">
             <a routerLink="/demo/builder-host-controls" class="text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors mr-4">Switch to Builder Demo</a>
             <div class="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
               <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               <span class="text-[9px] font-black uppercase tracking-widest text-emerald-700">Production Mode</span>
             </div>
           </div>
        </header>

        <div class="flex-1 overflow-y-auto p-12 lg:p-20 flex justify-center custom-scrollbar">
          <div class="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
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

            <!-- Submission Overlay -->
            @if (submittedData) {
              <div class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-300" (click)="$event.stopPropagation()">
                <div class="w-full max-w-2xl bg-zinc-950 rounded-[2.5rem] border border-zinc-800 shadow-[0_32px_80px_rgba(0,0,0,0.5)] overflow-hidden" (click)="$event.stopPropagation()">
                  <div class="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                       <h4 class="text-xs font-black uppercase tracking-[0.2em] text-white">Submission Captured</h4>
                       <p class="text-[10px] text-zinc-500 mt-1 font-medium">Review the raw schema payload emitted by the renderer.</p>
                    </div>
                    <button (click)="submittedData = null" class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                  <div class="p-8">
                     <pre class="bg-black/40 rounded-2xl p-6 text-[11px] text-emerald-400 font-mono overflow-auto max-h-[50vh] leading-relaxed custom-scrollbar border border-zinc-900">{{ submittedData | json }}</pre>
                  </div>
                  <div class="px-8 py-6 bg-zinc-900 flex justify-end">
                     <button (click)="submittedData = null" class="px-6 py-2 bg-white text-[10px] font-black uppercase tracking-widest text-zinc-950 rounded-full transition-transform active:scale-95">Close Inspector</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

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
  submittedData: any = null;
  runtimeMetadata = this.getDefaultMetadata();
  metadataInput = JSON.stringify(this.runtimeMetadata, null, 2);
  metadataError: string | null = null;

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
