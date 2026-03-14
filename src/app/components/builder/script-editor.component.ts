import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { BuilderStateService } from '../../services/builder-state.service';

@Component({
  selector: 'app-script-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorModule],
  template: `
    <div class="flex flex-col h-full bg-zinc-950">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-white/10 bg-zinc-900 flex items-center justify-between shrink-0">
        <div>
           <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Client Script</p>
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
export class ScriptEditorComponent {
  state = inject(BuilderStateService);
  editorInstance: any;

  insertOnRefresh() {
    this.insertSnippet("frm.on('refresh', () => {\n  \n});");
  }

  insertMsgprint() {
    this.insertSnippet("frm.msgprint('Hello World');");
  }

  get clientScript(): string {
    return this.state.document().client_script ?? '';
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
      ]
    },
    {
      name: 'UI & Interactions',
      items: [
        { label: 'frm.msgprint', code: "frm.msgprint('Success!', 'success');" },
        { label: 'frm.throw', code: "frm.throw('Error message');" },
        { label: 'frm.confirm', code: "frm.confirm('Proceed?', () => {\n  frm.msgprint('Confirmed');\n});" },
        { label: 'frm.prompt', code: "frm.prompt([\n  { label: 'Reason', fieldname: 'reason', fieldtype: 'Data', mandatory: 1 }\n], (vals) => {\n  console.log(vals);\n}, 'Provide Reason');" },
        { label: 'frm.set_intro', code: "frm.set_intro('Welcome to FormFlow', 'blue');" },
      ]
    },
    {
      name: 'Form State',
      items: [
        { label: 'frm.set_value', code: "frm.set_value('fieldname', 'value');" },
        { label: 'frm.get_value', code: "const val = frm.get_value('fieldname');" },
        { label: 'frm.set_readonly', code: "frm.set_readonly(true);" },
        { label: 'frm.set_df_property', code: "frm.set_df_property('fieldname', 'read_only', 1);" },
      ]
    },
    {
      name: 'Actions & API',
      items: [
        { label: 'frm.call (Remote Method)', code: "frm.call({\n  method: 'my_method',\n  args: {},\n  freeze: true,\n  callback: (r) => {\n    console.log(r);\n  }\n});" },
        { label: 'frm.add_custom_button', code: "frm.add_custom_button('Custom Button', () => {\n  frm.msgprint('Clicked');\n}, 'primary');" },
        { label: 'frm.set_button_label', code: "frm.set_button_label('submit', 'Send Now');" },
        { label: 'frm.set_button_action', code: "frm.set_button_action('submit', () => {\n  frm.msgprint('Custom submit logic');\n});" },
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

    const dts = `
      /** FormFlow Client Script Context */
      declare interface DocumentField {
        label?: string;
        fieldname: string;
        fieldtype: string;
        options?: string;
        description?: string;
        placeholder?: string;
        default?: any;
        mandatory?: number;
        read_only?: number;
        hidden?: number;
        regex?: string;
      }

      declare interface FormContext {
        /** Set value of a field */
        set_value(fieldname: string, value: any): void;
        /** Set multiple values at once */
        set_value(values: Record<string, any>): void;
        /** Get value of a field */
        get_value(fieldname: string): any;
        /** Set a property of a field (hidden, read_only, mandatory, etc.) */
        set_df_property(fieldname: string, prop: 'hidden' | 'read_only' | 'mandatory' | 'label' | 'options', val: any): void;
        /** Set a property of a section (hidden, label, description) */
        set_section_property(sectionId: string, prop: 'hidden' | 'label' | 'description', val: any): void;
        /** Show an introduction banner at the top of the form */
        set_intro(message: string, color?: 'blue' | 'orange' | 'red' | 'green' | 'yellow' | 'gray'): void;
        /** Show a toast notification */
        msgprint(message: string, indicator?: 'success' | 'error' | 'info' | 'warning'): void;
        /** Show a confirmation dialog */
        confirm(message: string, on_confirm?: () => void, on_cancel?: () => void): void;
        /** Show a prompt dialog with fields */
        prompt(fields: DocumentField[], callback: (values: any) => void, title?: string): void;
        /** Show error and stop execution */
        throw(message: string): void;
        /** Listen to field or form events */
        on(event: 'refresh' | 'validate' | string, callback: (frm: FormContext, val?: any) => void): void;
        
        /** Control global readonly state */
        set_readonly(readonly: boolean): void;
        /** Add a custom button to the header */
        add_custom_button(label: string, action: () => void, type?: 'primary' | 'secondary' | 'danger' | 'ghost'): void;
        /** Clear all custom buttons */
        clear_custom_buttons(): void;
        /** Dynamically change a default button label */
        set_button_label(id: 'save' | 'submit' | 'approve' | 'decline', label: string): void;
        /** Override a default button action */
        set_button_action(id: 'save' | 'submit' | 'approve' | 'decline', action: (frm: FormContext) => void): void;
        
        /** Remote procedure call */
        call(opts: { 
            method: string; 
            args?: any; 
            callback?: (r: any) => void; 
            freeze?: boolean; 
            freeze_message?: string 
        }): Promise<any>;
        
        /** Global UI freezing */
        freeze(message?: string): void;
        unfreeze(): void;
      }

      /** The main Form Context object */
      declare const frm: FormContext;
      
      /** Global Application Utilities */
      declare const frappe: {
        ui: {
            form: {
                /** Listen to field or form events */
                on(event: 'refresh' | 'validate' | string, callback: (frm: FormContext, val?: any) => void): void;
            }
        };
        msgprint: (message: string, indicator?: 'success' | 'error' | 'info' | 'warning') => void;
        confirm: (message: string, on_confirm?: () => void, on_cancel?: () => void) => void;
        prompt: (fields: DocumentField[], callback: (values: any) => void, title?: string) => void;
        throw: (message: string) => void;
        call: (opts: any) => Promise<any>;
        freeze: (message?: string) => void;
        unfreeze: () => void;
        show_alert: (message: string, indicator?: string) => void;
      };
    `;

    // Register the lib
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
    });

    monaco.languages.typescript.javascriptDefaults.addExtraLib(dts, 'ts:filename/factories.d.ts');
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
      const current = this.state.document().client_script || '';
      this.state.setClientScript(current + (current ? '\n\n' : '') + code);
    }
  }
}
