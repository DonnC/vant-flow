import { FormGroup, Validators } from '@angular/forms';
import { WritableSignal, signal, Injectable } from '@angular/core';
import { DocumentField, DocumentSection, DocumentDefinition, FormActionsConfig } from '../models/document.model';
import { VfUtilityService } from './app-utility.service';
import { VfBuilderState } from './builder-state.service';

@Injectable()
export class VfFormContext {
    public fieldSignals = new Map<string, WritableSignal<DocumentField>>();
    public sectionSignals = new Map<string, WritableSignal<DocumentSection>>();
    public dynamicIntro = signal<{ message: string; color: string } | null>(null);
    public valueUpdateSignal = signal(0);

    private eventListeners = new Map<string, Function[]>();
    private queries = new Map<string, Function>();
    private document!: DocumentDefinition;
    private formData: any;

    public isReadOnly = signal<boolean>(false);
    public customButtons = signal<{ id: string; label: string; action: Function; type?: string; disable_on_readonly?: boolean }[]>([]);
    public actionsConfig = signal<FormActionsConfig | undefined>(undefined);

    // Stepper state
    public currentStepIndex = signal<number>(0);
    public stepSignals = new Map<string, WritableSignal<{ id: string; title: string; description?: string; hidden: boolean }>>();

    public metadata?: any;

    constructor(
        private appUtility: VfUtilityService,
        private state: VfBuilderState
    ) { }

    initialize(document: DocumentDefinition, formData: any, metadata?: any) {
        this.document = document;
        this.formData = formData;
        this.metadata = metadata;

        // Initialize signals
        this.fieldSignals.clear();
        this.sectionSignals.clear();
        this.stepSignals.clear();
        this.dynamicIntro.set(null);
        this.isReadOnly.set(false);
        this.customButtons.set([]);
        this.actionsConfig.set(document.actions);
        this.currentStepIndex.set(0);

        // Process flat sections
        this.document.sections?.forEach(section => {
            this.initSection(section);
        });

        // Process steps
        this.document.steps?.forEach(step => {
            this.stepSignals.set(step.id, signal({
                id: step.id,
                title: step.title,
                description: step.description,
                hidden: false
            }));
            step.sections.forEach(section => {
                this.initSection(section);
            });
        });
    }

    private initSection(section: DocumentSection) {
        this.sectionSignals.set(section.id, signal({ ...section }));
        section.columns.forEach(col => {
            col.fields.forEach(field => {
                this.fieldSignals.set(field.fieldname, signal({ ...field }));
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

    prompt(fields: DocumentField[], callback: (values: any) => void, title?: string, read_only: boolean = false) {
        this.appUtility.prompt(fields, title, read_only).then((values: any) => {
            if (values) callback(values);
        });
    }

    set_df_property(fieldname: string, prop: keyof DocumentField, val: any, child_fieldname?: string) {
        const s = this.fieldSignals.get(fieldname);
        if (!s) { console.warn(`[frm] Unknown field: ${fieldname}`); return; }

        if (child_fieldname) {
            // Target a column within a table
            s.update(current => {
                if (current.fieldtype !== 'Table' || !current.table_fields) return current;
                const updatedCols = current.table_fields.map(col => {
                    if (col.fieldname === child_fieldname) {
                        return { ...col, [prop]: val };
                    }
                    return col;
                });
                return { ...current, table_fields: updatedCols };
            });
        } else {
            // Target the field itself
            s.update(current => ({ ...current, [prop]: val }));
        }
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

    // ── Stepper methods ──────────────────────────────────────────

    next_step() {
        const doc = this.document;
        if (!doc.is_stepper || !doc.steps) return;

        const currentIndex = this.currentStepIndex();
        if (currentIndex < doc.steps.length - 1) {
            // Trigger before change hook - can stop if returns false
            if (this.trigger('before_step_change', { from: currentIndex, to: currentIndex + 1 }) === false) {
                return;
            }

            // Find next visible step
            let nextIndex = currentIndex + 1;
            while (nextIndex < doc.steps.length) {
                const stepId = doc.steps[nextIndex].id;
                const isHidden = this.getStepSignal(stepId, 'hidden')();
                if (!isHidden) break;
                nextIndex++;
            }

            if (nextIndex < doc.steps.length) {
                this.currentStepIndex.set(nextIndex);
                this.trigger('after_step_change', { from: currentIndex, to: nextIndex });
                this.appUtility.scrollToTop();
            }
        }
    }

    prev_step() {
        const doc = this.document;
        if (!doc.is_stepper || !doc.steps) return;

        const currentIndex = this.currentStepIndex();
        if (currentIndex > 0) {
            // Find prev visible step
            let prevIndex = currentIndex - 1;
            while (prevIndex >= 0) {
                const stepId = doc.steps[prevIndex].id;
                const isHidden = this.getStepSignal(stepId, 'hidden')();
                if (!isHidden) break;
                prevIndex--;
            }

            if (prevIndex >= 0) {
                this.currentStepIndex.set(prevIndex);
                this.trigger('after_step_change', { from: currentIndex, to: prevIndex });
                this.appUtility.scrollToTop();
            }
        }
    }

    go_to_step(indexOrId: number | string) {
        const doc = this.document;
        if (!doc.is_stepper || !doc.steps) return;

        const currentIndex = this.currentStepIndex();
        let targetIndex = -1;

        if (typeof indexOrId === 'number') {
            targetIndex = indexOrId;
        } else {
            targetIndex = doc.steps.findIndex(s => s.id === indexOrId);
        }

        if (targetIndex >= 0 && targetIndex < doc.steps.length && targetIndex !== currentIndex) {
            const stepId = doc.steps[targetIndex].id;
            if (this.getStepSignal(stepId, 'hidden')()) {
                console.warn(`[frm] cannot jump to hidden step: ${indexOrId}`);
                return;
            }

            if (this.trigger('before_step_change', { from: currentIndex, to: targetIndex }) === false) {
                return;
            }

            this.currentStepIndex.set(targetIndex);
            this.trigger('after_step_change', { from: currentIndex, to: targetIndex });
            this.appUtility.scrollToTop();
        }
    }

    set_step_hidden(stepId: string, hidden: boolean) {
        const s = this.stepSignals.get(stepId);
        if (!s) { console.warn(`[frm] Unknown step: ${stepId}`); return; }
        s.update(current => ({ ...current, hidden }));
    }

    getStepSignal(stepId: string, prop: 'hidden' | 'title' | 'description') {
        const s = this.stepSignals.get(stepId);
        return () => s ? (s() as any)[prop] : undefined;
    }

    add_custom_button(label: string, action: Function, type: string = 'secondary', disable_on_readonly: boolean = true) {
        const id = label.toLowerCase().replace(/\s+/g, '_');
        this.customButtons.update(btns => {
            const existing = btns.findIndex(b => b.id === id);
            const newBtn = { id, label, action, type, disable_on_readonly };
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

    reset() {
        // Reset data to defaults
        this.document.sections.forEach(s => {
            s.columns.forEach(c => {
                c.fields.forEach(f => {
                    if (f.fieldtype === 'Table') {
                        this.formData[f.fieldname] = f.default || [];
                    } else if (f.fieldtype === 'Check') {
                        this.formData[f.fieldname] = f.default ? 1 : 0;
                    } else {
                        this.formData[f.fieldname] = f.default !== undefined ? f.default : '';
                    }

                    if (f.fieldtype !== 'Button') {
                        this.trigger(f.fieldname, this.formData[f.fieldname]);
                    }
                });
            });
        });

        this.dynamicIntro.set(null);
        this.customButtons.set([]);
        this.isReadOnly.set(false);
        this.valueUpdateSignal.update(n => n + 1);
        this.trigger('refresh');
    }

    add_row(fieldname: string, row: any = {}) {
        if (!this.formData[fieldname]) this.formData[fieldname] = [];
        const table = this.formData[fieldname];
        row.idx = table.length;
        table.push(row);
        const index = table.length - 1;
        this.trigger(`${fieldname}_add`, { row, index });
        this.trigger(fieldname, this.formData[fieldname]);
        this.valueUpdateSignal.update(n => n + 1);
    }

    remove_row(fieldname: string, index: number) {
        if (!this.formData[fieldname]) return;
        const row = this.formData[fieldname][index];
        this.formData[fieldname].splice(index, 1);
        this.trigger(`${fieldname}_remove`, { row, index });
        this.trigger(fieldname, this.formData[fieldname]);
        this.valueUpdateSignal.update(n => n + 1);
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
        this.valueUpdateSignal.update(n => n + 1);
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
        this.valueUpdateSignal.update(n => n + 1);
    }

    public trigger(event: string, data?: any): boolean {
        let result = true;
        (this.eventListeners.get(event) ?? []).forEach(cb => {
            try {
                const r = cb(data, this);
                if (r === false) result = false;
            } catch (e) { console.error(`[frm.trigger] Error in handler for '${event}'`, e); }
        });
        return result;
    }

    execute(script: string, event: string, value?: any): any {
        if (!script) return;
        let setupResult: any = undefined;

        try {
            const fn = new Function('frm', script);
            fn(this);

            // Important: We DON'T trigger(event, value) here anymore if we want to run script once 
            // and trigger events separately. 
            // BUT, if we are running the script for the FIRST time (refresh), we want setupResult.
            // When trigger() is called from outside, it will hit the listeners registered above.

            if (setupResult === false) return false;
        } catch (e) {
            console.error(`[FormContext] Error in client script (${event}):`, e);
            if (e instanceof Error && e.message === 'Script Execution Stopped') return false;
        }

        return setupResult;
    }
}
