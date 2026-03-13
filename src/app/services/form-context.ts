import { FormGroup } from '@angular/forms';
import { WritableSignal, signal } from '@angular/core';
import { DocField } from '../models/doctype.model';

export class FormContext {
    public fieldSignals = new Map<string, WritableSignal<DocField>>();
    private eventListeners = new Map<string, Function[]>();
    private queries = new Map<string, Function>();

    constructor(public fields: DocField[], public formGroup: FormGroup) {
        fields.forEach(field => {
            this.fieldSignals.set(field.fieldname, signal({ ...field }));
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
