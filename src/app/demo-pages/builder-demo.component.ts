import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VfBuilder } from 'vant-flow';

@Component({
  selector: 'app-builder-demo',
  standalone: true,
  imports: [CommonModule, VfBuilder],
  template: `
    <div class="h-screen flex flex-col">
      <header class="bg-white border-b border-zinc-200 px-4 py-2 flex items-center justify-between z-40">
        <div class="flex items-center gap-3">
          <a routerLink="/" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </a>
          <h2 class="text-sm font-bold text-zinc-800 tracking-tight">Vant Flow Builder IDE</h2>
        </div>
        <div class="flex items-center gap-2">
           <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 uppercase">Standalone Mode</span>
        </div>
      </header>
      <div class="flex-1 overflow-hidden">
        <vf-builder></vf-builder>
      </div>
    </div>
  `
})
export class BuilderDemoComponent { }
