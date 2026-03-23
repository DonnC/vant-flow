import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VfUtilityService } from '../../services/app-utility.service';

@Component({
  selector: 'vf-toast-outlet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      @for (toast of app.toasts(); track toast.id) {
        <div
          class="flex items-center gap-3 rounded-lg border px-4 py-3 shadow-xl text-sm font-medium
                 min-w-[280px] max-w-sm animate-slide-up"
          [class.bg-white]="true"
          [class.border-green-200]="toast.indicator === 'success'"
          [class.text-green-800]="toast.indicator === 'success'"
          [class.border-red-200]="toast.indicator === 'error'"
          [class.text-red-800]="toast.indicator === 'error'"
          [class.border-amber-200]="toast.indicator === 'warning'"
          [class.text-amber-800]="toast.indicator === 'warning'"
          [class.border-indigo-200]="toast.indicator === 'info'"
          [class.text-indigo-800]="toast.indicator === 'info'"
        >
          <!-- Icon -->
          @switch (toast.indicator) {
            @case ('success') {
              <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            }
            @case ('error') {
              <div class="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-red-600"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            }
            @case ('warning') {
              <div class="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-amber-600"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
            }
            @default {
              <div class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-indigo-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
            }
          }
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="app.dismiss(toast.id)" class="text-current opacity-50 hover:opacity-100 ml-1 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>
  `
})
export class VfToastOutlet {
  constructor(public app: VfUtilityService) {}
}
