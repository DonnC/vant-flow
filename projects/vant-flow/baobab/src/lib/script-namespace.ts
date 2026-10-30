import { VfScriptEditorCompletion, VfScriptNamespace } from 'vant-flow';

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

/** The `baobab` global Baobab Desk gives client scripts, for the script editor's completions and typings. */
export const VF_BAOBAB_SCRIPT_NAMESPACE: VfScriptNamespace = {
  name: 'baobab',
  completions: VF_BAOBAB_METHOD_COMPLETIONS,
  declarations: `
    declare const baobab: {
      get_context(): Record<string, unknown>;
      get_doc(document: string, name: string): Promise<unknown>;
      get_list(document: string, limit?: number, offset?: number): Promise<unknown>;
      get_form_runtime(document: string): Promise<unknown>;
      get_meta(document: string): Promise<unknown>;
      get_current_doc(): Promise<unknown> | unknown;
      msgprint(message: string, title?: string): void;
      notify(message: string, title?: string): void;
      confirm(message: string): Promise<boolean>;
      set_route(document: string, name?: string | null): Promise<boolean>;
      new_doc(document: string, builder?: boolean): Promise<boolean>;
      today(): string;
      now(): string;
      format_date(value: string | Date, pattern?: string): string;
    };
  `
};
