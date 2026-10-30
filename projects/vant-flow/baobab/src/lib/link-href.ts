import { VfLinkHrefResolver } from 'vant-flow';

/**
 * The key Baobab link options carry the linked document's name under. Link values are document
 * ids, while Desk routes use names.
 */
export const BAOBAB_LINK_NAME_KEY = '_baobab_name';

/** Opens a linked document in Baobab Desk, at `<deskBase>/<doctype>/<name>`. */
export function baobabLinkHref(deskBase = '/desk/app'): VfLinkHrefResolver {
  const base = deskBase.replace(/\/+$/, '');
  return ({ doctype, value, option }) => {
    const target = option?.[BAOBAB_LINK_NAME_KEY] ?? option?.['name'] ?? value;
    if (target === undefined || target === null || target === '') {
      return null;
    }
    return `${base}/${encodeURIComponent(doctype)}/${encodeURIComponent(String(target))}`;
  };
}
