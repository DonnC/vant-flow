import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VfBuilder, VfRenderer, VfToastOutlet, DocumentDefinition } from 'vant-flow';
import { EXAMPLE_DOCUMENT } from './example-data';

@Component({
  selector: 'app-admin-demo',
  standalone: true,
  imports: [CommonModule, RouterLink, VfBuilder, VfRenderer, VfToastOutlet],
  template: `
    <div class="h-screen flex flex-col bg-zinc-100 overflow-hidden">
      <!-- High-End Header -->
      <header class="h-14 bg-white border-b border-zinc-200 flex items-center px-6 gap-4 shrink-0 shadow-sm z-50">
        <a routerLink="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span class="text-sm font-black text-zinc-900 tracking-tight">VANT FLOW <span class="text-indigo-600">ADMIN</span></span>
        </a>
        
        <div class="h-6 w-px bg-zinc-200 mx-2"></div>
        
        <nav class="flex items-center bg-zinc-100 rounded-xl p-1 gap-1">
          <button (click)="activeTab = 'builder'" 
            class="px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all"
            [class.bg-white]="activeTab === 'builder'"
            [class.shadow-sm]="activeTab === 'builder'"
            [class.text-indigo-600]="activeTab === 'builder'"
            [class.text-zinc-500]="activeTab !== 'builder'"
          >BUILDER</button>
          <button (click)="activeTab = 'renderer'" 
            class="px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all"
            [class.bg-white]="activeTab === 'renderer'"
            [class.shadow-sm]="activeTab === 'renderer'"
            [class.text-emerald-600]="activeTab === 'renderer'"
            [class.text-zinc-500]="activeTab !== 'renderer'"
          >RENDERER</button>
          <button (click)="activeTab = 'split'" 
            class="px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all"
            [class.bg-white]="activeTab === 'split'"
            [class.shadow-sm]="activeTab === 'split'"
            [class.text-orange-600]="activeTab === 'split'"
            [class.text-zinc-500]="activeTab !== 'split'"
          >DUAL VIEW</button>
        </nav>

        <div class="flex-1"></div>
        
        <div class="flex items-center gap-4">
           <div class="text-[10px] text-zinc-400 font-mono hidden md:block">
              {{ schema().name }} • v{{ schema().version }}
           </div>
           <button class="ui-btn-primary ui-btn-sm h-9 px-5 rounded-xl shadow-lg shadow-indigo-500/20">
              Publish Form
           </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-hidden relative">
        @if (activeTab === 'builder') {
          <div class="h-full animate-in fade-in duration-500">
            <vf-builder [initialSchema]="schema()" (schemaChange)="onSchemaChange($event)"></vf-builder>
          </div>
        } @else if (activeTab === 'renderer') {
          <div class="h-full overflow-y-auto bg-zinc-50 p-10 animate-in fade-in duration-500">
             <div class="max-w-4xl mx-auto py-10">
                <vf-renderer [document]="schema()"></vf-renderer>
             </div>
          </div>
        } @else {
          <!-- SPLIT VIEW -->
          <div class="h-full flex divide-x divide-zinc-200 animate-in zoom-in-95 duration-500">
             <div class="flex-1 overflow-hidden">
                <vf-builder [initialSchema]="schema()" (schemaChange)="onSchemaChange($event)"></vf-builder>
             </div>
             <div class="w-[500px] xl:w-[600px] overflow-y-auto bg-zinc-50/50 backdrop-blur-sm p-6 shrink-0 shadow-2xl">
                <div class="mb-4 flex items-center justify-between">
                   <h4 class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Dynamic Preview</h4>
                   <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <vf-renderer [document]="schema()"></vf-renderer>
             </div>
          </div>
        }
      </div>

      <vf-toast-outlet></vf-toast-outlet>
    </div>
  `
})
export class AdminDemoComponent {
  activeTab: 'builder' | 'renderer' | 'split' = 'split';
  schema = signal<DocumentDefinition>(EXAMPLE_DOCUMENT);

  onSchemaChange(newSchema: DocumentDefinition) {
    this.schema.set(newSchema);
  }
}
