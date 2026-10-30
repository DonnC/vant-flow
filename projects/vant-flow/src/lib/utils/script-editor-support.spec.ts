import {
  buildVfScriptEditorApiTypings,
  matchVfScriptEditorCompletion,
  VfScriptNamespace
} from './script-editor-support';

describe('script editor support', () => {
  const crm: VfScriptNamespace = {
    name: 'crm',
    completions: [
      { label: 'find_customer', insertText: "find_customer('${1:id}')", documentation: 'Find a customer.' },
      { label: 'sync', insertText: 'sync()', documentation: 'Sync now.' }
    ],
    declarations: 'declare const crm: { sync(): void };'
  };

  it('completes frm without any host namespace', () => {
    const match = matchVfScriptEditorCompletion('  frm.set_v');
    expect(match?.namespace).toBe('frm');
    expect(match?.completion.label).toBe('set_value');
  });

  it('ignores a host global that was not supplied', () => {
    expect(matchVfScriptEditorCompletion('  crm.sy')).toBeNull();
  });

  it('completes a host-supplied namespace', () => {
    const match = matchVfScriptEditorCompletion('const x = crm.sy', [crm]);
    expect(match?.namespace).toBe('crm');
    expect(match?.completion.label).toBe('sync');
  });

  it('adds host declarations to the typings only when supplied', () => {
    expect(buildVfScriptEditorApiTypings()).not.toContain('declare const crm');
    expect(buildVfScriptEditorApiTypings({ namespaces: [crm] })).toContain('declare const crm: { sync(): void };');
  });
});
