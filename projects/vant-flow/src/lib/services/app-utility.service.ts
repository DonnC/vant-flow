import { Injectable, signal, ApplicationRef, EnvironmentInjector, createComponent } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DocumentField, VfLinkDataSource, VfLinkRequestObserver, VfMediaHandler, VfMediaResolver } from '../models/document.model';
import { VfFormContext } from './form-context';
import { VfPromptModal } from '../components/prompt-modal.component';

export type ToastIndicator = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  indicator: ToastIndicator;
}

export interface CallResponse<T = any> {
  message: T;
  success: boolean;
  error?: string;
  exception?: string;
  details?: any;
}

let _toastId = 0;

@Injectable({ providedIn: 'root' })
export class VfUtilityService {
  readonly toasts = signal<Toast[]>([]);
  readonly isFreezing = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector,
  ) {}

  show_alert(msg: string, indicator: ToastIndicator = 'info') {
    const id = ++_toastId;
    this.toasts.update(t => [...t, { id, message: msg, indicator }]);
    setTimeout(() => this.dismiss(id), 3500);
  }

  freeze(msg: string = 'Loading...') {
    this.isFreezing.set(msg);
  }

  unfreeze() {
    this.isFreezing.set(null);
  }

  dismiss(id: number) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }

  /**
   * Show a custom dialog built from Document Fields.
   * Centralized via PromptModalComponent.
   */
  prompt(
    fields: DocumentField[],
    title: string = 'Enter Data',
    readOnly: boolean = false,
    frm: VfFormContext,
    mediaHandler?: VfMediaHandler,
    mediaResolver?: VfMediaResolver,
    linkDataSource?: VfLinkDataSource,
    linkRequestObserver?: VfLinkRequestObserver,
    formMetadata?: any
  ): Promise<Record<string, any> | null> {
    return new Promise(resolve => {
      const initialValues: Record<string, any> = {};
      fields.forEach(f => { initialValues[f.fieldname] = f.default ?? ''; });

      const componentRef = createComponent(VfPromptModal, {
        environmentInjector: this.envInjector
      });

      componentRef.instance.fields = fields;
      componentRef.instance.title = title;
      componentRef.instance.values = initialValues;
      componentRef.instance.readOnly = readOnly;
      componentRef.instance.mediaHandler = mediaHandler;
      componentRef.instance.mediaResolver = mediaResolver;
      componentRef.instance.linkDataSource = linkDataSource;
      componentRef.instance.linkRequestObserver = linkRequestObserver;
      componentRef.instance.formMetadata = formMetadata;
      componentRef.instance.frm = frm;

      componentRef.instance.result.subscribe(res => {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        resolve(res);
      });

      this.appRef.attachView(componentRef.hostView);
      const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
      document.body.appendChild(domElem);
    });
  }

  confirm(message: string, on_confirm?: () => void, on_cancel?: () => void) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] fade-in';
    overlay.innerHTML = `
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden zoom-in duration-200">
            <div class="px-6 py-8 text-center">
              <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 class="text-base font-bold text-zinc-900 mb-2">Are you sure?</h3>
              <p class="text-sm text-zinc-500 leading-relaxed">${message}</p>
            </div>
            <div class="flex border-t border-zinc-100">
              <button data-cancel class="flex-1 px-4 py-3 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors border-r border-zinc-100">Cancel</button>
              <button data-confirm class="flex-1 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-zinc-50 transition-colors">Confirm</button>
            </div>
          </div>
        `;
    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.remove('fade-in');
      overlay.classList.add('fade-out');
      overlay.querySelector('div')?.classList.add('zoom-out');
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 200);
    };

    overlay.querySelector('[data-cancel]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
      if (on_cancel) setTimeout(() => on_cancel(), 210);
    });

    overlay.querySelector('[data-confirm]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
      if (on_confirm) setTimeout(() => on_confirm(), 210);
    });

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  /**
   * General purpose API caller.
   * Calls a remote method (endpoint) with provided arguments.
   * Standardizes response to avoid throwing in client scripts.
   */
  async call({ method, args, freeze, freeze_message }: { method: string; args?: any; freeze?: boolean; freeze_message?: string }): Promise<CallResponse> {
    if (freeze) this.freeze(freeze_message);

    try {
      const url = method.startsWith('http') ? method : `/api/method/${method}`;

      const response = await firstValueFrom(
        this.http.post<any>(url, args || {})
      );

      return {
        message: response,
        success: true
      };
    } catch (error: any) {
      console.error(`[AppUtilityService.call] Error calling ${method}:`, error);

      const errorMessage = error.error?.message || error.message || 'Network request failed';
      this.show_alert(errorMessage, 'error');

      return {
        message: null,
        success: false,
        error: errorMessage,
        exception: error.name || 'Error',
        details: error.error || error
      };
    } finally {
      if (freeze) this.unfreeze();
    }
  }

  generateId(): string {
    return Math.random().toString(36).substring(2, 12);
  }

  /** Sets a value at a nested path (e.g. "a.b.c") in an object */
  setDeepValue(obj: any, path: string, value: any) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }

  /** Gets a value from a nested path */
  getDeepValue(obj: any, path: string): any {
    return path.split('.').reduce((prev, curr) => prev && prev[curr], obj);
  }

  /** Flattens a nested object into a flat map based on paths */
  flattenObject(obj: any, parentPath = '', result: any = {}) {
    for (const key in obj) {
      const path = parentPath ? `${parentPath}.${key}` : key;
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        this.flattenObject(obj[key], path, result);
      } else {
        result[path] = obj[key];
      }
    }
    return result;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
