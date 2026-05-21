import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MockStorageService, FormDesign } from '../../core/services/mock-storage.service';
import { AiFormService } from '../../core/services/ai-form.service';
import { DemoMediaService, DemoUploadedReferenceFile } from '../../core/services/demo-media.service';

@Component({
  selector: 'app-admin-form-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-screen flex flex-col bg-zinc-50 overflow-hidden">
      <!-- Minimal Sophisticated Header -->
      <header class="h-16 bg-white border-b border-zinc-200 flex items-center px-8 gap-6 shrink-0 z-50">
        <a routerLink="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 ring-4 ring-indigo-50 group-hover:scale-110 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
          </div>
          <div>
            <h1 class="text-sm font-black text-zinc-900 tracking-tight uppercase">Vant Flow <span class="text-indigo-600">Admin</span></h1>
            <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Form Infrastructure</p>
          </div>
        </a>

        <nav class="flex items-center ml-12 gap-8">
          <a routerLink="/admin" class="text-xs font-bold text-indigo-600 border-b-2 border-indigo-600 py-5">Designs</a>
          <a routerLink="/user" class="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors">Client View</a>
        </nav>

        <div class="flex-1"></div>

        <div class="flex items-center gap-3">
        <div class="h-6 w-px bg-zinc-200 mx-2"></div>

          <button (click)="openAiPrompt()" class="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 text-[11px] font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
            AI GENERATE
          </button>
          <button (click)="createNewForm()" class="bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            BLANK FORM
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-10">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-8">
             <div>
                <h2 class="text-xl font-black text-zinc-800 tracking-tight">Form Designs</h2>
                <p class="text-sm text-zinc-400">Manage and publish your document templates.</p>
             </div>
             <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
                {{ forms().length }} TOTAL DESIGNS
             </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (form of forms(); track form.id) {
              <div class="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
                <div class="absolute top-0 right-0 p-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button (click)="deleteForm(form.id)" class="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>

                <div class="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-zinc-400 group-hover:text-indigo-500 transition-colors">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
                   </svg>
                </div>

                <div class="flex items-start justify-between mb-1">
                  <h3 class="font-bold text-zinc-800 text-base max-w-[70%] line-clamp-1 truncate" title="{{ form.schema.name }}">{{ form.schema.name }}</h3>
                  @if (form.schema.metadata?.['is_ai_generated']) {
                    <span class="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2"/><path d="M3 8v4c0 1.1.9 2 2 2h3v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6h3c1.1 0 2-.9 2-2V8"/><path d="M9 14v4"/><path d="M15 14v4"/></svg>
                      AI
                    </span>
                  }
                </div>
                <p class="text-[11px] text-zinc-400 line-clamp-2 mb-6 h-8 leading-snug">{{ form.schema.description || 'No description provided.' }}</p>

                <div class="flex items-center justify-between pt-6 border-t border-zinc-50">
                   <div class="flex flex-col">
                      <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Fields</span>
                      <span class="text-xs font-bold text-zinc-700">{{ getFieldCount(form) }}</span>
                   </div>
                   <button (click)="editForm(form.id)" class="text-[11px] font-black text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all uppercase tracking-tight">
                      Open Designer
                   </button>
                </div>
              </div>
            } @empty {
              <div class="col-span-full py-20 bg-white border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-center">
                 <div class="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-zinc-300"><path d="M12 5v14M5 12h14"/></svg>
                 </div>
                 <h3 class="text-lg font-bold text-zinc-700">No Forms Found</h3>
                 <p class="text-sm text-zinc-400 max-w-xs mt-1 mb-6">You haven't created any form designs yet. Start by creating your first document template.</p>
                 <div class="flex items-center justify-center gap-3">
                    <button (click)="openAiPrompt()" class="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold px-5 py-2.5 rounded-xl transition-all">Generate with AI</button>
                    <button (click)="createNewForm()" class="ui-btn-primary px-8">Create Blank Form</button>
                 </div>
              </div>
            }
          </div>
         </div>
       </main>

       <!-- Simple AI Prompt Dialog Overlay -->
       @if (showAiDialog) {
         <div class="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-200">
               <div class="p-6 border-b border-zinc-100 flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-indigo-600"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                  </div>
                  <div>
                    <h2 class="text-lg font-black text-zinc-800 tracking-tight">AI Form Generator</h2>
                    <p class="text-[11px] font-bold text-zinc-400 tracking-widest uppercase">Powered by Vant Flow MCP</p>
                  </div>
               </div>
               
               <div class="p-6">
                 <label class="block text-xs font-bold text-zinc-700 uppercase tracking-widest mb-2">Describe the form you need</label>
                 <textarea 
                   #promptInput
                   class="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none h-32 ui-custom-scrollbar"
                   placeholder="Optional if you upload a form image or PDF. Example: Turn this paper onboarding form into a digital flow and add a final approval signature step."
                 ></textarea>

                 <div class="mt-5">
                   <label class="block text-xs font-bold text-zinc-700 uppercase tracking-widest mb-2">Reference Form Image Or PDF</label>
                   <label class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors">
                     <input type="file" class="hidden" accept="image/*,.pdf,application/pdf" (change)="onReferenceFileSelected($event)">
                     <div class="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shadow-sm">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                     </div>
                     <div>
                       <p class="text-sm font-bold text-zinc-700">Upload a scanned form reference</p>
                       <p class="text-xs text-zinc-500 mt-1">Accepted formats: image or PDF only. The AI will infer structure, explain assumptions, and scaffold a first draft.</p>
                     </div>
                   </label>

                   @if (selectedReferenceFile) {
                     <div class="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start justify-between gap-4">
                       <div>
                         <p class="text-xs font-bold text-emerald-800">{{ selectedReferenceFile.name }}</p>
                         <p class="text-[11px] text-emerald-700 mt-1">{{ selectedReferenceFile.type || 'application/octet-stream' }} • {{ formatBytes(selectedReferenceFile.size) }}</p>
                       </div>
                       <button type="button" (click)="clearReferenceFile()" class="text-[11px] font-bold text-emerald-700 hover:text-emerald-900">Remove</button>
                     </div>
                   }
                 </div>

                 @if (aiDialogError) {
                   <div class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                     {{ aiDialogError }}
                   </div>
                 }
                 
                 <div class="mt-6 flex items-center gap-3">
                    <button (click)="closeAiDialog()" [disabled]="isSubmittingAi" class="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                    <button (click)="submitAiPrompt(promptInput.value)" [disabled]="isSubmittingAi" class="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed">{{ isSubmittingAi ? 'Preparing AI Draft...' : 'Generate Design' }}</button>
                 </div>
               </div>
            </div>
         </div>
       }
     </div>
   `
})
export class AdminFormListComponent {
  private storage = inject(MockStorageService);
  private router = inject(Router);
  private demoMedia = inject(DemoMediaService);
  ai = inject(AiFormService);

  forms = this.storage.forms;

  showAiDialog = false;
  isSubmittingAi = false;
  aiDialogError: string | null = null;
  selectedReferenceFile: File | null = null;

  getFieldCount(form: FormDesign): number {
    return form.schema.sections.reduce((acc: number, s: any) =>
      acc + s.columns.reduce((cc: number, c: any) => cc + c.fields.length, 0), 0);
  }

  createNewForm() {
    this.router.navigate(['/admin/builder', 'new']);
  }

  openAiPrompt() {
    this.aiDialogError = null;
    this.showAiDialog = true;
  }

  closeAiDialog() {
    if (this.isSubmittingAi) return;
    this.showAiDialog = false;
    this.aiDialogError = null;
    this.selectedReferenceFile = null;
  }

  onReferenceFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.aiDialogError = null;

    if (!file) {
      this.selectedReferenceFile = null;
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      this.selectedReferenceFile = null;
      this.aiDialogError = 'Please upload only an image or PDF reference form.';
      input.value = '';
      return;
    }

    this.selectedReferenceFile = file;
  }

  clearReferenceFile() {
    this.selectedReferenceFile = null;
    this.aiDialogError = null;
  }

  async submitAiPrompt(prompt: string) {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt && !this.selectedReferenceFile) {
      this.aiDialogError = 'Add a prompt, a form image/PDF, or both before generating.';
      return;
    }

    this.isSubmittingAi = true;
    this.aiDialogError = null;

    try {
      let uploadedReference: DemoUploadedReferenceFile | null = null;
      if (this.selectedReferenceFile) {
        uploadedReference = await this.demoMedia.uploadReferenceFile(this.selectedReferenceFile, {
          source: 'admin-ai-generator'
        });
      }

      this.showAiDialog = false;
      await this.router.navigate(['/admin/builder', 'new'], {
        queryParams: {
          prompt: trimmedPrompt || null,
          referenceFileId: uploadedReference?.fileId || null,
          referenceFileName: uploadedReference?.name || null,
          referenceFileType: uploadedReference?.type || null,
          referenceFileSize: uploadedReference?.size || null
        }
      });

      this.selectedReferenceFile = null;
    } catch (err: any) {
      this.aiDialogError = err?.message || 'Failed to prepare the uploaded form reference.';
    } finally {
      this.isSubmittingAi = false;
    }
  }

  editForm(id: string) {
    this.router.navigate(['/admin/builder', id]);
  }

  async deleteForm(id: string) {
    if (confirm('Are you sure you want to delete this form design? All associated user submissions will also be deleted.')) {
      try {
        await this.storage.deleteForm(id);
      } catch (err) {
        console.error('Failed to delete form:', err);
      }
    }
  }

  formatBytes(size: number) {
    if (!Number.isFinite(size) || size <= 0) return '0 B';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}
