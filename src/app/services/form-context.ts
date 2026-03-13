import { FormGroup, Validators } from '@angular/forms';
import { WritableSignal, signal } from '@angular/core';
import { DocField } from '../models/doctype.model';

export class FormContext {
    public fieldSignals = new Map<string, WritableSignal<DocField>>();
    private eventListeners = new Map<string, Function[]>();
    private queries = new Map<string, Function>();

    constructor(
        public fields: DocField[],
        public formGroup: FormGroup,
        private appUtility: any, // AppUtilityService
        private state: any       // BuilderStateService
    ) {
        fields.forEach(field => {
            this.fieldSignals.set(field.fieldname, signal({ ...field }));
        });
    }

    set_intro(message: string, color: string = 'blue') {
        this.state.setDynamicIntro(message, color);
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

    prompt(fields: DocField[], callback: (values: any) => void, title?: string) {
        this.appUtility.prompt(fields, title).then((values: any) => {
            if (values) callback(values);
        });
    }

    set_df_property(fieldname: string, prop: keyof DocField, val: any) {
        const s = this.fieldSignals.get(fieldname);
        if (!s) { console.warn(`[frm] Unknown field: ${fieldname}`); return; }
        s.update(current => ({ ...current, [prop]: val }));

        if (prop === 'read_only') {
            val
                ? this.formGroup.get(fieldname)?.disable({ emitEvent: false })
                : this.formGroup.get(fieldname)?.enable({ emitEvent: false });
        }

        if (prop === 'mandatory') {
            const ctrl = this.formGroup.get(fieldname);
            if (ctrl) {
                if (val) {
                    ctrl.setValidators([Validators.required]);
                } else {
                    ctrl.clearValidators();
                }
                ctrl.updateValueAndValidity({ emitEvent: false });
            }
        }
    }

    get_value(fieldname: string): any {
        return this.formGroup.get(fieldname)?.value ?? this.formGroup.getRawValue()[fieldname];
    }

    set_value(fieldname: string, val: any) {
        const ctrl = this.formGroup.get(fieldname);
        if (ctrl) ctrl.setValue(val, { emitEvent: true });
    }

    on(event: string, callback: Function) {
        if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
        this.eventListeners.get(event)!.push(callback);
    }

    trigger(event: string, data?: any) {
        (this.eventListeners.get(event) ?? []).forEach(cb => {
            try { cb(data); } catch (e) { console.error(`[frm.trigger] Error in handler for '${event}'`, e); }
        });
    }

    set_query(fieldname: string, fn: Function) { this.queries.set(fieldname, fn); }
    get_query(fieldname: string): Function | undefined { return this.queries.get(fieldname); }
}
