import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MockStorageService, FormSubmission, FormDesign } from '../../core/services/mock-storage.service';
import { VfRenderer } from 'vant-flow';

@Component({
   selector: 'app-submission-detail',
   standalone: true,
   imports: [CommonModule, RouterLink, VfRenderer],
   template: `
    <div class="min-h-screen bg-zinc-50 flex flex-col">
      <header class="h-14 bg-white border-b border-zinc-200 flex items-center px-6 gap-4 shrink-0 shadow-sm z-50">
        <a routerLink="/user" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </a>
        <div class="flex items-center gap-2">
           <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Historical Record</span>
           <span class="text-zinc-300">/</span>
           <span class="text-sm font-black text-zinc-900 tracking-tight">{{ submission?.id }}</span>
        </div>
        <div class="flex-1"></div>
        
        <div class="flex items-center gap-2">
           <button (click)="showJson.set(!showJson())" 
             class="px-4 py-1.5 text-[10px] font-bold rounded-lg border transition-all uppercase tracking-widest"
             [class.bg-zinc-900]="showJson()"
             [class.text-white]="showJson()"
             [class.border-zinc-900]="showJson()"
             [class.bg-white]="!showJson()"
             [class.text-zinc-500]="!showJson()"
             [class.border-zinc-200]="!showJson()"
           >
             {{ showJson() ? 'Hide Raw Data' : 'View Raw Data' }}
           </button>
           <div class="px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200 ml-2">
              <span class="text-[9px] font-bold text-zinc-500 uppercase">ReadOnly View</span>
           </div>
        </div>
      </header>

      <main class="flex-1 overflow-hidden flex">
        <!-- Rendered Form -->
        <div class="flex-1 overflow-y-auto pt-10 pb-20 px-8 relative">
          @if (submission && formDesign) {
            <div class="max-w-4xl mx-auto">
               <div class="mb-10 bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm flex items-center justify-between">
                  <div>
                     <div class="flex items-center gap-3">
                        <h2 class="text-2xl font-black text-zinc-800 tracking-tight">{{ submission.formName }}</h2>
                        @if (submission.metadata?.['ai_submitted']) {
                          <span class="flex items-center gap-1 bg-violet-50 text-violet-600 border border-violet-200 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 shadow-sm mt-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2"/><path d="M3 8v4c0 1.1.9 2 2 2h3v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6h3c1.1 0 2-.9 2-2V8"/><path d="M9 14v4"/><path d="M15 14v4"/></svg>
                            AI Submitted
                          </span>
                        }
                     </div>
                     <p class="text-sm text-zinc-500 mt-1">Submitted on {{ submission.timestamp | date:'full' }}</p>
                  </div>
                  <div class="text-right">
                     <p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                     <span class="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg border border-emerald-100">PROCESSED</span>
                  </div>
               </div>

               <vf-renderer 
                 [document]="formDesign.schema" 
                 [initialData]="submission.data"
                 [readonly]="true"
               ></vf-renderer>
            </div>
          } @else if (loading()) {
             <div class="h-full flex flex-col items-center justify-center">
                <div class="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p class="text-xs font-bold text-zinc-400 uppercase">Loading Record...</p>
             </div>
          } @else {
             <div class="h-full flex flex-col items-center justify-center text-center">
                <h3 class="text-lg font-bold text-zinc-800">Record Not Found</h3>
                <p class="text-sm text-zinc-400 mt-1 mb-6">We couldn't find a submission with this ID.</p>
                <a routerLink="/user" class="ui-btn-primary px-8">Back to Portal</a>
             </div>
          }
        </div>

        <!-- JSON Inspector Pane -->
        @if (showJson() && submission) {
          <div class="w-[450px] border-l border-zinc-200 bg-zinc-900 shrink-0 flex flex-col animate-in slide-in-from-right-full duration-300">
             <div class="h-12 border-b border-zinc-800 flex items-center px-6 justify-between shrink-0">
                <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Submission Payload</span>
                <span class="text-[9px] font-mono text-zinc-600 uppercase">application/json</span>
             </div>
             <div class="flex-1 overflow-auto p-6 font-mono text-[11px] leading-relaxed">
                <pre class="text-emerald-400/80"><code>{{ submission.data | json }}</code></pre>
             </div>
          </div>
        }
      </main>
    </div>
  `
})
export class SubmissionDetailComponent implements OnInit {
   private route = inject(ActivatedRoute);
   private storage = inject(MockStorageService);

   submission: FormSubmission | null = null;
   formDesign: FormDesign | null = null;
   loading = signal(true);
   showJson = signal(false);

   async ngOnInit() {
      this.route.params.subscribe(async params => {
         const id = params['id'];
         if (id) {
            this.loading.set(true);
            // Give a tiny bit of time for MockStorage to finish initial load if it just started
            // In a better design, we'd have a 'loaded' signal in MockStorage.
            this.submission = this.storage.getSubmissionById(id) || null;
            if (this.submission) {
               this.formDesign = this.storage.getFormById(this.submission.formId) || null;
            }
            this.loading.set(false);
         }
      });
   }
}
