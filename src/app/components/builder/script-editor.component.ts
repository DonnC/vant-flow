import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderStateService } from '../../services/builder-state.service';

@Component({
  selector: 'app-script-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Client Script</p>
          <p class="text-xs text-zinc-500 mt-0.5">FormFlow JS — runs in Preview Mode</p>
        </div>
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">JS</span>
      </div>

      <!-- Code Area -->
      <div class="flex-1 p-3">
        <textarea
          class="ui-code-editor w-full h-full"
          [ngModel]="state.docType().client_script"
          (ngModelChange)="state.setClientScript($event)"
          spellcheck="false"
          [placeholder]="placeholder"
        ></textarea>
      </div>

      <!-- Quick Ref -->
      <div class="px-4 py-3 border-t border-zinc-100">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Available APIs</p>
        <div class="space-y-1 font-mono text-[11px] text-zinc-500 leading-relaxed">
          <div><span class="text-indigo-600">frm</span>.on(<span class="text-green-600">'fieldname_change'</span>, cb)</div>
          <div><span class="text-indigo-600">frm</span>.set_value(<span class="text-green-600">'fieldname'</span>, val)</div>
          <div><span class="text-indigo-600">frm</span>.get_value(<span class="text-green-600">'fieldname'</span>)</div>
          <div><span class="text-indigo-600">frm</span>.set_df_property(<span class="text-green-600">'fn'</span>, <span class="text-green-600">'hidden'</span>, true)</div>
          <div><span class="text-indigo-600">frm</span>.set_query(<span class="text-green-600">'fn'</span>, fn)</div>
          <div><span class="text-indigo-600">app</span>.show_alert(<span class="text-green-600">'msg'</span>, <span class="text-green-600">'success'</span>)</div>
          <div><span class="text-indigo-600">app</span>.prompt(fields, title) → Promise</div>
          <div><span class="text-indigo-600">app</span>.call(config) → Promise</div>
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
