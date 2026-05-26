import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type LandingRouteCard = {
  title: string;
  description: string;
  href?: string;
  route?: string;
  cta: string;
  tone: 'dark' | 'light' | 'accent';
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="relative min-h-screen bg-[#0a0c10] text-zinc-100 selection:bg-indigo-500/30">
      <!-- Ambient Background -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute -left-[10%] -top-[10%] h-[60%] w-[60%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse"></div>
        <div class="absolute -right-[10%] top-[20%] h-[50%] w-[50%] rounded-full bg-emerald-500/5 blur-[120px]"></div>
        <div class="absolute bottom-[-10%] left-[20%] h-[40%] w-[40%] rounded-full bg-violet-500/10 blur-[120px]"></div>
        <div class="bg-grid-slate absolute inset-0 opacity-[0.03]"></div>
      </div>

      <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 py-20 lg:px-12">
        <!-- Header -->
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-base font-black text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              VF
            </div>
            <div>
              <div class="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Vant Flow</div>
              <div class="text-[10px] text-zinc-600 font-medium">Angular Form Intelligence</div>
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="hidden md:flex gap-1">
              <span class="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span class="flex h-1.5 w-1.5 rounded-full bg-emerald-500/40"></span>
              <span class="flex h-1.5 w-1.5 rounded-full bg-emerald-500/20"></span>
            </div>
            <a
              href="https://github.com/DonnC/vant-flow"
              target="_blank"
              rel="noreferrer"
              class="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900/50 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
            >
              <span class="relative z-10">View Source</span>
              <div class="absolute inset-0 z-0 bg-gradient-to-r from-indigo-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
            </a>
          </div>
        </header>

        <!-- Hero Section -->
        <main class="relative z-10 flex flex-col items-center text-center">
          <div class="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 backdrop-blur-sm">
            <span class="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
            Next-Gen Form Platform
          </div>

          <h1 class="mt-10 max-w-4xl text-5xl font-black tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl">
            Build schema forms.
            <span class="block bg-gradient-to-r from-indigo-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent">Run them anywhere.</span>
          </h1>

          <p class="mt-8 max-w-2xl text-lg leading-relaxed text-zinc-400 font-medium">
            A comprehensive Angular workspace for authoring, rendering, and controlling complex form lifecycles through a unified schema contract.
          </p>
        </main>

        <!-- Experience Paths -->
        <section class="grid gap-6 md:grid-cols-3">
          <div *ngFor="let card of routeCards"
               [routerLink]="card.route"
               class="group relative cursor-pointer overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-900/30 p-10 transition-all duration-500 hover:-translate-y-2 hover:border-zinc-700">
            
            <!-- Glow Background -->
            <div [class]="getGlowClass(card.tone)" class="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-20 blur-[80px]"></div>

            <div class="relative z-10 flex h-full flex-col">
              <div [class]="getBadgeClass(card.tone)" class="w-fit rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em]">
                {{ card.kicker }}
              </div>

              <h3 class="mt-8 text-3xl font-black tracking-tight text-white transition-colors group-hover:text-white">
                {{ card.title }}
              </h3>
              
              <p class="mt-4 flex-grow text-sm leading-8 text-zinc-500 transition-colors group-hover:text-zinc-300">
                {{ card.description }}
              </p>

              <div class="mt-10 flex items-center justify-between">
                <span [class]="getLinkClass(card.tone)" class="text-[10px] font-black uppercase tracking-[0.2em]">
                  {{ card.cta }}
                </span>
                <div [class]="getIconBgClass(card.tone)" class="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:border-zinc-700">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="transition-transform duration-500 group-hover:translate-x-0.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="mt-auto flex flex-col items-center justify-between gap-8 border-t border-zinc-800/50 pt-12 pb-6 md:flex-row">
          <div class="text-[11px] font-medium tracking-wide text-zinc-600">
            &copy; 2026 Vant Flow Open Source. Inspired by Frappe.
          </div>
          <div class="flex gap-8">
             <a href="https://github.com/DonnC/vant-flow" target="_blank" class="text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-indigo-400">Documentation</a>
             <a href="#" class="text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-indigo-400">Community</a>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .bg-grid-slate {
      background-image:
        linear-gradient(to right, rgba(99, 102, 241, 0.4) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(99, 102, 241, 0.4) 1px, transparent 1px);
      background-size: 60px 60px;
    }
  `]
})
export class LandingComponent {
  protected readonly routeCards: any[] = [
    {
      kicker: 'Admin',
      title: 'Form Builder',
      description: 'The complete authoring environment. Design fields, configure validation, and write runtime scripts with live preview.',
      route: '/admin',
      cta: 'Start Designing',
      tone: 'dark'
    },
    {
      kicker: 'Renderer',
      title: 'User Portal',
      description: 'Experience the forms as your end-users do. Test submissions, view results, and inspect the schema execution engine.',
      route: '/user',
      cta: 'Explore UX',
      tone: 'light'
    },
    {
      kicker: 'Host',
      title: 'Host Controls',
      description: 'See how external applications can drive the builder and renderer through a powerful API and host-level directives.',
      route: '/demo/renderer-host-controls',
      cta: 'View Integration',
      tone: 'accent'
    }
  ];

  getGlowClass(tone: string): string {
    switch (tone) {
      case 'dark': return 'bg-indigo-500';
      case 'light': return 'bg-emerald-500';
      case 'accent': return 'bg-violet-500';
      default: return 'bg-zinc-500';
    }
  }

  getBadgeClass(tone: string): string {
    switch (tone) {
      case 'dark': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'light': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'accent': return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  }

  getLinkClass(tone: string): string {
    switch (tone) {
      case 'dark': return 'text-indigo-400';
      case 'light': return 'text-emerald-400';
      case 'accent': return 'text-violet-400';
      default: return 'text-zinc-400';
    }
  }

  getIconBgClass(tone: string): string {
    switch (tone) {
      case 'dark': return 'group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 group-hover:text-indigo-400';
      case 'light': return 'group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 group-hover:text-emerald-400';
      case 'accent': return 'group-hover:border-violet-500/50 group-hover:bg-violet-500/10 group-hover:text-violet-400';
      default: return 'group-hover:border-zinc-500/50 group-hover:bg-zinc-500/10 group-hover:text-zinc-400';
    }
  }
}
