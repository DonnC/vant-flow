import { FormGroup, Validators } from '@angular/forms';
import { WritableSignal, signal, Injectable } from '@angular/core';
import { DocumentField, DocumentSection, DocumentDefinition } from '../models/document.model';
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

    get_value(fieldname: string): any {
        return this.formData[fieldname];
    }

    set_value(fieldname: string, val: any) {
        this.formData[fieldname] = val;
        this.triggerChange(fieldname, val);
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

    private trigger(event: string, data?: any) {
        (this.eventListeners.get(event) ?? []).forEach(cb => {
            try { cb(data); } catch (e) { console.error(`[frm.trigger] Error in handler for '${event}'`, e); }
        });
    }

    execute(script: string, event: string, value?: any) {
        try {
            // Create the 'frm' and 'app' scope
            const frm = this;
            const app = {
                show_alert: (msg: string, ind: any) => this.appUtility.show_alert(msg, ind),
                prompt: (fields: DocumentField[], title?: string) => this.appUtility.prompt(fields, title)
            };

            // Wrap script in a function to isolate scope
            const runner = new Function('frm', 'app', script);
            runner(frm, app);

            // If it's a specific event, trigger it
            this.trigger(event, value);
        } catch (e) {
            console.error('[Script Execution Error]', e);
        }
    }
}
