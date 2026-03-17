import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VfBuilder, VfToastOutlet, DocumentDefinition } from '../../../projects/vant-flow/src/public-api';
import { EXAMPLE_DOCUMENT } from './example-data';

@Component({
  selector: 'app-builder-demo',
  standalone: true,
  imports: [CommonModule, RouterLink, VfBuilder, VfToastOutlet],
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
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
           <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
           <span class="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Designing Mode</span>
        </div>
      </header>

      <div class="flex-1 overflow-hidden relative">
        <vf-builder [initialSchema]="schema" (schemaChange)="onSchemaChange($event)"></vf-builder>
      </div>

      <vf-toast-outlet></vf-toast-outlet>
    </div>
  `
})
export class BuilderDemoComponent {
  schema = EXAMPLE_DOCUMENT;

  onSchemaChange(newSchema: any) {
    this.schema = newSchema;
    console.log('[Builder Demo] Schema Updated:', newSchema);
  }
}
