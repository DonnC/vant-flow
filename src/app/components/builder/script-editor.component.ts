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
        <div class="w-10 bg-zinc-900/50 border-r border-white/5 flex flex-col items-center py-4 text-[11px] text-zinc-600 font-mono select-none shrink-0">
          @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]; track i) {
            <div class="h-6 leading-6">{{i}}</div>
          }
        </div>

        <textarea
          class="flex-1 bg-transparent text-indigo-100 font-mono text-[13px] p-4 outline-none resize-none 
                 selection:bg-indigo-500/30 placeholder:text-zinc-600 leading-6 tracking-wide"
          [ngModel]="state.docType().client_script"
          (ngModelChange)="state.setClientScript($event)"
          spellcheck="false"
          [placeholder]="placeholder"
        ></textarea>
      </div>

      <!-- Footer / API Snippets -->
      <div class="px-4 py-4 border-t border-white/5 bg-zinc-900 shrink-0">
        <div class="flex items-center justify-between mb-3 text-zinc-500 uppercase tracking-widest font-black text-[9px]">
           <span>API Snippet Library</span>
           <span class="text-indigo-400">Click to insert</span>
        </div>
        <div class="flex flex-wrap gap-2">
          @for (s of snippets; track s.label) {
            <button (click)="insertSnippet(s.code)" 
              class="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 hover:border-indigo-500/50 transition-all font-mono text-[10px] shadow-sm">
              {{ s.label }}
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class ScriptEditorComponent {
  state = inject(BuilderStateService);

  snippets = [
    { label: 'frm.on(\'refresh\')', code: "frm.on('refresh', () => {\n  // Logic on load\n});" },
    { label: 'frm.on(\'change\')', code: "frm.on('fieldname', (val) => {\n  // Logic on change\n});" },
    { label: 'frm.set_value', code: "frm.set_value('fieldname', 'value');" },
    { label: 'frm.set_df_prop', code: "frm.set_df_property('fn', 'read_only', 1);" },
    { label: 'app.show_alert', code: "app.show_alert('Message', 'success');" },
    { label: 'app.prompt', code: "app.prompt([\n  { label: 'Reason', fieldname: 'reason', fieldtype: 'Text' }\n], 'Please Provide Reason').then(vals => {\n  console.log(vals);\n});" },
    { label: 'app.call', code: "app.call('method_name', { arg1: 1 }).then(r => {\n  // Simulation\n});" },
  ];

  placeholder = [
    "// FormFlow Client Script",
    "// Write your logic here or use the snippets below.",
    "",
    "frm.on('refresh', function() {",
    "  app.show_alert('Form Loaded', 'success');",
    "});"
  ].join('\n');

  insertSnippet(code: string) {
    const current = this.state.docType().client_script || '';
    this.state.setClientScript(current + (current ? '\n\n' : '') + code);
  }
}
