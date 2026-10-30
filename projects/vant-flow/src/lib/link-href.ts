import { InjectionToken } from '@angular/core';

/** What a Link field knows when its "open" button is shown. */
export interface VfLinkHrefTarget {
  /** The linked document type: the field's `options`. */
  document: string;
  /** The stored field value. */
  value: unknown;
  /** The option the user picked, as the link data source returned it, when still known. */
  option: Record<string, any> | null;
}

/** Returns where a Link field's "open" button goes, or null to hide the button. */
export type VfLinkHrefResolver = (target: VfLinkHrefTarget) => string | null;

/** Provided through `provideVfFlow({ linkHref })`. Without it, Link fields have no open button. */
export const VF_LINK_HREF = new InjectionToken<VfLinkHrefResolver>('VF_LINK_HREF');
