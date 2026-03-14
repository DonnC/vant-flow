import { Injectable, signal, inject } from '@angular/core';
import { DocumentField } from '../models/document.model';

export type ToastIndicator = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  indicator: ToastIndicator;
}

let _toastId = 0;

@Injectable({ providedIn: 'root' })
export class AppUtilityService {
  readonly toasts = signal<Toast[]>([]);
  readonly isFreezing = signal<string | null>(null);

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
      overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[60]'; // High z-index

      const values: Record<string, any> = {};
      fields.forEach(f => { values[f.fieldname] = f.default ?? ''; });

      overlay.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <h3 class="text-base font-semibold text-zinc-900">${title}</h3>
            <button data-close class="text-zinc-400 hover:text-zinc-600 text-xl leading-none">&times;</button>
          </div>
          <div class="px-6 py-5 space-y-4">
            ${fields.map(f => `
              <div>
                <label class="ui-label">${f.label}${f.mandatory ? '<span class="text-red-500 ml-0.5">*</span>' : ''}</label>
                <input data-field="${f.fieldname}" type="${f.fieldtype === 'Password' ? 'password' : 'text'}"
                       class="ui-input" placeholder="${f.placeholder || ''}" value="${values[f.fieldname] ?? ''}">
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
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        resolve(result);
      };

      overlay.querySelector('[data-close]')?.addEventListener('click', () => close(null));
      overlay.querySelector('[data-cancel]')?.addEventListener('click', () => close(null));
      overlay.querySelector('[data-submit]')?.addEventListener('click', () => {
        const result: Record<string, any> = {};
        let isValid = true;

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
    overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-in fade-in duration-200';
    overlay.innerHTML = `
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="px-6 py-8 text-center">
              <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 class="text-base font-bold text-zinc-900 mb-2">Are you sure?</h3>
              <p class="text-sm text-zinc-500">${message}</p>
            </div>
            <div class="flex border-t border-zinc-100">
              <button data-cancel class="flex-1 px-4 py-3 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors border-r border-zinc-100">Cancel</button>
              <button data-confirm class="flex-1 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-zinc-50 transition-colors">Confirm</button>
            </div>
          </div>
        `;
    document.body.appendChild(overlay);

    const close = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    };

    overlay.querySelector('[data-cancel]')?.addEventListener('click', () => {
      close();
      if (on_cancel) on_cancel();
    });

    overlay.querySelector('[data-confirm]')?.addEventListener('click', () => {
      close();
      if (on_confirm) on_confirm();
    });

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  call({ method, args, freeze, freeze_message }: { method: string; args?: any; freeze?: boolean; freeze_message?: string }): Promise<any> {
    if (freeze) this.freeze(freeze_message);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (freeze) this.unfreeze();

        console.log(`[app.call] → ${method}`, args);
        if (method === 'validate_clearance_code') {
          args?.code === '1234' ? resolve({ message: 'Approved' }) : reject({ message: 'Invalid clearance code' });
        } else {
          resolve({ message: `OK: ${method}` });
        }
      }, 700);
    });
  }
}
