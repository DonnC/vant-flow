import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockStorageService, FormDesign } from '../../core/services/mock-storage.service';
import { VfRenderer, VfToastOutlet } from 'vant-flow';

@Component({
  selector: 'app-form-runner',
  standalone: true,
  imports: [CommonModule, RouterLink, VfRenderer, VfToastOutlet],
  template: `
    <div class="min-h-screen bg-zinc-50 flex flex-col">
      <header class="h-14 bg-white border-b border-zinc-200 flex items-center px-6 gap-4 shrink-0 shadow-sm z-50">
        <a routerLink="/user" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </a>
        <div class="flex items-center gap-2">
           <span class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Document Runner</span>
           <span class="text-zinc-300">/</span>
           <span class="text-sm font-black text-zinc-900 tracking-tight">{{ form?.schema?.name || 'Loading...' }}</span>
        </div>
        <div class="flex-1"></div>
        <div class="flex items-center gap-2">
           <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Live Session</span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto pt-10 pb-20">
        @if (form) {
          <div class="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
             <vf-renderer 
               [document]="form.schema" 
               (formSubmit)="onFormSubmit($event)"
             ></vf-renderer>
          </div>
        } @else if (loading()) {
           <div class="h-full flex flex-col items-center justify-center py-40">
              <div class="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p class="text-xs font-bold text-zinc-400 uppercase">Fetching Schema...</p>
           </div>
        } @else {
           <div class="h-full flex flex-col items-center justify-center py-40 text-center">
              <h3 class="text-lg font-bold text-zinc-800">Form Not Found</h3>
              <p class="text-sm text-zinc-400 mt-1 mb-6">The document template you're looking for doesn't exist.</p>
              <a routerLink="/user" class="ui-btn-primary px-8">Back to Portal</a>
           </div>
        }
      </main>
      
      <vf-toast-outlet></vf-toast-outlet>
    </div>
  `
})
export class FormRunnerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storage = inject(MockStorageService);

  form: FormDesign | null = null;
  loading = signal(true);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.form = this.storage.getFormById(id) || null;
        this.loading.set(false);
      }
    });
  }

  onFormSubmit(data: any) {
    if (!this.form) return;

    // In a real app, this would be an API call
    this.storage.saveSubmission(this.form.id, this.form.schema.name, data);

    // Simulate some delay for realism
    setTimeout(() => {
      this.router.navigate(['/user'], { queryParams: { submitted: '1' } });
    }, 800);
  }
}
