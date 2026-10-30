import { buildVfScriptEditorApiTypings, matchVfScriptEditorCompletion } from 'vant-flow';
import { BAOBAB_LINK_NAME_KEY, baobabLinkHref } from './link-href';
import { VF_BAOBAB_SCRIPT_NAMESPACE } from './script-namespace';

describe('Baobab preset', () => {
  it('opens a linked document by its Baobab name, not its id', () => {
    const href = baobabLinkHref()({
      document: 'Project',
      value: '8f4c-uuid',
      option: { id: '8f4c-uuid', [BAOBAB_LINK_NAME_KEY]: 'Office refit' }
    });
    expect(href).toBe('/desk/app/Project/Office%20refit');
  });

  it('falls back to the stored value and honours a custom Desk base', () => {
    expect(baobabLinkHref('/portal/app/')({ document: 'Task', value: 'TSK-1', option: null }))
      .toBe('/portal/app/Task/TSK-1');
  });

  it('gives the script editor the baobab global', () => {
    const match = matchVfScriptEditorCompletion('baobab.get_d', [VF_BAOBAB_SCRIPT_NAMESPACE]);
    expect(match?.completion.label).toBe('get_doc');
    expect(buildVfScriptEditorApiTypings({ namespaces: [VF_BAOBAB_SCRIPT_NAMESPACE] })).toContain('declare const baobab');
  });
});
