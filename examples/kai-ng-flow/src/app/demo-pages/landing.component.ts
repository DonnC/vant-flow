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
    <div class="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_45%,_#f8fafc_100%)] text-zinc-900">
      <div class="pointer-events-none absolute inset-0 bg-grid-slate opacity-40"></div>
      <div class="pointer-events-none absolute left-1/2 top-0 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.16),_transparent_70%)] blur-3xl"></div>

      <div class="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-8 lg:px-10">
        <header class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-black text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)]">
              VF
            </div>
            <div>
              <div class="text-sm font-black uppercase tracking-[0.28em] text-zinc-500">Vant Flow</div>
              <div class="text-xs text-zinc-500">Angular builder, renderer, scripting, and AI demo</div>
            </div>
          </div>

          <div class="hidden items-center gap-3 md:flex">
            <a
              href="https://github.com/DonnC/vant-flow"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950"
            >
              View Source
            </a>
          </div>
        </header>

        <section class="rounded-[2.4rem] border border-white/80 bg-white/78 p-8 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur md:p-10">
          <div class="max-w-4xl">
            <div class="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">
              <span class="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
              Angular Form Platform
            </div>

            <h1 class="mt-6 text-5xl font-black tracking-[-0.05em] text-zinc-950 sm:text-6xl">
              Build forms from schema,
              <span class="bg-[linear-gradient(120deg,_#0f172a_0%,_#2563eb_48%,_#14b8a6_100%)] bg-clip-text text-transparent">run them anywhere.</span>
            </h1>

            <p class="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Builder, renderer, host controls, and runtime scripting in one focused demo. Pick a surface and get straight to the part you want to explore.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <a
                routerLink="/admin"
                class="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_rgba(15,23,42,0.24)] transition hover:-translate-y-1 hover:bg-zinc-800"
              >
                Open Builder
              </a>
              <a
                routerLink="/demo/renderer-host-controls"
                class="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-800 shadow-sm transition hover:-translate-y-1 hover:border-zinc-300"
              >
                Host Controls
              </a>
              <a
                routerLink="/user"
                class="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-sky-800 transition hover:-translate-y-1 hover:border-sky-300"
              >
                User Portal
              </a>
            </div>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-3">
          <div *ngFor="let item of highlights" class="rounded-[1.8rem] border border-zinc-200 bg-white/88 p-6 shadow-[0_18px_50px_rgba(148,163,184,0.14)]">
            <div class="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{{ item.kicker }}</div>
            <h2 class="mt-3 text-xl font-black tracking-[-0.03em] text-zinc-950">{{ item.title }}</h2>
            <p class="mt-2 text-sm leading-7 text-zinc-600">{{ item.description }}</p>
          </div>
        </section>

        <section class="grid gap-6 lg:grid-cols-3">
          <article *ngFor="let card of routeCards"
            [class]="card.tone === 'dark'
              ? 'group rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]'
              : card.tone === 'accent'
                ? 'group rounded-[2rem] border border-sky-200 bg-[linear-gradient(180deg,_rgba(240,249,255,0.92),_rgba(236,253,245,0.92))] p-8 text-zinc-900 shadow-[0_18px_50px_rgba(125,211,252,0.18)]'
                : 'group rounded-[2rem] border border-zinc-200 bg-white/90 p-8 text-zinc-900 shadow-[0_18px_50px_rgba(148,163,184,0.14)]'">
            <div class="text-[11px] font-black uppercase tracking-[0.24em]"
              [class]="card.tone === 'dark' ? 'text-zinc-400' : card.tone === 'accent' ? 'text-sky-700' : 'text-zinc-500'">
              Demo Entry
            </div>
            <h3 class="mt-3 text-2xl font-black tracking-[-0.04em]">{{ card.title }}</h3>
            <p class="mt-3 text-sm leading-7"
              [class]="card.tone === 'dark' ? 'text-zinc-300' : 'text-zinc-600'">
              {{ card.description }}
            </p>

            <a *ngIf="card.route"
              [routerLink]="card.route"
              class="mt-8 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em]"
              [class]="card.tone === 'dark' ? 'text-white' : card.tone === 'accent' ? 'text-sky-800' : 'text-zinc-900'">
              {{ card.cta }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>

            <a *ngIf="card.href"
              [href]="card.href"
              target="_blank"
              rel="noreferrer"
              class="mt-8 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em]"
              [class]="card.tone === 'dark' ? 'text-white' : card.tone === 'accent' ? 'text-sky-800' : 'text-zinc-900'">
              {{ card.cta }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
          </article>
        </section>

        <footer class="flex flex-col gap-4 border-t border-white/70 pt-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <div>
            Angular, runtime schema, host controls, and a focused demo surface.
          </div>
          <div class="flex flex-wrap gap-3">
            <a href="https://github.com/DonnC/vant-flow" target="_blank" rel="noreferrer" class="font-bold text-zinc-700 transition hover:text-zinc-950">Project Repository</a>
            <a href="https://frappe.io" target="_blank" rel="noreferrer" class="font-bold text-zinc-700 transition hover:text-zinc-950">Frappe Inspiration</a>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .bg-grid-slate {
      background-image:
        linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
      background-size: 42px 42px;
    }
  `]
})
export class LandingComponent {
  protected readonly highlights = [
    {
      kicker: 'Builder',
      title: 'Design the schema visually',
      description: 'Compose sections, steps, fields, and scripts without hand-authoring every page.'
    },
    {
      kicker: 'Renderer',
      title: 'Run the same schema live',
      description: 'Use one contract for preview, production forms, readonly review, and submission replay.'
    },
    {
      kicker: 'Host Control',
      title: 'Keep the app in charge',
      description: 'Toggle script execution, hide actions, and lock selected fields directly from Angular.'
    }
  ];

  protected readonly routeCards: LandingRouteCard[] = [
    {
      title: 'Admin Builder Demo',
      description: 'Open the full authoring flow for schema design, preview, and save behavior.',
      route: '/admin',
      cta: 'Open builder',
      tone: 'dark'
    },
    {
      title: 'User Portal Demo',
      description: 'Run forms as an end user and inspect how the runtime behaves in a realistic flow.',
      route: '/user',
      cta: 'Open portal',
      tone: 'light'
    },
    {
      title: 'Host Controls Demo',
      description: 'See host-driven builder and renderer controls in action without extra clutter.',
      route: '/demo/renderer-host-controls',
      cta: 'Open demo',
      tone: 'accent'
    }
  ];
}
