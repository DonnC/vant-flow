export interface VfScriptEditorCompletion {
  label: string;
  insertText: string;
  documentation: string;
  kind?: 'method' | 'property';
}

export interface VfScriptEditorSupportRegistration {
  dispose: () => void;
}

/**
 * A global object that host scripts can call besides `frm`, such as an app's own API. The host
 * supplies its completions and TypeScript declarations; Vant Flow only knows `frm`.
 */
export interface VfScriptNamespace {
  /** The global name scripts type, without the dot. */
  name: string;
  completions: readonly VfScriptEditorCompletion[];
  /** Declarations for the global, for example `declare const api: { ping(): void };`. */
  declarations?: string;
}

export interface VfScriptEditorSupportOptions {
  language?: string;
  /** Extra script globals with their completions and typings. */
  namespaces?: readonly VfScriptNamespace[];
  extraDeclarations?: string;
}

export interface VfScriptEditorCompletionMatch {
  namespace: string;
  typedPrefix: string;
  completion: VfScriptEditorCompletion;
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

const FRM_NAMESPACE: VfScriptNamespace = { name: 'frm', completions: VF_FRM_METHOD_COMPLETIONS };

/** The completion for the `name.prefix` being typed at the end of `linePrefix`, if any namespace matches. */
export function matchVfScriptEditorCompletion(
  linePrefix: string,
  namespaces: readonly VfScriptNamespace[] = []
): VfScriptEditorCompletionMatch | null {
  for (const namespace of [FRM_NAMESPACE, ...namespaces]) {
    const match = linePrefix.match(new RegExp(`\\b${escapeRegExp(namespace.name)}\\.(\\w*)$`));
    if (!match || namespace.completions.length === 0) {
      continue;
    }
    const typedPrefix = match[1] ?? '';
    return {
      namespace: namespace.name,
      typedPrefix,
      completion: namespace.completions.find(item => item.label.startsWith(typedPrefix)) ?? namespace.completions[0]
    };
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildVfScriptEditorApiTypings(options: VfScriptEditorSupportOptions = {}): string {
  const { namespaces = [], extraDeclarations = '' } = options;
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
    ${namespaces.map(namespace => namespace.declarations ?? '').join('\n')}
    ${extraDeclarations}
  `;
}

export function registerVfScriptEditorSupport(
  monaco: MonacoLike,
  options: VfScriptEditorSupportOptions = {}
): VfScriptEditorSupportRegistration {
  const language = options.language ?? 'javascript';
  const namespaces = options.namespaces ?? [];
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
    'ts:vant-flow/form-script-api.d.ts'
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
      const match = matchVfScriptEditorCompletion(linePrefix, namespaces);
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
      const completions = [FRM_NAMESPACE, ...namespaces].find(namespace => namespace.name === match.namespace)?.completions ?? [];
      const suggestionsSource = completions.map(item => ({ ...item, label: `${match.namespace}.${item.label}` }));

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
