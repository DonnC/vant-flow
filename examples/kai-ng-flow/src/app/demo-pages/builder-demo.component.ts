import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VfBuilder, VfToastOutlet, DocumentDefinition } from 'vant-flow';
import { EXAMPLE_DOCUMENT } from './example-data';

@Component({
  selector: 'app-builder-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, VfBuilder, VfToastOutlet],
  template: `
    <div class="h-screen flex flex-col overflow-hidden bg-zinc-100">
      <header class="h-14 bg-white border-b border-zinc-200 flex items-center px-6 gap-4 shrink-0 shadow-sm z-50">
        <a routerLink="/" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </a>
        <div class="flex items-center gap-2 group">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span class="text-sm font-black text-zinc-900 tracking-tight underline underline-offset-4 decoration-indigo-500/30">VANT FLOW BUILDER</span>
        </div>
        <div class="flex-1"></div>
        <a routerLink="/demo/renderer-host-controls" class="ui-btn-secondary ui-btn-sm">
          Renderer Host Controls
        </a>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
           <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
           <span class="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Designing Mode</span>
        </div>
      </header>

      <div class="px-6 py-4 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div class="max-w-6xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Host-Controlled Builder Example</p>
            <p class="text-sm text-zinc-600 mt-1">Toggle whether schema authors can access the builder script tab. This demonstrates the <code>showScriptEditor</code> input on <code>&lt;vf-builder&gt;</code>.</p>
          </div>

          <label class="inline-flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-sm">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              [ngModel]="allowClientScripting"
              (ngModelChange)="allowClientScripting = !!$event">
            <span>
              <span class="block text-[11px] font-black uppercase tracking-[0.2em] text-zinc-700">Show Script Editor</span>
              <span class="block text-xs text-zinc-500">Turn this off to keep the builder on layout/properties only.</span>
            </span>
          </label>
        </div>
      </div>

      <div class="flex-1 overflow-hidden relative">
        <vf-builder
          [initialSchema]="schema"
          [showScriptEditor]="allowClientScripting"
          (schemaChange)="onSchemaChange($event)">
        </vf-builder>
      </div>

      <vf-toast-outlet></vf-toast-outlet>
    </div>
  `
})
export class BuilderDemoComponent {
  schema = EXAMPLE_DOCUMENT;
  allowClientScripting = true;

  onSchemaChange(newSchema: any) {
    this.schema = newSchema;
    console.log('[Builder Demo] Schema Updated:', newSchema);
  }
}
