export interface VfScriptEditorCompletion {
  label: string;
  insertText: string;
  documentation: string;
  kind?: 'method' | 'property';
}

export interface VfScriptEditorSupportRegistration {
  dispose: () => void;
}

export interface VfScriptEditorSupportOptions {
  language?: string;
  includeBaobabApi?: boolean;
  extraDeclarations?: string;
}

type MonacoRange = new (
  startLineNumber: number,
  startColumn: number,
  endLineNumber: number,
  endColumn: number
) => unknown;

type MonacoLike = {
  Range: MonacoRange;
  languages: {
    registerCompletionItemProvider: (language: string, provider: unknown) => { dispose: () => void };
    CompletionItemKind: Record<string, number>;
    CompletionItemInsertTextRule?: Record<string, number>;
    typescript?: {
      javascriptDefaults?: {
        setDiagnosticsOptions?: (options: Record<string, unknown>) => void;
        setEagerModelSync?: (enabled: boolean) => void;
        setCompilerOptions?: (options: Record<string, unknown>) => void;
        addExtraLib?: (content: string, filePath?: string) => { dispose: () => void };
      };
      ScriptTarget?: Record<string, unknown>;
    };
  };
};

export const VF_FRM_METHOD_COMPLETIONS: readonly VfScriptEditorCompletion[] = [
  { label: 'on', insertText: "on('${1:event}', (${2:val}, ${3:frm}) => {\n  $0\n})", documentation: 'Listen to field or form events.' },
  { label: 'validate', insertText: 'validate()', documentation: 'Run full-form validation.' },
  { label: 'validate_step', insertText: 'validate_step()', documentation: 'Run current step validation.' },
  { label: 'set_value', insertText: "set_value('${1:fieldname}', ${2:value})", documentation: 'Set a field value.' },
  { label: 'get_value', insertText: "get_value('${1:fieldname}')", documentation: 'Read a field value.' },
  { label: 'has_field', insertText: "has_field('${1:fieldname}')", documentation: 'Check whether a field exists. Also supports arrays with { mode: "all" | "any" }.' },
  { label: 'set_df_property', insertText: "set_df_property('${1:fieldname}', '${2:read_only}', ${3:true})", documentation: 'Change runtime field properties.' },
  { label: 'set_filter', insertText: "set_filter('${1:fieldname}', { ${2:key}: ${3:value} })", documentation: 'Replace a Link/lookup field filter set.' },
  { label: 'refresh_link', insertText: "refresh_link('${1:fieldname}')", documentation: 'Force a Link field to reload.' },
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
  { label: 'unfreeze', insertText: 'unfreeze()', documentation: 'Hide the global loading overlay.' },
  { label: 'metadata', insertText: 'metadata', documentation: 'Read the injected runtime metadata object for current user, tenant, permissions, and host context.', kind: 'property' }
] as const;

export const VF_BAOBAB_METHOD_COMPLETIONS: readonly VfScriptEditorCompletion[] = [
  { label: 'get_context', insertText: 'get_context()', documentation: 'Get the active request context.' },
  { label: 'get_doc', insertText: "get_doc('${1:Document}', '${2:name}')", documentation: 'Fetch one Baobab document.' },
  { label: 'get_list', insertText: "get_list('${1:Document}', ${2:20}, ${3:0})", documentation: 'Fetch a document list page.' },
  { label: 'get_form_runtime', insertText: "get_form_runtime('${1:Document}')", documentation: 'Fetch the runtime descriptor for a document.' },
  { label: 'get_meta', insertText: "get_meta('${1:Document}')", documentation: 'Fetch the schema metadata for a document.' },
  { label: 'get_current_doc', insertText: 'get_current_doc()', documentation: 'Read the current document context mounted into the script bridge.' },
  { label: 'msgprint', insertText: "msgprint('${1:message}', '${2:Baobab}')", documentation: 'Show a quick desk message.' },
  { label: 'notify', insertText: "notify('${1:message}', '${2:Baobab}')", documentation: 'Show a success notification.' },
  { label: 'confirm', insertText: "confirm('${1:Proceed?}')", documentation: 'Open a promise-based confirm dialog.' },
  { label: 'set_route', insertText: "set_route('${1:Document}', '${2:name}')", documentation: 'Navigate to a document or list route.' },
  { label: 'new_doc', insertText: "new_doc('${1:Document}')", documentation: 'Open a new Baobab document route.' },
  { label: 'today', insertText: 'today()', documentation: 'Get the current date string.' },
  { label: 'now', insertText: 'now()', documentation: 'Get the current datetime string.' },
  { label: 'format_date', insertText: "format_date('${1:2026-07-06}', '${2:mediumDate}')", documentation: 'Format a date with the desk locale.' }
] as const;

export function matchVfScriptEditorCompletion(
  linePrefix: string,
  includeBaobabApi = false
): { namespace: 'frm' | 'baobab'; typedPrefix: string; completion: VfScriptEditorCompletion } | null {
  const frmMatch = linePrefix.match(/\bfrm\.(\w*)$/);
  if (frmMatch) {
    const typedPrefix = frmMatch[1] ?? '';
    return {
      namespace: 'frm',
      typedPrefix,
      completion: VF_FRM_METHOD_COMPLETIONS.find(item => item.label.startsWith(typedPrefix)) ?? VF_FRM_METHOD_COMPLETIONS[0]
    };
  }

  if (!includeBaobabApi) {
    return null;
  }

  const baobabMatch = linePrefix.match(/\bbaobab\.(\w*)$/);
  if (!baobabMatch) {
    return null;
  }

  const typedPrefix = baobabMatch[1] ?? '';
  return {
    namespace: 'baobab',
    typedPrefix,
    completion: VF_BAOBAB_METHOD_COMPLETIONS.find(item => item.label.startsWith(typedPrefix)) ?? VF_BAOBAB_METHOD_COMPLETIONS[0]
  };
}

export function buildVfScriptEditorApiTypings(options: VfScriptEditorSupportOptions = {}): string {
  const { includeBaobabApi = false, extraDeclarations = '' } = options;
  return `
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
      link_config?: {
        data_source: string;
        mapping: { id: string; title: string; description?: string };
        filters?: Record<string, any>;
        method?: 'GET' | 'POST';
        search_param?: string;
        limit_param?: string;
        results_path?: string;
        cache?: boolean;
        min_query_length?: number;
        page_size?: number;
      };
    }

    declare interface VfFieldQuery {
      field: string;
      child?: string;
    }

    declare interface VfButtonActionContext {
      action: string;
      label: string;
      source: 'default' | 'custom';
    }

    declare interface VfDocumentPermission {
      access: boolean;
      read: boolean;
      create: boolean;
      write: boolean;
      delete: boolean;
      design: boolean;
    }

    declare interface VfModulePermission {
      access: boolean;
      design: boolean;
    }

    declare interface VfRuntimeMetadata {
      document_type?: string;
      document_name?: string | null;
      document_id?: string | null;
      module?: string;
      app?: string;
      tenant?: Record<string, any> & { id?: string };
      currentUser?: Record<string, any> & {
        actor?: string;
        email?: string;
        display_name?: string;
        enabled?: boolean;
        status?: string;
        roles?: string[];
        primary_role?: string | null;
      };
      permissions?: {
        modules?: Record<string, VfModulePermission>;
        documents?: Record<string, VfDocumentPermission>;
      };
      lifecycle?: {
        is_new?: boolean;
        readonly?: boolean;
        [key: string]: any;
      };
      baobab?: Record<string, any>;
      [key: string]: any;
    }

    declare interface VfFormContext {
      on(event: string, handler: (value?: unknown, frm?: VfFormContext) => void): void;
      validate(): boolean;
      validate_step(): boolean;
      set_value(fieldname: string, value: unknown): void;
      set_value(values: Record<string, unknown>): void;
      get_value(fieldname: string): unknown;
      is_new(): boolean;
      has_field(fieldname: string, childFieldName?: string): boolean;
      has_field(fields: Array<string | VfFieldQuery>, options?: { mode?: 'all' | 'any' }): boolean;
      set_df_property(fieldname: string | string[], property: string, value: unknown, childFieldName?: string): void;
      set_filter(fieldname: string, filter: Record<string, unknown>): void;
      refresh_link(fieldname: string): void;
      set_section_property(sectionId: string, property: string, value: unknown): void;
      refresh_field?(fieldname: string): void;
      set_intro(message: string, color?: 'green' | 'blue' | 'orange' | 'red' | 'yellow' | 'gray'): void;
      msgprint(message: string, indicator?: 'success' | 'error' | 'info' | 'warning'): void;
      confirm(message: string, onConfirm?: () => void, onCancel?: () => void): void;
      prompt(fields: DocumentField[], callback?: (values: unknown) => void, title?: string, readOnly?: boolean): Promise<unknown | null>;
      throw(message: string): void;
      set_readonly(readonly: boolean): void;
      add_custom_button(label: string, action: (frm: VfFormContext, context?: VfButtonActionContext) => boolean | void | Promise<boolean | void>, type?: 'primary' | 'secondary' | 'danger' | 'ghost', disable_on_readonly?: boolean): void;
      clear_custom_buttons(): void;
      set_button_label(id: 'save' | 'submit' | 'approve' | 'decline', label: string): void;
      set_button_action(id: string, action: (frm: VfFormContext, context?: VfButtonActionContext) => boolean | void | Promise<boolean | void>): void;
      set_button_property(id: string | string[], property: string, value: unknown): void;
      call(options: {
        method: string;
        args?: Record<string, unknown>;
        callback?: (response: unknown) => void;
        freeze?: boolean;
        freeze_message?: string;
      }): Promise<unknown>;
      reset(): void;
      add_row(fieldname: string, row?: Record<string, unknown>): void;
      remove_row(fieldname: string, index: number): void;
      next_step(): void;
      prev_step(): void;
      go_to_step(indexOrId: number | string): void;
      set_step_hidden(stepId: string, hidden: boolean): void;
      freeze(message?: string): void;
      unfreeze(): void;
      metadata?: VfRuntimeMetadata;
    }

    declare const frm: VfFormContext;
    ${includeBaobabApi ? `
    declare const baobab: {
      get_context(): Record<string, unknown>;
      get_doc(doctype: string, name: string): Promise<unknown>;
      get_list(doctype: string, limit?: number, offset?: number): Promise<unknown>;
      get_form_runtime(doctype: string): Promise<unknown>;
      get_meta(doctype: string): Promise<unknown>;
      get_current_doc(): Promise<unknown> | unknown;
      msgprint(message: string, title?: string): void;
      notify(message: string, title?: string): void;
      confirm(message: string): Promise<boolean>;
      set_route(doctype: string, name?: string | null): Promise<boolean>;
      new_doc(doctype: string, builder?: boolean): Promise<boolean>;
      today(): string;
      now(): string;
      format_date(value: string | Date, pattern?: string): string;
    };
    ` : ''}
    ${extraDeclarations}
  `;
}

export function registerVfScriptEditorSupport(
  monaco: MonacoLike,
  options: VfScriptEditorSupportOptions = {}
): VfScriptEditorSupportRegistration {
  const language = options.language ?? 'javascript';
  const includeBaobabApi = options.includeBaobabApi ?? false;
  const javascriptDefaults = monaco.languages.typescript?.javascriptDefaults;

  javascriptDefaults?.setDiagnosticsOptions?.({
    noSemanticValidation: false,
    noSyntaxValidation: false
  });
  javascriptDefaults?.setEagerModelSync?.(true);
  javascriptDefaults?.setCompilerOptions?.({
    target: monaco.languages.typescript?.ScriptTarget?.['ESNext'],
    allowNonTsExtensions: true,
    checkJs: true,
    lib: ['esnext', 'dom']
  });

  const extraLibDisposable = javascriptDefaults?.addExtraLib?.(
    buildVfScriptEditorApiTypings(options),
    includeBaobabApi ? 'ts:baobab-vant-flow/form-script-api.d.ts' : 'ts:vant-flow/form-script-api.d.ts'
  );

  const completionProviderDisposable = monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', '(', '\'', '"'],
    provideCompletionItems: (
      model: {
        getLineContent: (lineNumber: number) => string;
        getWordUntilPosition: (position: { lineNumber: number; column: number }) => {
          startColumn: number;
          endColumn: number;
          word: string;
        };
      },
      position: { lineNumber: number; column: number }
    ) => {
      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const match = matchVfScriptEditorCompletion(linePrefix, includeBaobabApi);
      if (!match) {
        return { suggestions: [] };
      }

      const word = model.getWordUntilPosition(position);
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      );
      const suggestionsSource = match.namespace === 'frm'
        ? VF_FRM_METHOD_COMPLETIONS.map(item => ({ ...item, label: `frm.${item.label}` }))
        : VF_BAOBAB_METHOD_COMPLETIONS.map(item => ({ ...item, label: `baobab.${item.label}` }));

      return {
        suggestions: suggestionsSource.map(({ label, insertText, documentation, kind }) => ({
          label,
          kind: kind === 'property'
            ? monaco.languages.CompletionItemKind['Property']
            : monaco.languages.CompletionItemKind['Function'],
          insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule?.['InsertAsSnippet'],
          documentation,
          sortText: '0000',
          range
        }))
      };
    }
  });

  return {
    dispose: () => {
      extraLibDisposable?.dispose?.();
      completionProviderDisposable?.dispose?.();
    }
  };
}
