import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MockStorageService } from '../../core/services/mock-storage.service';
import { AiFormService } from '../../core/services/ai-form.service';

@Component({
  selector: 'app-user-portal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-zinc-50 flex flex-col">
      <!-- Sophisticated Client Header -->
      <header class="h-16 bg-white border-b border-zinc-200 flex items-center px-8 gap-6 shrink-0 z-50">
        <a routerLink="/" class="flex items-center gap-3 group">
          <div class="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <h1 class="text-sm font-black text-zinc-900 tracking-tight uppercase">Client <span class="text-violet-600">Portal</span></h1>
          </div>
        </a>

        <nav class="flex items-center ml-12 gap-8">
          <button (click)="activeTab.set('forms')" 
            class="text-xs font-bold transition-all py-5 border-b-2"
            [class.text-violet-600]="activeTab() === 'forms'"
            [class.border-violet-600]="activeTab() === 'forms'"
            [class.text-zinc-400]="activeTab() !== 'forms'"
            [class.border-transparent]="activeTab() !== 'forms'"
          >Available Forms</button>
          
          <button (click)="activeTab.set('submissions')" 
            class="text-xs font-bold transition-all py-5 border-b-2"
            [class.text-violet-600]="activeTab() === 'submissions'"
            [class.border-violet-600]="activeTab() === 'submissions'"
            [class.text-zinc-400]="activeTab() !== 'submissions'"
            [class.border-transparent]="activeTab() !== 'submissions'"
          >My Submissions</button>
        </nav>

        <div class="flex-1"></div>
        
        <div class="h-6 w-px bg-zinc-200 mx-2"></div>

        <a routerLink="/admin" class="text-[11px] font-bold text-zinc-400 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center gap-2">
           Internal Admin
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </header>

      <main class="flex-1 p-10">
        <div class="max-w-6xl mx-auto">
          @if (activeTab() === 'forms') {
            <div class="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div class="mb-8">
                <h2 class="text-2xl font-black text-zinc-800 tracking-tight">Available Forms</h2>
                <p class="text-sm text-zinc-400">Select a document to fill and submit for processing.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (form of forms(); track form.id) {
                  <div class="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-violet-500/5 transition-all group border-b-4 hover:border-b-violet-500">
                    <h3 class="font-black text-zinc-800 text-lg mb-2">{{ form.schema.name }}</h3>
                    <p class="text-xs text-zinc-400 line-clamp-2 mb-6 h-8">{{ form.schema.description || 'Fill this form to start your request.' }}</p>
                    
                    <button (click)="fillForm(form.id)" class="w-full bg-zinc-900 hover:bg-violet-600 text-white text-[11px] font-bold py-3 rounded-xl transition-all uppercase tracking-widest active:scale-95">
                      Start Filling
                    </button>
                  </div>
                } @empty {
                  <div class="col-span-full py-20 bg-white border border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4">
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-zinc-300"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <h3 class="text-lg font-bold text-zinc-700">No Forms Available</h3>
                    <p class="text-sm text-zinc-400 max-w-xs mt-1">There are no forms published at the moment. Please check back later.</p>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div class="mb-8 flex items-center justify-between">
                 <div>
                    <h2 class="text-2xl font-black text-zinc-800 tracking-tight">Submission History</h2>
                    <p class="text-sm text-zinc-400">Track your previously submitted forms and their status.</p>
                 </div>
                 <div class="text-[10px] font-bold text-violet-600 bg-violet-50 px-4 py-2 rounded-full border border-violet-100">
                    {{ submissions().length }} SUBMISSIONS
                 </div>
               </div>

               <div class="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <table class="w-full text-left border-collapse">
                    <thead>
                       <tr class="bg-zinc-50/50 border-b border-zinc-100">
                         <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reference ID</th>
                         <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Form Name</th>
                         <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Submitted On</th>
                         <th class="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-50">
                       @for (sub of submissions(); track sub.id) {
                         <tr class="hover:bg-zinc-50/50 transition-colors group">
                           <td class="px-6 py-4">
                              <span class="text-xs font-mono text-zinc-500">{{ sub.id }}</span>
                           </td>
                           <td class="px-6 py-4">
                              <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-zinc-700">{{ sub.formName }}</span>
                                @if (sub.metadata?.['ai_submitted']) {
                                  <span class="flex items-center gap-1 bg-violet-50 text-violet-600 border border-violet-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2"/><path d="M3 8v4c0 1.1.9 2 2 2h3v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-6h3c1.1 0 2-.9 2-2V8"/><path d="M9 14v4"/><path d="M15 14v4"/></svg>
                                    AI
                                  </span>
                                }
                              </div>
                           </td>
                           <td class="px-6 py-4">
                              <span class="text-xs text-zinc-400">{{ sub.timestamp | date:'medium' }}</span>
                           </td>
                           <td class="px-6 py-4 text-right">
                              <button (click)="viewSubmission(sub.id)" class="text-[10px] font-black text-violet-600 uppercase tracking-tighter hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-all">
                                View Data
                              </button>
                           </td>
                         </tr>
                       } @empty {
                         <tr>
                           <td colspan="4" class="px-6 py-20 text-center">
                              <p class="text-sm font-bold text-zinc-300">No submissions found.</p>
                           </td>
                         </tr>
                       }
                    </tbody>
                  </table>
               </div>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class UserPortalComponent {
  private storage = inject(MockStorageService);
  private router = inject(Router);
  ai = inject(AiFormService);

  activeTab = signal<'forms' | 'submissions'>('forms');
  forms = this.storage.forms;
  submissions = this.storage.submissions;

  fillForm(id: string) {
    this.router.navigate(['/user/fill', id]);
  }

  viewSubmission(id: string) {
    this.router.navigate(['/user/submission', id]);
  }
}
