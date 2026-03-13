import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { DocType, DocField, LayoutSection, LayoutColumn, FieldType } from '../models/doctype.model';

let _uid = 0;
function uid() { return `id_${++_uid}_${Math.random().toString(36).slice(2, 7)}`; }

@Injectable({ providedIn: 'root' })
export class BuilderStateService {
    // Main DocType state
    readonly docType: WritableSignal<DocType> = signal({
        name: 'New DocType',
        sections: [],
        client_script: ''
    });

    // Selected field for property editor
    readonly selectedFieldId: WritableSignal<string | null> = signal(null);

    // Builder vs Preview mode toggle
    readonly mode: WritableSignal<'builder' | 'preview'> = signal('builder');

    // Computed: find the selected field across all sections
    readonly selectedField = computed(() => {
        const id = this.selectedFieldId();
        if (!id) return null;
        for (const section of this.docType().sections) {
            for (const col of section.columns) {
                const f = col.fields.find(f => f.id === id);
                if (f) return f;
            }
        }
        return null;
    });

    // ── DocType metadata ──────────────────────────────────────
    setDocTypeName(name: string) {
        this.docType.update(dt => ({ ...dt, name }));
    }

    setClientScript(script: string) {
        this.docType.update(dt => ({ ...dt, client_script: script }));
    }

    // ── Sections ──────────────────────────────────────────────
    addSection() {
        const section: LayoutSection = {
            id: uid(),
            label: `Section ${this.docType().sections.length + 1}`,
            columns: [{ id: uid(), fields: [] }, { id: uid(), fields: [] }]
        };
        this.docType.update(dt => ({ ...dt, sections: [...dt.sections, section] }));
    }

    removeSection(sectionId: string) {
        this.docType.update(dt => ({
            ...dt,
            sections: dt.sections.filter(s => s.id !== sectionId)
        }));
    }

    updateSectionLabel(sectionId: string, label: string) {
        this.docType.update(dt => ({
            ...dt,
            sections: dt.sections.map(s => s.id === sectionId ? { ...s, label } : s)
        }));
    }

    // ── Columns ───────────────────────────────────────────────
    addColumn(sectionId: string) {
        this.docType.update(dt => ({
            ...dt,
            sections: dt.sections.map(s => s.id === sectionId
                ? { ...s, columns: [...s.columns, { id: uid(), fields: [] }] }
                : s)
        }));
    }

    removeColumn(sectionId: string, colId: string) {
        this.docType.update(dt => ({
            ...dt,
            sections: dt.sections.map(s => s.id === sectionId
                ? { ...s, columns: s.columns.filter(c => c.id !== colId) }
                : s)
        }));
    }

    // ── Fields ────────────────────────────────────────────────
    addField(sectionId: string, colId: string, fieldtype: FieldType, index?: number) {
        const slug = fieldtype.toLowerCase().replace(/\s+/g, '_') + '_' + (_uid + 1);
        const field: DocField = {
            id: uid(),
            fieldname: slug,
            fieldtype,
            label: fieldtype === 'Check' ? 'Checkbox Field' : `${fieldtype} Field`,
            hidden: false,
            read_only: false,
            mandatory: false,
            default: fieldtype === 'Check' ? 0 : undefined
        };
        this.docType.update(dt => ({
            ...dt,
            sections: dt.sections.map(s => s.id === sectionId
                ? {
                    ...s,
                    columns: s.columns.map(c => {
                        if (c.id !== colId) return c;
                        const fields = [...c.fields];
                        if (index !== undefined) fields.splice(index, 0, field);
                        else fields.push(field);
                        return { ...c, fields };
                    })
                }
                : s)
        }));
        this.selectedFieldId.set(field.id);
        return field;
    }

    removeField(fieldId: string) {
        if (this.selectedFieldId() === fieldId) this.selectedFieldId.set(null);
        this.docType.update(dt => ({
            ...dt,
            sections: dt.sections.map(s => ({
                ...s,
                columns: s.columns.map(c => ({
                    ...c,
                    fields: c.fields.filter(f => f.id !== fieldId)
                }))
            }))
        }));
    }

    updateField(fieldId: string, patch: Partial<DocField>) {
        this.docType.update(dt => ({
            ...dt,
            sections: dt.sections.map(s => ({
                ...s,
                columns: s.columns.map(c => ({
                    ...c,
                    fields: c.fields.map(f => f.id === fieldId ? { ...f, ...patch } : f)
                }))
            }))
        }));
    }

    // ── Drag-Drop: move field between columns ─────────────────
    moveField(
        fromSectionId: string, fromColId: string, fromIndex: number,
        toSectionId: string, toColId: string, toIndex: number
    ) {
        let field!: DocField;
        this.docType.update(dt => {
            // Extract
            const sections = dt.sections.map(s => ({
                ...s,
                columns: s.columns.map(c => {
                    if (s.id === fromSectionId && c.id === fromColId) {
                        const fields = [...c.fields];
                        [field] = fields.splice(fromIndex, 1);
                        return { ...c, fields };
                    }
                    return c;
                })
            }));
            // Insert
            return {
                ...dt,
                sections: sections.map(s => ({
                    ...s,
                    columns: s.columns.map(c => {
                        if (s.id === toSectionId && c.id === toColId) {
                            const fields = [...c.fields];
                            fields.splice(toIndex, 0, field);
                            return { ...c, fields };
                        }
                        return c;
                    })
                }))
            };
        });
    }

    selectField(fieldId: string | null) {
        this.selectedFieldId.set(fieldId);
    }

    toggleMode() {
        this.mode.update(m => m === 'builder' ? 'preview' : 'builder');
    }
}
