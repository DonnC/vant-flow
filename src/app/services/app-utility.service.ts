import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DocumentField } from '../models/document.model';

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
export class AppUtilityService {
  readonly toasts = signal<Toast[]>([]);
  readonly isFreezing = signal<string | null>(null);

  private http = inject(HttpClient);

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
   * Injects a dialog element directly into the DOM to avoid Material dependency.
   */
  prompt(fields: DocumentField[], title: string = 'Enter Data'): Promise<Record<string, any> | null> {
    return new Promise(resolve => {
      // Create modal container
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] fade-in'; // High z-index

      const values: Record<string, any> = {};
      fields.forEach(f => { values[f.fieldname] = f.default ?? ''; });

      overlay.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden zoom-in duration-200">
          <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h3 class="text-base font-semibold text-zinc-900">${title}</h3>
            <button data-close class="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
          </div>
          <div class="px-6 py-5 space-y-4">
            ${fields.map(f => `
              <div>
                <label class="ui-label">${f.label}${f.mandatory ? '<span class="text-red-500 ml-0.5">*</span>' : ''}</label>
                ${f.fieldtype === 'Select'
          ? `
                    <select data-field="${f.fieldname}" class="ui-select ${f.read_only ? 'opacity-50 cursor-not-allowed' : ''}" ${f.read_only ? 'disabled' : ''}>
                      <option value="">Select ${f.label}...</option>
                      ${(f.options || '').split('\n').filter(o => o.trim()).map(o => `
                        <option value="${o.trim()}" ${o.trim() === (values[f.fieldname] || '') ? 'selected' : ''}>${o.trim()}</option>
                      `).join('')}
                    </select>
                  `
          : `
                    <input data-field="${f.fieldname}" type="${f.fieldtype === 'Password' ? 'password' : 'text'}"
                           ${f.read_only ? 'disabled' : ''}
                           class="ui-input ${f.read_only ? 'bg-zinc-50 border-zinc-100 text-zinc-400 cursor-not-allowed' : ''}" 
                           placeholder="${f.placeholder || ''}" value="${values[f.fieldname] ?? ''}">
                  `
        }
              </div>
            `).join('')}
          </div>
          <div class="flex justify-end gap-2 px-6 py-4 bg-zinc-50 border-t border-zinc-100">
            <button data-cancel class="ui-btn-secondary">Cancel</button>
            <button data-submit class="ui-btn-primary">Submit</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const close = (result: any) => {
        overlay.classList.remove('fade-in');
        overlay.classList.add('fade-out');
        overlay.querySelector('div')?.classList.add('zoom-out');
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
          resolve(result);
        }, 210);
      };

      overlay.querySelector('[data-close]')?.addEventListener('click', (e) => { e.stopPropagation(); close(null); });
      overlay.querySelector('[data-cancel]')?.addEventListener('click', (e) => { e.stopPropagation(); close(null); });
      overlay.querySelector('[data-submit]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const result: Record<string, any> = {};
        let isValid = true;
        // ... rest of prompt method is already updated in previous successful steps or will be kept 

        fields.forEach(f => {
          const el = overlay.querySelector(`[data-field="${f.fieldname}"]`) as HTMLInputElement;
          const val = el?.value ?? '';

          // Validation
          if (f.mandatory && !val.trim()) {
            el.classList.add('border-red-500', 'bg-red-50');
            isValid = false;
          } else if (f.regex && val) {
            try {
              if (!new RegExp(f.regex).test(val)) {
                el.classList.add('border-red-500', 'bg-red-50');
                isValid = false;
              } else {
                el.classList.remove('border-red-500', 'bg-red-50');
              }
            } catch (e) { /* invalid regex pattern */ }
          } else {
            el.classList.remove('border-red-500', 'bg-red-50');
          }

          result[f.fieldname] = val;
        });

        if (isValid) close(result);
      });

      // Click outside to dismiss
      overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
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
}
