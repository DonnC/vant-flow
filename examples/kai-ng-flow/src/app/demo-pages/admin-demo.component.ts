import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { VfBuilder, VfRenderer, VfToastOutlet, DocumentDefinition } from 'vant-flow';
import { MockStorageService } from '../core/services/mock-storage.service';
import { AiFormService } from '../core/services/ai-form.service';
import { DemoMediaService } from '../core/services/demo-media.service';
import { EXAMPLE_DOCUMENT } from './example-data';

@Component({
  selector: 'app-admin-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, VfBuilder, VfRenderer, VfToastOutlet],
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
              <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest">{{ loadingMessage() }}</p>
           </div>
        } @else {
          @if (activeTab === 'builder') {
            <div class="h-full animate-in fade-in duration-500">
              <vf-builder [initialSchema]="schema()" [previewMetadata]="runtimeMetadata" (schemaChange)="onSchemaChange($event)"></vf-builder>
            </div>
          } @else {
            <div class="h-full overflow-y-auto bg-zinc-50 p-10 animate-in fade-in duration-500">
               <div class="max-w-4xl mx-auto py-10">
                  <div class="mb-8 rounded-2xl border border-sky-200 bg-white shadow-sm overflow-hidden">
                    <div class="px-5 py-4 border-b border-sky-100 bg-sky-50/80 flex items-start justify-between gap-4">
                      <div>
                        <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">Test frm.metadata</p>
                        <p class="text-xs text-sky-900/80 mt-1">Use this JSON to feed <code>frm.metadata</code> in preview so client scripts that depend on metadata can run properly. It stays client-side and is never saved with the builder schema.</p>
                      </div>
                      <span class="px-2 py-1 rounded-full border border-sky-200 bg-white text-[10px] font-bold uppercase tracking-widest text-sky-700">Not Saved</span>
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
                          Preview is currently using the JSON above as runtime metadata.
                        </div>
                      }
                    </div>
                  </div>

                  <vf-renderer [document]="schema()" [metadata]="runtimeMetadata" [mediaHandler]="demoMedia.mediaHandler"></vf-renderer>
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
  demoMedia = inject(DemoMediaService);
  ai = inject(AiFormService);

  formId: string | null = null;
  activeTab: 'builder' | 'renderer' = 'builder';
  schema = signal<DocumentDefinition>({
    name: 'Untitled Form',
    description: '',
    version: '1.0.0',
    sections: [{
      id: 'section_init',
      label: 'Main Section',
      columns: [{ id: 'col_init', fields: [] }]
    }]
  });
  lastSaved = signal<Date | null>(null);
  loading = signal(true);
  loadingMessage = signal('Warming Up Designer...');
  runtimeMetadata = this.getDefaultMetadata();
  metadataInput = JSON.stringify(this.runtimeMetadata, null, 2);
  metadataError: string | null = null;

  ngOnInit() {
    this.route.params.subscribe(async params => {
      this.formId = params['id'];

      const prompt = this.route.snapshot.queryParams['prompt'];

      if (prompt && this.formId === 'new') {
        this.loadingMessage.set('AI Generating Form Layout...');
        this.loading.set(true);
        try {
          const aiSchema = await this.ai.scaffoldFormFromPrompt(prompt);
          this.schema.set(aiSchema);

          // Clear the prompt from URL so reload doesn't trigger it again
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { prompt: null },
            queryParamsHandling: 'merge'
          });
        } catch (err: any) {
          alert('Failed to generate form: ' + err.message);
          // Reset to blank form so we don't show the "Quality Inspection" example on failure
          this.resetToBlank();
        }
        this.loading.set(false);
        return;
      }

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
      this.metadataError = 'Invalid JSON. Preview keeps using the last valid metadata object.';
    }
  }

  async saveForm() {
    try {
      const savedId = await this.storage.saveForm(this.schema(), this.formId === 'new' ? undefined : this.formId!);
      this.lastSaved.set(new Date());

      if (this.formId === 'new') {
        this.formId = savedId;
        this.router.navigate(['/admin/builder', savedId], { replaceUrl: true });
      }
    } catch (err) {
      console.error('Failed to save form:', err);
    }
  }

  toggleAi() {
    this.ai.selectedProvider.set(
      this.ai.selectedProvider() === 'openai' ? 'gemini' : 'openai'
    );
  }

  private resetToBlank() {
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
