import { Injectable, signal, inject } from '@angular/core';
import { DocField } from '../models/doctype.model';

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

    show_alert(msg: string, indicator: ToastIndicator = 'info') {
        const id = ++_toastId;
        this.toasts.update(t => [...t, { id, message: msg, indicator }]);
        setTimeout(() => this.dismiss(id), 3500);
    }

    dismiss(id: number) {
        this.toasts.update(t => t.filter(x => x.id !== id));
    }

    /**
     * Show a custom dialog built from DocFields.
     * Injects a dialog element directly into the DOM to avoid Material dependency.
     */
    prompt(fields: DocField[], title: string = 'Enter Data'): Promise<Record<string, any> | null> {
        return new Promise(resolve => {
            // Create modal container
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';

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
                document.body.removeChild(overlay);
                resolve(result);
            };

            overlay.querySelector('[data-close]')?.addEventListener('click', () => close(null));
            overlay.querySelector('[data-cancel]')?.addEventListener('click', () => close(null));
            overlay.querySelector('[data-submit]')?.addEventListener('click', () => {
                const result: Record<string, any> = {};
                fields.forEach(f => {
                    const el = overlay.querySelector(`[data-field="${f.fieldname}"]`) as HTMLInputElement;
                    result[f.fieldname] = el?.value ?? '';
                });
                close(result);
            });

            // Click outside to dismiss
            overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
        });
    }

    call({ method, args }: { method: string; args?: any }): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
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
