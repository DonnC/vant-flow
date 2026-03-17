import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { VfBuilder, VfRenderer, VfToastOutlet, DocumentDefinition } from '../../../projects/vant-flow/src/public-api';
import { MockStorageService } from '../core/services/mock-storage.service';
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
          <span class="text-sm font-black text-zinc-900 tracking-tight tracking-widest uppercase">VANT FLOW</span>
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
          >PREVIEW</button>
        </nav>

        <div class="flex-1"></div>
        
        <div class="flex items-center gap-5">
           @if (lastSaved()) {
             <div class="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Last Saved: {{ lastSaved() | date:'shortTime' }}</span>
             </div>
           }
           <div class="text-[10px] text-zinc-400 font-mono hidden md:block border-l border-zinc-200 pl-5">
              {{ schema().name }} • v{{ schema().version }}
           </div>
           <button (click)="saveForm()" class="ui-btn-primary ui-btn-sm h-9 px-6 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95">
              Save Design
           </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-hidden relative">
        @if (loading()) {
           <div class="h-full flex flex-col items-center justify-center bg-white z-[60]">
              <div class="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Warming Up Designer...</p>
           </div>
        } @else {
          @if (activeTab === 'builder') {
            <div class="h-full animate-in fade-in duration-500">
              <vf-builder [initialSchema]="schema()" (schemaChange)="onSchemaChange($event)"></vf-builder>
            </div>
          } @else {
            <div class="h-full overflow-y-auto bg-zinc-50 p-10 animate-in fade-in duration-500">
               <div class="max-w-4xl mx-auto py-10">
                  <vf-renderer [document]="schema()"></vf-renderer>
               </div>
            </div>
          }
        }
      </div>

      <vf-toast-outlet></vf-toast-outlet>
    </div>
  `
})
export class AdminDemoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storage = inject(MockStorageService);

  formId: string | null = null;
  activeTab: 'builder' | 'renderer' = 'builder';
  schema = signal<DocumentDefinition>(EXAMPLE_DOCUMENT);
  lastSaved = signal<Date | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.formId = params['id'];
      if (this.formId && this.formId !== 'new') {
        const existing = this.storage.getFormById(this.formId);
        if (existing) {
          this.schema.set({ ...existing.schema });
          this.lastSaved.set(new Date(existing.lastModified));
        }
      } else {
        // Start with a blank canvas for new forms
        this.schema.set({
          name: 'Untitled Form',
          description: '',
          version: '1.0.0',
          sections: [{
            id: 'section_' + Math.random().toString(36).substring(2, 9),
            label: 'Main Section',
            columns: [{ id: 'col_' + Math.random().toString(36).substring(2, 9), fields: [] }]
          }]
        });
      }
      this.loading.set(false);
    });
  }

  onSchemaChange(newSchema: DocumentDefinition) {
    this.schema.set(newSchema);
  }

  saveForm() {
    const id = this.storage.saveForm(this.schema(), this.formId === 'new' ? undefined : this.formId!);
    this.lastSaved.set(new Date());

    if (this.formId === 'new') {
      this.router.navigate(['/admin/builder', id]);
    }
  }
}
