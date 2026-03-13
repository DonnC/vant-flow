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
           <span class="text-emerald-400 opacity-60">Click to insert at cursor</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          @for (s of snippets; track s.label) {
            <button (click)="insertSnippet(s.code)" 
              class="px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-emerald-500/50 transition-all font-mono text-[10px] shadow-sm">
              {{ s.label }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    ngx-monaco-editor { height: 100%; }
  `]
})
export class ScriptEditorComponent {
  state = inject(BuilderStateService);
  editorInstance: any;

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

  snippets = [
    { label: 'frm.on(refresh)', code: "frm.on('refresh', () => {\n  // Logic on load\n});" },
    { label: 'frm.on(change)', code: "frm.on('fieldname', (val) => {\n  frm.msgprint('Value changed to ' + val);\n});" },
    { label: 'frm.set_value', code: "frm.set_value('fieldname', 'value');" },
    { label: 'frm.set_intro', code: "frm.set_intro('Welcome to FormFlow', 'blue');" },
    { label: 'frm.msgprint', code: "frm.msgprint('Success!', 'success');" },
    { label: 'frm.confirm', code: "frm.confirm('Proceed?', () => {\n  frm.msgprint('Confirmed');\n});" },
    { label: 'frm.prompt', code: "frm.prompt([\n  { label: 'Reason', fieldname: 'reason', fieldtype: 'Text' }\n], (vals) => {\n  console.log(vals);\n}, 'Provide Reason');" },
    { label: 'frm.throw', code: "frm.throw('Error message');" },
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
      }

      declare interface FormContext {
        /** Set value of a field */
        set_value(fieldname: string, value: any): void;
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
        on(event: 'refresh' | string, callback: (val?: any) => void): void;
      }

      /** The main Form Context object */
      declare const frm: FormContext;
      
      /** Global Application Utilities */
      declare const app: {
        show_alert(msg: string, indicator?: 'success' | 'error' | 'info' | 'warning'): void;
        prompt(fields: DocumentField[], title?: string): Promise<any>;
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
