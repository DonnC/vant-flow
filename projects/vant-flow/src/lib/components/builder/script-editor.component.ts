import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { VfBuilderState } from '../../services/builder-state.service';
import { VfUiPrimitivesModule } from '../../ui/ui-primitives.module';
import { registerVfScriptEditorSupport } from '../../utils/script-editor-support';
import { VfEyebrow } from '../shared/eyebrow.component';

const FRM_METHOD_COMPLETIONS = [
  { label: 'on', insertText: "on('${1:event}', (${2:val}, ${3:frm}) => {\n  $0\n})", documentation: 'Listen to field or form events.' },
  { label: 'validate', insertText: 'validate()', documentation: 'Run full-form validation.' },
  { label: 'validate_step', insertText: 'validate_step()', documentation: 'Run current step validation.' },
  { label: 'set_value', insertText: "set_value('${1:fieldname}', ${2:value})", documentation: 'Set a field value.' },
  { label: 'get_value', insertText: "get_value('${1:fieldname}')", documentation: 'Read a field value.' },
  { label: 'has_field', insertText: "has_field('${1:fieldname}')", documentation: 'Check whether a field exists. Also supports arrays with { mode: \"all\" | \"any\" }.' },
  { label: 'set_df_property', insertText: "set_df_property('${1:fieldname}', '${2:read_only}', ${3:true})", documentation: 'Change runtime field properties.' },
  { label: 'set_filter', insertText: "set_filter('${1:fieldname}', { ${2:key}: ${3:value} })", documentation: 'Replace a Url lookup field filter set.' },
  { label: 'refresh_link', insertText: "refresh_link('${1:fieldname}')", documentation: 'Force a Url lookup field to reload.' },
  { label: 'is_new', insertText: 'is_new()', documentation: 'Check whether the form is a brand new unsaved record.' },
  { label: 'set_section_property', insertText: "set_section_property('${1:sectionId}', '${2:hidden}', ${3:true})", documentation: 'Change section runtime properties.' },
  { label: 'set_intro', insertText: "set_intro('${1:message}', '${2:blue}')", documentation: 'Show a top intro banner.' },
  { label: 'msgprint', insertText: "msgprint('${1:message}', '${2:info}')", documentation: 'Show a toast message.' },
  { label: 'confirm', insertText: "confirm('${1:message}', () => {\n  $0\n})", documentation: 'Show a confirm dialog.' },
  { label: 'prompt', insertText: "prompt([\n  { label: '${1:Reason}', fieldname: '${2:reason}', fieldtype: 'Data', mandatory: 1 }\n], undefined, '${3:Provide Reason}')", documentation: 'Show a prompt dialog and resolve entered values.' },
  { label: 'throw', insertText: "throw('${1:message}')", documentation: 'Show an error and stop execution.' },
  { label: 'set_readonly', insertText: 'set_readonly(true)', documentation: 'Toggle whole-form readonly mode.' },
  { label: 'add_custom_button', insertText: "add_custom_button('${1:Label}', async (frm) => {\n  $0\n}, '${2:primary}')", documentation: 'Add a custom action button to the renderer header.' },
  { label: 'clear_custom_buttons', insertText: 'clear_custom_buttons()', documentation: 'Remove all custom buttons.' },
  { label: 'set_button_label', insertText: "set_button_label('${1:submit}', '${2:New Label}')", documentation: 'Change a default button label.' },
  { label: 'set_button_action', insertText: "set_button_action('${1:decline}', async (frm) => {\n  $0\n})", documentation: 'Override a default action button handler.' },
  { label: 'set_button_property', insertText: "set_button_property('${1:submit}', '${2:visible}', ${3:false})", documentation: 'Change default action button properties.' },
  { label: 'call', insertText: "call({\n  method: '${1:my_method}',\n  args: { ${2:key}: ${3:value} }\n})", documentation: 'Call a host/backend method.' },
  { label: 'reset', insertText: 'reset()', documentation: 'Reset the form to defaults.' },
  { label: 'add_row', insertText: "add_row('${1:tableFieldname}', { ${2:key}: ${3:value} })", documentation: 'Add a row to a table field.' },
  { label: 'remove_row', insertText: "remove_row('${1:tableFieldname}', ${2:index})", documentation: 'Remove a table row.' },
  { label: 'next_step', insertText: 'next_step()', documentation: 'Go to the next visible step.' },
  { label: 'prev_step', insertText: 'prev_step()', documentation: 'Go to the previous visible step.' },
  { label: 'go_to_step', insertText: "go_to_step('${1:step_id}')", documentation: 'Jump to a step by id or index.' },
  { label: 'set_step_hidden', insertText: "set_step_hidden('${1:step_id}', true)", documentation: 'Hide or show a step.' },
  { label: 'freeze', insertText: "freeze('${1:Loading...}')", documentation: 'Show a global loading overlay.' },
  { label: 'unfreeze', insertText: 'unfreeze()', documentation: 'Hide the global loading overlay.' }
] as const;

@Component({
  selector: 'vf-script-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorModule, VfUiPrimitivesModule, VfEyebrow],
  template: `
    <div class="flex flex-col h-full bg-zinc-950">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-white/10 bg-zinc-900 flex items-center justify-between shrink-0">
        <div>
           <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <vf-eyebrow label="Client Script"></vf-eyebrow>
           </div>
           <p class="text-[10px] text-zinc-500 mt-0.5">Modern Formflow Runtime Environment</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[10px] text-zinc-600 font-mono">JS / Monaco</span>
          <span class="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-500 font-mono text-[9px]">v1.2.0</span>
        </div>
      </div>

      <!-- Editor Body -->
      <div class="flex-1 relative overflow-hidden">
        <ngx-monaco-editor
          class="h-full w-full"
          [options]="editorOptions"
          [(ngModel)]="clientScript"
          (onInit)="onInitEditor($event)"
        ></ngx-monaco-editor>
      </div>

      <!-- Footer / API Snippets -->
      <div class="px-4 py-4 border-t border-white/5 bg-zinc-900 shrink-0">
        <div class="flex items-center justify-between mb-3 text-zinc-500 uppercase tracking-widest font-black text-[9px]">
           <div class="flex items-center gap-2">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
             <span>API Snippet Library</span>
           </div>
           <span class="text-emerald-400 opacity-60">Select to insert at cursor</span>
        </div>
        
        <div class="flex items-center gap-3">
          <select 
            #snippetSelect
            (change)="insertSnippet(snippetSelect.value); snippetSelect.value = ''"
            class="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500/50 transition-all cursor-pointer">
            <option value="" disabled selected>Search for a method...</option>
            @for (group of snippetGroups; track group.name) {
              <optgroup [label]="group.name">
                @for (s of group.items; track s.label) {
                  <option [value]="s.code">{{ s.label }}</option>
                }
              </optgroup>
            }
          </select>
          <div class="flex gap-1">
            <button (click)="insertOnRefresh()" class="ui-btn-ghost ui-btn-sm text-[10px] bg-zinc-800/50 border-zinc-700/50">on:refresh</button>
            <button (click)="insertMsgprint()" class="ui-btn-ghost ui-btn-sm text-[10px] bg-zinc-800/50 border-zinc-700/50">msgprint</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    ngx-monaco-editor { height: 100%; }
    select optgroup { @apply bg-zinc-900 text-zinc-500 font-bold uppercase tracking-wider text-[10px]; }
    select option { @apply bg-zinc-800 text-zinc-300 py-2; }
  `]
})
export class VfScriptEditor {
  state = inject(VfBuilderState);
  editorInstance: any;
  private scriptSupportRegistration: { dispose(): void } | null = null;

  insertOnRefresh() {
    this.insertSnippet("frm.on('refresh', (val, frm) => {\n  \n});");
  }

  insertMsgprint() {
    this.insertSnippet("frm.msgprint('Hello World');");
  }

  get clientScript(): string {
    return this.state.activeClientScript();
  }

  set clientScript(value: string) {
    this.state.setClientScript(value);
  }

  editorOptions = {
    theme: 'vs-dark',
    language: 'javascript',
    minimap: { enabled: false },
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    padding: { top: 16 },
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true },
    formatOnPaste: true,
    formatOnType: true,
    readOnly: false
  };

  snippetGroups = [
    {
      name: 'Events & Hooks',
      items: [
        { label: 'frm.on(refresh)', code: "frm.on('refresh', () => {\n  // Logic on load\n});" },
        { label: 'frm.on(validate)', code: "frm.on('validate', () => {\n  if (!frm.get_value('email')) {\n    frm.throw('Email is mandatory');\n    return false;\n  }\n});" },
        { label: 'frm.on(field change)', code: "frm.on('fieldname', (val) => {\n  frm.msgprint('Value changed to ' + val);\n});" },
        { label: 'frm.validate', code: "if (!frm.validate()) {\n  return false;\n}" },
        { label: 'frm.validate_step', code: "if (!frm.validate_step()) {\n  return false;\n}" },
      ]
    },
    {
      name: 'UI & Interactions',
      items: [
        { label: 'frm.msgprint', code: "frm.msgprint('Success!', 'success');" },
        { label: 'frm.throw', code: "frm.throw('Error message');" },
        { label: 'frm.confirm', code: "frm.confirm('Proceed?', () => {\n  frm.msgprint('Confirmed');\n});" },
        { label: 'frm.prompt', code: "const vals = await frm.prompt([\n  { label: 'Reason', fieldname: 'reason', fieldtype: 'Data', mandatory: 1 }\n], undefined, 'Provide Reason');\nif (vals?.reason) {\n  console.log(vals.reason);\n}" },
        { label: 'frm.set_intro', code: "frm.set_intro('Welcome to VantFlow', 'blue');" },
      ]
    },
    {
      name: 'Form State',
      items: [
        { label: 'frm.set_value', code: "frm.set_value('fieldname', 'value');" },
        { label: 'frm.get_value', code: "const val = frm.get_value('fieldname');" },
        { label: 'frm.is_new', code: "if (frm.is_new()) {\n  frm.set_intro('Creating a new record', 'blue');\n}" },
        { label: 'frm.has_field', code: "if (frm.has_field('comment')) {\n  frm.set_df_property('comment', 'reqd', 1);\n}" },
        { label: 'frm.has_field (Many)', code: "if (frm.has_field(['comment', { field: 'items', child: 'reason' }], { mode: 'any' })) {\n  frm.msgprint('At least one reason surface exists');\n}" },
        { label: 'frm.set_readonly', code: "frm.set_readonly(true);" },
        { label: 'frm.set_df_property', code: "frm.set_df_property('fieldname', 'read_only', 1);" },
        { label: 'frm.set_df_property (Bulk)', code: "frm.set_df_property(['reviewer', 'manager', 'finance'], 'read_only', 1);" },
        { label: 'frm.set_df_property (reqd alias)', code: "frm.set_df_property('fieldname', 'reqd', 1);" },
        { label: 'frm.set_df_property (Table Column)', code: "frm.set_df_property('table_fieldname', 'options', '.pdf,.jpg', 'column_fieldname');" },
        { label: 'frm.set_filter (Url Lookup)', code: "frm.set_filter('item', { category: 'Voucher', brand: frm.get_value('brand') });" },
        { label: 'frm.refresh_link', code: "frm.refresh_link('item');" },
      ]
    },
    {
      name: 'Actions & API',
      items: [
        { label: 'frm.call (Remote Method)', code: "frm.call({\n  method: 'my_method',\n  args: {},\n  freeze: true,\n  callback: (r) => {\n    console.log(r);\n  }\n});" },
        { label: 'frm.add_custom_button', code: "frm.add_custom_button('Custom Button', async (frm) => {\n  const vals = await frm.prompt([\n    { label: 'Reason', fieldname: 'reason', fieldtype: 'Data', mandatory: 1 }\n  ], undefined, 'Provide Reason');\n  if (!vals?.reason) return false;\n  frm.msgprint('Captured: ' + vals.reason);\n}, 'primary');" },
        { label: 'frm.set_button_label', code: "frm.set_button_label('submit', 'Send Now');" },
        { label: 'frm.set_button_action', code: "frm.set_button_action('decline', async (frm) => {\n  if (frm.get_value('comment')) return true;\n  const vals = await frm.prompt([\n    { label: 'Reason', fieldname: 'comment', fieldtype: 'Text', mandatory: 1 }\n  ], undefined, 'Decline Reason');\n  if (!vals?.comment) return false;\n  frm.set_value('comment', vals.comment);\n  return true;\n});" },
        { label: 'frm.set_button_property', code: "frm.set_button_property(['submit', 'approve'], 'visible', false);" },
      ]
    },
    {
      name: 'Form Stepper',
      items: [
        { label: 'frm.next_step', code: "frm.next_step();" },
        { label: 'frm.prev_step', code: "frm.prev_step();" },
        { label: 'frm.go_to_step', code: "frm.go_to_step('step_id');" },
        { label: 'frm.set_step_hidden', code: "frm.set_step_hidden('step_id', true);" },
        { label: 'frm.on(before_step_change)', code: "frm.on('before_step_change', (val, frm) => {\n  // val is { from: number, to: number }\n  // return false to cancel\n});" },
        { label: 'frm.on(after_step_change)', code: "frm.on('after_step_change', (val, frm) => {\n  // val is { from: number, to: number }\n});" },
      ]
    }
  ];

  onInitEditor(editor: any) {
    this.editorInstance = editor;

    // Ensure the editor is not readonly
    editor.updateOptions({ readOnly: false });

    // Set up custom typings for frm and app
    const monaco = (window as any).monaco || editor?.monaco || (editor as any)._monaco;
    if (!monaco) {
      console.warn('[ScriptEditor] Monaco object not found. Asset loading might have failed.');
      return;
    }

    this.scriptSupportRegistration?.dispose();
    this.scriptSupportRegistration = registerVfScriptEditorSupport(monaco, {
      language: 'javascript'
    });
  }

  insertSnippet(code: string) {
    if (this.editorInstance) {
      this.editorInstance.focus();
      const selection = this.editorInstance.getSelection();
      const op = {
        range: selection,
        text: code,
        forceMoveMarkers: true
      };
      this.editorInstance.executeEdits('snippet-source', [op]);
    } else {
      console.warn('[ScriptEditor] Editor instance not ready for snippet insertion');
      const current = this.state.activeClientScript() || '';
      this.state.setClientScript(current + (current ? '\n\n' : '') + code);
    }
  }
}
