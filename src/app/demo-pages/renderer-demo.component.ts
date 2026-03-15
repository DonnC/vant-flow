import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VfRenderer } from 'vant-flow';
import { EXAMPLE_DOCUMENT } from './example-data';

@Component({
  selector: 'app-renderer-demo',
  standalone: true,
  imports: [CommonModule, RouterLink, VfRenderer],
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
           <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
             <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span class="text-[10px] font-bold text-emerald-700 uppercase">Production Ready</span>
           </div>
        </div>
      </header>

      <main class="flex-1 py-10 px-4">
        <div class="max-w-4xl mx-auto">
          <div class="mb-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs leading-relaxed flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div>
              <p class="font-bold mb-1">Renderer Demo</p>
              <p>This page demonstrate the <code>&lt;vf-renderer&gt;</code> component loading a complex JSON schema with sections, columns, validation, and custom client-side scripting hooks.</p>
            </div>
          </div>
          
          <vf-renderer 
            [document]="schema" 
            (formSubmit)="onFormSubmit($event)"
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
    </div>
  `
})
export class RendererDemoComponent {
  schema = EXAMPLE_DOCUMENT;
  submittedData: any = null;

  onFormSubmit(data: any) {
    this.submittedData = data;
    console.log('[Renderer Demo] Form Submitted:', data);
  }

  onFormReady(frm: any) {
    console.log('[Renderer Demo] Form initialized with API context.');
  }
}
