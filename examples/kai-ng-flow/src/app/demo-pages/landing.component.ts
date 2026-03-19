import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type LandingStat = {
  value: string;
  label: string;
};

type LandingFeature = {
  title: string;
  description: string;
  accent: string;
};

type LandingRouteCard = {
  title: string;
  description: string;
  href?: string;
  route?: string;
  cta: string;
  tone: 'dark' | 'light' | 'accent';
};

type LandingFlowNode = {
  title: string;
  detail: string;
  chip: string;
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f7f8fb_0%,_#eef2ff_42%,_#f8fafc_100%)] text-zinc-900">
      <div class="pointer-events-none absolute inset-0 bg-grid-slate opacity-50"></div>
      <div class="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.18),_transparent_68%)] blur-3xl"></div>

      <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 py-8 lg:px-10">
        <header class="flex items-center justify-between">
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
              href="https://github.com/DonnC"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-zinc-700 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-950"
            >
              Built by DonnC
            </a>
            <a
              href="https://github.com/DonnC/vant-flow"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
            >
              View Source
            </a>
          </div>
        </header>

        <section class="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-sky-700 shadow-sm backdrop-blur">
              <span class="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
              Hosted Product Demo
            </div>

            <h1 class="mt-6 max-w-4xl text-5xl font-black tracking-[-0.05em] text-zinc-950 sm:text-6xl xl:text-7xl">
              Build business forms that
              <span class="bg-[linear-gradient(120deg,_#0f172a_0%,_#2563eb_38%,_#14b8a6_100%)] bg-clip-text text-transparent">think, react, and scale</span>
            </h1>

            <p class="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
              Vant Flow turns form delivery into a platform: visual schema design, runtime rendering, secure client scripts, rich business fields, and AI-assisted authoring in one Angular-first workflow.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <a
                routerLink="/admin"
                class="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_40px_rgba(15,23,42,0.24)] transition hover:-translate-y-1 hover:bg-zinc-800"
              >
                Open Admin Builder
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </a>
              <a
                routerLink="/user"
                class="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-800 shadow-sm transition hover:-translate-y-1 hover:border-zinc-300 hover:bg-white"
              >
                Try User Portal
              </a>
              <a
                href="https://github.com/DonnC/vant-flow"
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-sky-800 transition hover:-translate-y-1 hover:border-sky-300"
              >
                Explore on GitHub
              </a>
            </div>

            <div class="mt-8 flex flex-wrap gap-2">
              <span class="demo-pill">Visual Builder</span>
              <span class="demo-pill">Secure frm Scripts</span>
              <span class="demo-pill">Stepper Workflows</span>
              <span class="demo-pill">Link Lookups</span>
              <span class="demo-pill">Attach + Signature</span>
              <span class="demo-pill">AI Scaffold + Assist</span>
            </div>

            <div class="mt-10 grid gap-3 sm:grid-cols-3">
              <div *ngFor="let stat of stats" class="rounded-[1.6rem] border border-white/80 bg-white/80 p-5 shadow-[0_16px_40px_rgba(148,163,184,0.15)] backdrop-blur">
                <div class="text-2xl font-black tracking-[-0.04em] text-zinc-950">{{ stat.value }}</div>
                <div class="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{{ stat.label }}</div>
              </div>
            </div>
          </div>

          <div class="relative">
            <div class="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-sky-200/50 blur-2xl"></div>
            <div class="absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-cyan-200/50 blur-2xl"></div>

            <div class="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-zinc-950 p-5 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
              <div class="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <div class="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">Live Demo Story</div>
                  <div class="mt-1 text-lg font-black">Schema to runtime in one glance</div>
                </div>
                <div class="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  Builder + Runner
                </div>
              </div>

              <div class="mt-4 grid gap-3">
                <div class="rounded-[1.4rem] border border-indigo-400/20 bg-[linear-gradient(135deg,_rgba(99,102,241,0.22),_rgba(15,23,42,0.6))] p-4">
                  <div class="flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">
                    <span>Step 1</span>
                    <span>Author</span>
                  </div>
                  <div class="mt-2 text-xl font-black">Drag fields, shape layouts, tune behavior.</div>
                  <div class="mt-2 text-sm leading-6 text-indigo-100/80">Visual schema design with preview, metadata testing, and script editing.</div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-[1.4rem] border border-emerald-400/20 bg-white/5 p-4">
                    <div class="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Step 2</div>
                    <div class="mt-2 text-lg font-black">Run the exact schema</div>
                    <div class="mt-2 text-sm leading-6 text-zinc-300">Fill, validate, sign, attach, and submit without rebuilding UI pages.</div>
                  </div>
                  <div class="rounded-[1.4rem] border border-sky-400/20 bg-white/5 p-4">
                    <div class="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">Step 3</div>
                    <div class="mt-2 text-lg font-black">Let AI accelerate</div>
                    <div class="mt-2 text-sm leading-6 text-zinc-300">Scaffold forms from prompts and assist users with field population.</div>
                  </div>
                </div>

                <div class="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <div class="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                    <span class="rounded-full border border-white/10 px-3 py-1">metadata-aware scripts</span>
                    <span class="rounded-full border border-white/10 px-3 py-1">remote link fields</span>
                    <span class="rounded-full border border-white/10 px-3 py-1">approval flows</span>
                    <span class="rounded-full border border-white/10 px-3 py-1">audit replay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-[2.2rem] border border-zinc-200 bg-white/85 p-8 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur">
          <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div class="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Platform Flow</div>
              <h2 class="mt-2 text-3xl font-black tracking-[-0.04em] text-zinc-950">How the demo works, in one animated story.</h2>
            </div>
            <div class="max-w-xl text-sm leading-7 text-zinc-600">
              Visitors should immediately understand that this is not a static form page. It is a schema platform where authoring, runtime execution, backend-aware integration, and AI can all cooperate.
            </div>
          </div>

          <div class="mt-8 grid gap-4 xl:grid-cols-[repeat(5,minmax(0,1fr))]">
            <ng-container *ngFor="let node of flowNodes; let last = last">
              <div class="relative">
                <div class="flow-node h-full rounded-[1.8rem] border border-zinc-200 bg-zinc-950 p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
                  <div class="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                    {{ node.chip }}
                  </div>
                  <h3 class="mt-4 text-xl font-black tracking-[-0.03em]">{{ node.title }}</h3>
                  <p class="mt-3 text-sm leading-7 text-zinc-300">{{ node.detail }}</p>
                </div>

                <div *ngIf="!last" class="hidden xl:flex flow-connector absolute left-full top-1/2 z-10 h-px w-8 -translate-y-1/2 items-center justify-center">
                  <div class="h-px w-full bg-[linear-gradient(90deg,_rgba(6,182,212,0.2),_rgba(59,130,246,0.95),_rgba(20,184,166,0.2))]"></div>
                  <div class="absolute right-0 flex h-6 w-6 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-600 shadow-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </div>
              </div>
            </ng-container>
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

        <section class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div class="rounded-[2rem] border border-zinc-200 bg-white/90 p-8 shadow-[0_18px_50px_rgba(148,163,184,0.14)]">
            <div class="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-500">Why It Stands Out</div>
            <h2 class="mt-3 text-3xl font-black tracking-[-0.04em] text-zinc-950">This demo sells capability, not just UI.</h2>
            <p class="mt-4 text-sm leading-7 text-zinc-600">
              In one hosted experience, visitors can see the whole platform story: build a form, run it, attach evidence, capture signatures, drive conditional logic, and explore AI-assisted workflows without needing a separate pitch deck.
            </p>

            <div class="mt-8 space-y-4">
              <div class="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                <div class="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">For buyers</div>
                <div class="mt-2 text-sm leading-7 text-zinc-700">It quickly explains what kinds of internal systems you can ship with fewer custom pages and less redeployment friction.</div>
              </div>
              <div class="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                <div class="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">For engineers</div>
                <div class="mt-2 text-sm leading-7 text-zinc-700">It proves the architecture is real: schema-driven UI, runtime scripting, host-controlled integrations, and reusable workflow delivery.</div>
              </div>
              <div class="rounded-[1.4rem] border border-zinc-200 bg-zinc-50 p-4">
                <div class="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">For your brand</div>
                <div class="mt-2 text-sm leading-7 text-zinc-700">It positions you as the person who can build opinionated, production-minded platforms instead of one-off demos.</div>
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <article *ngFor="let feature of features" class="rounded-[1.8rem] border border-white/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(148,163,184,0.15)] backdrop-blur">
              <div class="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]"
                [ngClass]="feature.accent">
                Feature
              </div>
              <h3 class="mt-4 text-xl font-black tracking-[-0.03em] text-zinc-950">{{ feature.title }}</h3>
              <p class="mt-3 text-sm leading-7 text-zinc-600">{{ feature.description }}</p>
            </article>
          </div>
        </section>

        <section class="rounded-[2.2rem] border border-zinc-200 bg-zinc-950 px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
          <div class="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div class="text-[11px] font-black uppercase tracking-[0.26em] text-cyan-200">AI-First Showcase</div>
              <h2 class="mt-3 text-3xl font-black tracking-[-0.04em]">Prompt, generate, refine, and run.</h2>
              <p class="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
                The demo is strongest when people see that Vant Flow is not only a form builder. It is a workflow surface where AI can scaffold schemas, help populate real form fields, and still operate inside a structured runtime model.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <a routerLink="/admin" class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-950 transition hover:-translate-y-1">
                Demo AI Builder Flow
              </a>
              <a routerLink="/user" class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-white transition hover:-translate-y-1 hover:bg-white/10">
                Demo AI Runner Flow
              </a>
            </div>
          </div>
        </section>

        <footer class="flex flex-col gap-4 border-t border-white/70 pt-8 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <div>
            Built with Angular, Tailwind CSS, Monaco, Quill, runtime scripting, and a lot of product obsession.
          </div>
          <div class="flex flex-wrap gap-3">
            <a href="https://github.com/DonnC" target="_blank" rel="noreferrer" class="font-bold text-zinc-700 transition hover:text-zinc-950">GitHub Profile</a>
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

    .demo-pill {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      background: rgba(255, 255, 255, 0.82);
      padding: 0.6rem 0.9rem;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #334155;
      box-shadow: 0 10px 25px rgba(148, 163, 184, 0.12);
      backdrop-filter: blur(12px);
    }

    .flow-node {
      position: relative;
      overflow: hidden;
    }

    .flow-node::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.14), transparent 45%, rgba(45, 212, 191, 0.12));
      pointer-events: none;
    }

    .flow-node::after {
      content: '';
      position: absolute;
      top: -40%;
      left: -20%;
      width: 45%;
      height: 180%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0));
      transform: rotate(18deg);
      animation: flowShimmer 7s linear infinite;
      pointer-events: none;
    }

    .flow-connector {
      animation: flowPulse 2.2s ease-in-out infinite;
    }

    @keyframes flowShimmer {
      0% {
        transform: translateX(-140%) rotate(18deg);
      }

      100% {
        transform: translateX(420%) rotate(18deg);
      }
    }

    @keyframes flowPulse {
      0%, 100% {
        opacity: 0.45;
      }

      50% {
        opacity: 1;
      }
    }
  `]
})
export class LandingComponent {
  protected readonly stats: LandingStat[] = [
    { value: 'Builder + Runtime', label: 'One platform story' },
    { value: 'Schema Driven', label: 'Change behavior from data' },
    { value: 'AI Assisted', label: 'Scaffold and fill workflows' }
  ];

  protected readonly routeCards: LandingRouteCard[] = [
    {
      title: 'Admin Builder Demo',
      description: 'Showcase the visual IDE, script editor, preview mode, and how fast a new workflow can be modeled without shipping a new Angular page.',
      route: '/admin',
      cta: 'Enter builder flow',
      tone: 'dark'
    },
    {
      title: 'User Portal Demo',
      description: 'Let visitors run the same schema as an end user, submit data, and inspect the product value from the business side.',
      route: '/user',
      cta: 'Open runtime flow',
      tone: 'light'
    },
    {
      title: 'Your Work, Publicly',
      description: 'Use the hosted demo as a living portfolio piece. It shows systems thinking, UI craft, runtime architecture, and AI integration in one place.',
      href: 'https://github.com/DonnC/vant-flow',
      cta: 'Visit the repository',
      tone: 'accent'
    }
  ];

  protected readonly features: LandingFeature[] = [
    {
      title: 'Visual Builder + Preview',
      description: 'Author sections, steps, and fields visually, then preview the exact runtime behavior beside the builder before shipping.',
      accent: 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    },
    {
      title: 'Secure frm Scripting',
      description: 'Attach dynamic behavior through a constrained scripting API so forms can react to user state, metadata, and workflow conditions.',
      accent: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    },
    {
      title: 'Rich Business Fields',
      description: 'Support real-world workflows with tables, signatures, attachments, rich text, stepper flows, and compact review-ready rendering.',
      accent: 'bg-amber-50 text-amber-700 border border-amber-200'
    },
    {
      title: 'Remote Lookups + Metadata',
      description: 'Drive role-aware, backend-aware behavior with Link fields, runtime metadata injection, and host-controlled integration hooks.',
      accent: 'bg-sky-50 text-sky-700 border border-sky-200'
    },
    {
      title: 'AI Form Scaffolding',
      description: 'Generate a starting schema from natural language, then refine it in the visual builder instead of starting from a blank canvas.',
      accent: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
    },
    {
      title: 'AI Form Assistance',
      description: 'Help users complete forms conversationally while still updating the real renderer state under a structured runtime contract.',
      accent: 'bg-teal-50 text-teal-700 border border-teal-200'
    }
  ];

  protected readonly flowNodes: LandingFlowNode[] = [
    {
      chip: '1. Author',
      title: 'Builder',
      detail: 'Create sections, steps, fields, table columns, and runtime rules visually.'
    },
    {
      chip: '2. Define',
      title: 'Document Schema',
      detail: 'Store one portable JSON contract that captures structure, scripts, actions, and field configuration.'
    },
    {
      chip: '3. Execute',
      title: 'Renderer + frm',
      detail: 'Run the schema as a live form with validation, conditional logic, signatures, and attachments.'
    },
    {
      chip: '4. Integrate',
      title: 'Host App Hooks',
      detail: 'Inject metadata, call backend APIs, wire media uploads, and power remote Link lookups.'
    },
    {
      chip: '5. Accelerate',
      title: 'AI + MCP',
      detail: 'Generate forms from prompts and assist users inside the same structured workflow engine.'
    }
  ];
}
