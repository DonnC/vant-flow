import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderStateService } from '../../services/builder-state.service';

@Component({
  selector: 'app-script-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-zinc-950">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-white/10 bg-zinc-900 flex items-center justify-between shrink-0">
        <div>
           <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Client Script</p>
           </div>
           <p class="text-[10px] text-zinc-500 mt-0.5">FormFlow JS Environment</p>
        </div>
        <span class="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-500 font-mono text-[9px]">v1.0</span>
      </div>

      <!-- Editor Body -->
      <div class="flex-1 relative overflow-hidden flex">
        <!-- Line Numbers -->
        <div class="w-8 bg-zinc-900 border-r border-white/5 flex flex-col items-center py-4 text-[10px] text-zinc-600 font-mono select-none shrink-0">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]; track i) {
            <div class="h-6 leading-6">{{i}}</div>
          }
        </div>

        <textarea
          class="flex-1 bg-transparent text-indigo-300 font-mono text-xs p-4 outline-none resize-none 
                 selection:bg-indigo-500/30 placeholder:text-zinc-800 leading-6 tracking-wide"
          [ngModel]="state.docType().client_script"
          (ngModelChange)="state.setClientScript($event)"
          spellcheck="false"
          [placeholder]="placeholder"
        ></textarea>
      </div>

      <!-- Footer / API Cheat Sheet -->
      <div class="px-4 py-3 border-t border-white/5 bg-zinc-900/50 shrink-0">
        <div class="flex items-center justify-between mb-2">
           <p class="text-[9px] font-bold uppercase tracking-widest text-zinc-500">API Snippets</p>
           <div class="flex gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
           </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-zinc-600">
          <div><span class="text-indigo-500/70">frm</span>.on(<span class="text-zinc-500">'field'</span>, val)</div>
          <div><span class="text-indigo-500/70">frm</span>.set_value(<span class="text-zinc-500">'f'</span>, v)</div>
          <div><span class="text-indigo-500/70">frm</span>.set_df_prop(<span class="text-zinc-500">'f'</span>, <span class="text-zinc-500">'p'</span>, v)</div>
          <div><span class="text-indigo-500/70">app</span>.show_alert(<span class="text-zinc-500">'m'</span>, <span class="text-zinc-500">'s'</span>)</div>
        </div>
      </div>
    </div>
  `
})
export class ScriptEditorComponent {
  state = inject(BuilderStateService);

  placeholder = [
    "// FormFlow Client Script",
    "// This script runs when the form is loaded or values change",
    "",
    "frm.on('refresh', function() {",
    "  app.show_alert('Form Loaded', 'info');",
    "});",
    "",
    "frm.on('customer_change', async function(val) {",
    "  if (val === 'Acme Corp') frm.set_value('account_tier', 'Gold');",
    "});"
  ].join('\n');
}
