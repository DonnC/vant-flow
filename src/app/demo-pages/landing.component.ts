import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 bg-grid-zinc-200">
      <div class="max-w-4xl w-full">
        <!-- Hero Header -->
        <div class="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Vant Flow Library v0.0.1
          </div>
          <h1 class="text-5xl font-black text-zinc-900 tracking-tight mb-4">
            Powerful Dynamic Forms <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">for Modern Angular</span>
          </h1>
          <p class="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            The professional suite for building, rendering, and managing metadata-driven forms with sub-second performance and deep scripting capabilities.
          </p>
        </div>

        <!-- Navigation Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <!-- Builder Card -->
          <a routerLink="/builder" class="group bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-600"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
            </div>
            <h3 class="text-lg font-bold text-zinc-800 mb-2">Visual Builder</h3>
            <p class="text-sm text-zinc-500 leading-relaxed mb-6">Design complex layouts with drag-and-drop, configure field properties, and write client scripts.</p>
            <div class="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest group-hover:gap-3 transition-all">
              Launch IDE
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </a>

          <!-- Renderer Card -->
          <a routerLink="/renderer" class="group bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-600"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <h3 class="text-lg font-bold text-zinc-800 mb-2">Live Renderer</h3>
            <p class="text-sm text-zinc-500 leading-relaxed mb-6">See the high-performance renderer in action with pre-loaded example schemas and full validation.</p>
            <div class="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest group-hover:gap-3 transition-all">
              Preview Mode
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </a>

          <!-- Admin Side Card -->
          <a routerLink="/admin" class="group bg-zinc-900 p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div class="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-100"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-zinc-100 mb-2">Admin Dashboard</h3>
            <p class="text-sm text-zinc-400 leading-relaxed mb-6">The integrated "Full Experience" where you can design a form and see it live side-by-side.</p>
            <div class="flex items-center gap-2 text-xs font-bold text-zinc-100 uppercase tracking-widest group-hover:gap-3 transition-all">
              Full Suite
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </a>
        </div>

        <!-- Footer -->
        <footer class="mt-20 text-center flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <div class="text-zinc-400 text-xs">
            Built with Angular &bull; Tailwind CSS &bull; Vant Flow Core
          </div>
          <div class="max-w-md bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
            <p class="text-[11px] text-zinc-500 italic leading-relaxed">
              "If you think this is cool, wait until you see far greater work that exceeds this from my inspiration from 
              <a href="https://frappe.io" target="_blank" class="text-indigo-600 font-bold hover:underline">Frappe</a>" 
              — <span class="text-zinc-800 font-bold">DonnC</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .bg-grid-zinc-200 {
      background-image: radial-gradient(circle, #e4e4e7 1px, transparent 1px);
      background-size: 32px 32px;
    }
  `]
})
export class LandingComponent { }
