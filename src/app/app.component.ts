import { Component, inject } from '@angular/core';
import { BuilderContainerComponent } from './components/builder/builder-container.component';
import { ToastOutletComponent } from './components/builder/toast-outlet.component';
import { AppUtilityService } from './services/app-utility.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BuilderContainerComponent, ToastOutletComponent],
  template: `
    <app-builder-container></app-builder-container>
    <app-toast-outlet></app-toast-outlet>

    @if (utility.isFreezing()) {
      <div class="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div class="p-6 bg-white rounded-2xl shadow-xl flex flex-col items-center gap-4 border border-zinc-100">
          <div class="w-10 h-10 border-4 border-zinc-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <p class="text-sm font-medium text-zinc-600">{{ utility.isFreezing() }}</p>
        </div>
      </div>
    }
  `
})
export class AppComponent {
  utility = inject(AppUtilityService);
}
