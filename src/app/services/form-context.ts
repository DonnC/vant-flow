import { FormGroup, Validators } from '@angular/forms';
import { WritableSignal, signal, Injectable } from '@angular/core';
import { DocumentField, DocumentSection, DocumentDefinition, FormActionsConfig } from '../models/document.model';
import { AppUtilityService } from './app-utility.service';
import { BuilderStateService } from './builder-state.service';

@Injectable()
export class FormContext {
    public fieldSignals = new Map<string, WritableSignal<DocumentField>>();
    public sectionSignals = new Map<string, WritableSignal<DocumentSection>>();
    public dynamicIntro = signal<{ message: string; color: string } | null>(null);

    private eventListeners = new Map<string, Function[]>();
    private queries = new Map<string, Function>();
    private document!: DocumentDefinition;
    private formData: any;

    public isReadOnly = signal<boolean>(false);
    public customButtons = signal<{ id: string; label: string; action: Function; type?: string }[]>([]);
    public actionsConfig = signal<FormActionsConfig | undefined>(undefined);

    constructor(
        private appUtility: AppUtilityService,
        private state: BuilderStateService
    ) { }

    initialize(document: DocumentDefinition, formData: any) {
        this.document = document;
        this.formData = formData;

        // Initialize signals
        this.fieldSignals.clear();
        this.sectionSignals.clear();
        this.dynamicIntro.set(null);
        this.isReadOnly.set(false);
        this.customButtons.set([]);
        this.actionsConfig.set(document.actions);

        document.sections.forEach(section => {
            this.sectionSignals.set(section.id, signal({ ...section }));
            section.columns.forEach(col => {
                col.fields.forEach(field => {
                    this.fieldSignals.set(field.fieldname, signal({ ...field }));
                });
            });
        });
    }

    destroy() {
        this.eventListeners.clear();
        this.queries.clear();
    }

    // ── Scripting API ──────────────────────────────────────────

    set_intro(message: string, color: string = 'blue') {
        this.dynamicIntro.set({ message, color });
    }

    msgprint(message: string, indicator: any = 'info') {
        this.appUtility.show_alert(message, indicator);
    }

    confirm(message: string, on_confirm?: () => void, on_cancel?: () => void) {
        this.appUtility.confirm(message, on_confirm, on_cancel);
    }

    throw(message: string) {
        this.appUtility.show_alert(message, 'error');
        throw new Error(message);
    }

    prompt(fields: DocumentField[], callback: (values: any) => void, title?: string) {
        this.appUtility.prompt(fields, title).then((values: any) => {
            if (values) callback(values);
        });
    }

    set_df_property(fieldname: string, prop: keyof DocumentField, val: any) {
        const s = this.fieldSignals.get(fieldname);
        if (!s) { console.warn(`[frm] Unknown field: ${fieldname}`); return; }
        s.update(current => ({ ...current, [prop]: val }));
    }

    set_section_property(sectionId: string, prop: keyof DocumentSection, val: any) {
        const s = this.sectionSignals.get(sectionId);
        if (!s) {
            console.warn(`[frm] Unknown section: ${sectionId}`);
            return;
        }
        s.update(current => ({ ...current, [prop]: val }));
    }

    set_readonly(readOnly: boolean) {
        this.isReadOnly.set(readOnly);
    }

    add_custom_button(label: string, action: Function, type: string = 'secondary') {
        const id = label.toLowerCase().replace(/\s+/g, '_');
        this.customButtons.update(btns => {
            const existing = btns.findIndex(b => b.id === id);
            const newBtn = { id, label, action, type };
            if (existing > -1) {
                btns[existing] = newBtn;
                return [...btns];
            }
            return [...btns, newBtn];
        });
    }

    clear_custom_buttons() {
        this.customButtons.set([]);
    }

    call(opts: { method: string; args?: any; callback?: (r: any) => void; freeze?: boolean; freeze_message?: string }) {
        return this.appUtility.call(opts).then(r => {
            if (opts.callback) opts.callback(r);
            return r;
        });
    }

    freeze(message?: string) {
        this.appUtility.freeze(message);
    }

    unfreeze() {
        this.appUtility.unfreeze();
    }

    set_button_action(id: string, action: Function) {
        const config = this.actionsConfig();
        if (!config) return;
        const key = id.toLowerCase() as keyof FormActionsConfig;
        if (config[key]) {
            (config[key] as any).runtimeAction = action;
            this.actionsConfig.set({ ...config });
        }
    }

    set_button_label(id: string, label: string) {
        const config = this.actionsConfig();
        if (!config) return;
        const key = id.toLowerCase() as keyof FormActionsConfig;
        if (config[key]) {
            config[key]!.label = label;
            this.actionsConfig.set({ ...config });
        }
    }

    get_value(fieldname: string): any {
        return this.formData[fieldname];
    }

    set_value(fieldnameOrObj: string | Record<string, any>, value?: any) {
        if (typeof fieldnameOrObj === 'object' && fieldnameOrObj !== null) {
            Object.entries(fieldnameOrObj).forEach(([fieldname, val]) => {
                this.formData[fieldname] = val;
                this.triggerChange(fieldname, val);
            });
        } else if (typeof fieldnameOrObj === 'string') {
            this.formData[fieldnameOrObj] = value;
            this.triggerChange(fieldnameOrObj, value);
        }
    }

    // ── Internal Helpers for Renderer ──────────────────────────

    getFieldSignal(fieldname: string, prop: keyof DocumentField) {
        const s = this.fieldSignals.get(fieldname);
        return () => s ? (s() as any)[prop] : undefined;
    }

    getSectionSignal(sectionId: string, prop: keyof DocumentSection) {
        const s = this.sectionSignals.get(sectionId);
        return () => s ? (s() as any)[prop] : undefined;
    }

    on(event: string, callback: Function) {
        if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
        this.eventListeners.get(event)!.push(callback);
    }

    triggerChange(fieldname: string, value: any) {
        this.trigger(fieldname, value);
    }

    private trigger(event: string, data?: any): boolean {
        let result = true;
        (this.eventListeners.get(event) ?? []).forEach(cb => {
            try {
                const r = cb(this, data);
                if (r === false) result = false;
            } catch (e) { console.error(`[frm.trigger] Error in handler for '${event}'`, e); }
        });
        return result;
    }

    execute(script: string, event: string, value?: any): any {
        if (!script) return;
        let setupResult: any = undefined;

        const frappe = {
            ui: {
                form: {
                    on: (ev: string, handler: Function) => {
                        if (ev === event) {
                            setupResult = handler(this, value);
                        }
                    }
                }
            },
            msgprint: (msg: string, ind: any) => this.appUtility.show_alert(msg, ind),
            confirm: (msg: string, ok?: any, cancel?: any) => this.appUtility.confirm(msg, ok, cancel),
            prompt: (fields: any, cb: any, title?: string) => this.appUtility.prompt(fields, title).then(v => { if (v) cb(v); }),
            throw: (msg: string) => {
                this.appUtility.show_alert(msg, 'error');
                throw new Error(msg);
            },
            call: (opts: any) => this.appUtility.call(opts),
            freeze: (msg?: string) => this.appUtility.freeze(msg),
            unfreeze: () => this.appUtility.unfreeze(),
            show_alert: (msg: string, ind: any) => this.appUtility.show_alert(msg, ind)
        };

        try {
            const fn = new Function('frm', 'frappe', script);
            fn(this, frappe);

            // Trigger internal listeners and return combined result
            const triggerResult = this.trigger(event, value);

            // If frappe.ui.form.on was used and returned false, or trigger returned false
            if (setupResult === false || triggerResult === false) return false;
        } catch (e) {
            console.error(`[FormContext] Error in client script (${event}):`, e);
            if (e instanceof Error && e.message === 'Script Execution Stopped') return false; // Handle frm.throw
        }

        return setupResult;
    }
}
