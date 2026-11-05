import {
  VfLinkDataSource, VfLinkHrefResolver, VfMediaHandler, VfMediaResolver,
  VfStoredMedia, registerVfScriptEditorSupport
} from 'vant-flow';

// Inject authenticated storage; the library does not prescribe a backend.
export function mediaCallbacks(storage: {
  upload(blob: Blob, name: string): Promise<VfStoredMedia>;
  resolve(fileId: string, action: 'preview' | 'download'): Promise<string>;
}): { mediaHandler: VfMediaHandler; mediaResolver: VfMediaResolver } {
  return {
    mediaHandler: async (payload, context) => {
      const blob = payload.fieldtype === 'Attach' ? payload.file : payload.blob;
      if (!blob) throw new Error('Signature blob is required by this storage adapter');
      const name = payload.fieldtype === 'Attach' ? payload.file.name : `${context.fieldname}.png`;
      const stored = await storage.upload(blob, name);
      if (!stored.fileId) throw new Error('Storage returned no file identity');
      return stored;
    },
    mediaResolver: async (media, context) => {
      if (typeof media === 'string') return media;
      return media.fileId ? storage.resolve(media.fileId, context.action) : null;
    }
  };
}

export function projectLinks(search: (query: string) => Promise<{ id: string; title: string }[]>): VfLinkDataSource {
  return request => search(request.query);
}

export const recordHref: VfLinkHrefResolver = ({ document, value }) => value
  ? `/records/${encodeURIComponent(document)}/${encodeURIComponent(String(value))}` : null;

export function installEditorSupport(monaco: Parameters<typeof registerVfScriptEditorSupport>[0]) {
  // The host must also provide the actual runtime 'api' global to its scripts.
  return registerVfScriptEditorSupport(monaco, {
    namespaces: [{
      name: 'api',
      completions: [{ label: 'ping', insertText: 'ping()', documentation: 'Check the host connection.' }],
      declarations: 'declare const api: { ping(): Promise<boolean> };'
    }]
  }); // Call dispose() on the returned registration when the editor is destroyed.
}
