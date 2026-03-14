import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { DocumentDefinition, DocumentField, DocumentSection, DocumentColumn, FieldType, TableColumnDef } from '../models/document.model';

let _uid = 0;
function uid() { return `id_${++_uid}_${Math.random().toString(36).slice(2, 7)}`; }

@Injectable({ providedIn: 'root' })
export class BuilderStateService {
    // Main Document state
    readonly document: WritableSignal<DocumentDefinition> = signal({
        name: 'New Document',
        version: '1.0.0',
        sections: [],
        client_script: '',
        intro_text: '',
        intro_color: 'gray',
        actions: {
            save: { label: 'Save as Draft', visible: true, type: 'secondary' },
            submit: { label: 'Submit', visible: true, type: 'primary' },
            approve: { label: 'Approve', visible: false, type: 'primary' },
            decline: { label: 'Decline', visible: false, type: 'danger' }
        }
    });

    // Selected field or section for property editor
    readonly selectedFieldId: WritableSignal<string | null> = signal(null);
    readonly selectedSectionId: WritableSignal<string | null> = signal(null);
    readonly showFormSettings: WritableSignal<boolean> = signal(false);

    // Dynamic state (e.g. set via client script)
    readonly dynamicIntro: WritableSignal<{ message: string; color: string } | null> = signal(null);

    // Builder vs Preview mode toggle
    readonly mode: WritableSignal<'builder' | 'preview'> = signal('builder');

    // Computed: find the selected field across all sections
    readonly selectedField = computed(() => {
        const id = this.selectedFieldId();
        if (!id) return null;
        for (const section of this.document().sections) {
            for (const col of section.columns) {
                const f = col.fields.find((f: DocumentField) => f.id === id);
                if (f) return f;
            }
        }
        return null;
    });

    readonly selectedSection = computed(() => {
        const id = this.selectedSectionId();
        if (!id) return null;
        return this.document().sections.find((s: DocumentSection) => s.id === id) || null;
    });

    // ── Document metadata ──────────────────────────────────────
    setDocumentName(name: string) {
        this.document.update(doc => ({ ...doc, name }));
    }

    setDocumentMetadata(metadata: Partial<DocumentDefinition>) {
        this.document.update(doc => ({ ...doc, ...metadata }));
    }

    setClientScript(script: string) {
        this.document.update(doc => ({ ...doc, client_script: script }));
    }

    setIntro(text: string, color?: 'blue' | 'orange' | 'red' | 'gray') {
        this.document.update(doc => ({
            ...doc,
            intro_text: text,
            intro_color: color || doc.intro_color || 'gray'
        }));
    }

    setModule(module: string) {
        this.document.update(doc => ({ ...doc, module }));
    }

    updateAction(id: 'save' | 'submit' | 'approve' | 'decline', patch: any) {
        this.document.update(doc => {
            const actions = { ...(doc.actions || {}) } as any;
            actions[id] = { ...(actions[id] || {}), ...patch };
            return { ...doc, actions };
        });
    }

    importDocument(json: string) {
        try {
            const data = JSON.parse(json);
            // Basic validation
            if (data && typeof data === 'object' && Array.isArray(data.sections)) {
                this.document.set(data);
                this.selectedFieldId.set(null);
                return true;
            }
        } catch (e) {
            console.error('[import] Invalid JSON', e);
        }
        return false;
    }

    // ── Sections ──────────────────────────────────────────────
    addSection() {
        const section: DocumentSection = {
            id: uid(),
            label: `Section ${this.document().sections.length + 1}`,
            columns: [{ id: uid(), fields: [] }, { id: uid(), fields: [] }]
        };
        this.document.update(doc => ({ ...doc, sections: [...doc.sections, section] }));
    }

    removeSection(sectionId: string) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.filter((s: DocumentSection) => s.id !== sectionId)
        }));
    }

    updateSectionLabel(sectionId: string, label: string) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => s.id === sectionId ? { ...s, label } : s)
        }));
    }

    updateSectionDescription(sectionId: string, description: string) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => s.id === sectionId ? { ...s, description } : s)
        }));
    }

    updateSectionDependsOn(sectionId: string, depends_on: string) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => s.id === sectionId ? { ...s, depends_on } : s)
        }));
    }

    updateSectionProperty(sectionId: string, prop: keyof DocumentSection, val: any) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => s.id === sectionId ? { ...s, [prop]: val } : s)
        }));
    }

    updateSectionColumns(sectionId: string, columns_count: 1 | 2) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => s.id === sectionId ? { ...s, columns_count } : s)
        }));
    }

    // ── Columns ───────────────────────────────────────────────
    addColumn(sectionId: string) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => s.id === sectionId
                ? { ...s, columns: [...s.columns, { id: uid(), fields: [] }] }
                : s)
        }));
    }

    removeColumn(sectionId: string, colId: string) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => s.id === sectionId
                ? { ...s, columns: s.columns.filter((c: DocumentColumn) => c.id !== colId) }
                : s)
        }));
    }

    // ── Fields ────────────────────────────────────────────────
    addField(sectionId: string, colId: string, fieldtype: FieldType, index?: number) {
        const defaultLabels: Partial<Record<FieldType, string>> = {
            Check: 'Checkbox Field',
            Button: 'Click Me',
            'Text Editor': 'Details',
            Table: 'Items',
        };
        const label = defaultLabels[fieldtype] ?? `${fieldtype} Field`;
        const slug = label.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '_') + '_' + (_uid + 1);

        // Type-specific defaults
        const typeDefaults: Partial<DocumentField> = {};
        if (fieldtype === 'Check') typeDefaults.default = 0;
        if (fieldtype === 'Button') typeDefaults.options = 'primary';
        if (fieldtype === 'Text Editor') typeDefaults.options = '<p>Enter rich text here...</p>';
        if (fieldtype === 'Table') typeDefaults.table_fields = [];

        const field: DocumentField = {
            id: uid(),
            fieldname: slug,
            fieldtype,
            label,
            hidden: false,
            read_only: false,
            mandatory: false,
            ...typeDefaults
        };
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => s.id === sectionId
                ? {
                    ...s,
                    columns: s.columns.map((c: DocumentColumn) => {
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
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => ({
                ...s,
                columns: s.columns.map((c: DocumentColumn) => ({
                    ...c,
                    fields: c.fields.filter((f: DocumentField) => f.id !== fieldId)
                }))
            }))
        }));
    }

    updateField(fieldId: string, patch: Partial<DocumentField>) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => ({
                ...s,
                columns: s.columns.map((c: DocumentColumn) => ({
                    ...c,
                    fields: c.fields.map((f: DocumentField) => f.id === fieldId ? { ...f, ...patch } : f)
                }))
            }))
        }));
    }

    // ── Drag-Drop: move field between columns ─────────────────
    moveField(
        fromSectionId: string, fromColId: string, fromIndex: number,
        toSectionId: string, toColId: string, toIndex: number
    ) {
        let field!: DocumentField;
        this.document.update(doc => {
            // Extract
            const sections = doc.sections.map((s: DocumentSection) => ({
                ...s,
                columns: s.columns.map((c: DocumentColumn) => {
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
                ...doc,
                sections: sections.map((s: DocumentSection) => ({
                    ...s,
                    columns: s.columns.map((c: DocumentColumn) => {
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

    moveSection(fromIndex: number, toIndex: number) {
        this.document.update(doc => {
            const sections = [...doc.sections];
            const [moved] = sections.splice(fromIndex, 1);
            sections.splice(toIndex, 0, moved);
            return { ...doc, sections };
        });
    }

    // Tools
    selectFormSettings() {
        this.selectedFieldId.set(null);
        this.selectedSectionId.set(null);
        this.showFormSettings.set(true);
    }

    selectSection(id: string) {
        this.selectedFieldId.set(null);
        this.showFormSettings.set(false);
        this.selectedSectionId.set(id);
    }

    selectField(id: string) {
        this.selectedSectionId.set(null);
        this.showFormSettings.set(false);
        this.selectedFieldId.set(id);
    }

    // ── Table Field Columns ──────────────────────────────────────
    addTableColumn(fieldId: string) {
        const colId = uid();
        const col: TableColumnDef = {
            id: colId,
            fieldname: `col_${colId.slice(-5)}`,
            label: 'Column',
            fieldtype: 'Data',
        };
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => ({
                ...s,
                columns: s.columns.map((c: DocumentColumn) => ({
                    ...c,
                    fields: c.fields.map((f: DocumentField) =>
                        f.id === fieldId
                            ? { ...f, table_fields: [...(f.table_fields ?? []), col] }
                            : f
                    )
                }))
            }))
        }));
    }

    removeTableColumn(fieldId: string, colId: string) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => ({
                ...s,
                columns: s.columns.map((c: DocumentColumn) => ({
                    ...c,
                    fields: c.fields.map((f: DocumentField) =>
                        f.id === fieldId
                            ? { ...f, table_fields: (f.table_fields ?? []).filter(tc => tc.id !== colId) }
                            : f
                    )
                }))
            }))
        }));
    }

    updateTableColumn(fieldId: string, colId: string, patch: Partial<TableColumnDef>) {
        this.document.update(doc => ({
            ...doc,
            sections: doc.sections.map((s: DocumentSection) => ({
                ...s,
                columns: s.columns.map((c: DocumentColumn) => ({
                    ...c,
                    fields: c.fields.map((f: DocumentField) =>
                        f.id === fieldId
                            ? {
                                ...f,
                                table_fields: (f.table_fields ?? []).map(tc =>
                                    tc.id === colId ? { ...tc, ...patch } : tc
                                )
                            }
                            : f
                    )
                }))
            }))
        }));
    }
}
