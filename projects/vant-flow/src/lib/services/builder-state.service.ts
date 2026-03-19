import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { DEFAULT_FORM_ACTIONS, DocumentDefinition, DocumentField, DocumentSection, DocumentColumn, FieldType, TableColumnDef } from '../models/document.model';

let _uid = 0;
function uid() { return `id_${++_uid}_${Math.random().toString(36).slice(2, 7)}`; }

@Injectable({ providedIn: 'root' })
export class VfBuilderState {
    // Main Document state
    readonly document: WritableSignal<DocumentDefinition> = signal({
        name: 'New Document',
        version: '1.0.0',
        sections: [],
        client_script: '',
        intro_text: '',
        intro_color: 'gray',
        actions: { submit: { ...DEFAULT_FORM_ACTIONS.submit! } }
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

        const doc = this.document();
        const sections = doc.is_stepper ? (doc.steps?.flatMap(s => s.sections) || []) : doc.sections;

        for (const section of sections) {
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
        const doc = this.document();
        const sections = doc.is_stepper ? (doc.steps?.flatMap(s => s.sections) || []) : doc.sections;
        return sections.find((s: DocumentSection) => s.id === id) || null;
    });

    readonly selectedStepId: WritableSignal<string | null> = signal(null);
    readonly selectedStep = computed(() => {
        const id = this.selectedStepId();
        if (!id) return null;
        return this.document().steps?.find(s => s.id === id) || null;
    });

    readonly dataGroupSuggestions = computed(() => {
        const groups = new Set<string>();
        const doc = this.document();
        const sections = doc.is_stepper ? (doc.steps?.flatMap(s => s.sections) || []) : doc.sections;

        sections.forEach(s => {
            s.columns.forEach(c => {
                c.fields.forEach(f => {
                    if (f.data_group) groups.add(f.data_group);
                });
            });
        });
        return Array.from(groups).sort();
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

    updateAction(id: string, patch: any) {
        this.document.update(doc => {
            const actions = { ...(doc.actions || {}) } as any;
            actions[id] = { ...(actions[id] || {}), ...patch };
            return { ...doc, actions };
        });
    }

    importDocument(json: string) {
        try {
            const data = JSON.parse(json);
            // Basic validation: must have sections (flat) OR steps (stepper)
            if (data && typeof data === 'object' && (Array.isArray(data.sections) || Array.isArray(data.steps))) {
                // Ensure actions exist
                if (!data.actions) {
                    data.actions = { submit: { ...DEFAULT_FORM_ACTIONS.submit! } };
                }
                this.document.set(data);
                this.selectedFieldId.set(null);
                this.selectedSectionId.set(null);
                this.selectedStepId.set(null);
                return true;
            }
        } catch (e) {
            console.error('[import] Invalid JSON', e);
        }
        return false;
    }

    // ── Steps ────────────────────────────────────────────────
    addStep() {
        // Ensure actions exist in document before adding step
        if (!this.document().actions) {
            this.document.update(doc => ({
                ...doc,
                actions: { submit: { ...DEFAULT_FORM_ACTIONS.submit! } }
            }));
        }

        const step = {
            id: uid(),
            title: `Step ${(this.document().steps?.length || 0) + 1}`,
            sections: []
        };
        this.document.update(doc => ({
            ...doc,
            steps: [...(doc.steps || []), step]
        }));
        this.selectStep(step.id);
    }

    removeStep(stepId: string) {
        if (this.selectedStepId() === stepId) this.selectedStepId.set(null);
        this.document.update(doc => ({
            ...doc,
            steps: doc.steps?.filter(s => s.id !== stepId)
        }));
    }

    updateStep(stepId: string, patch: any) {
        this.document.update(doc => ({
            ...doc,
            steps: doc.steps?.map(s => s.id === stepId ? { ...s, ...patch } : s)
        }));
    }

    // ── Sections ──────────────────────────────────────────────
    addSection(stepId?: string) {
        const section: DocumentSection = {
            id: uid(),
            label: `Section`,
            columns: [{ id: uid(), fields: [] }, { id: uid(), fields: [] }]
        };

        this.document.update(doc => {
            if (doc.is_stepper && stepId) {
                return {
                    ...doc,
                    steps: doc.steps?.map(s => s.id === stepId ? { ...s, sections: [...s.sections, section] } : s)
                };
            }
            return { ...doc, sections: [...doc.sections, section] };
        });
        this.selectSection(section.id);
    }

    removeSection(sectionId: string) {
        if (this.selectedSectionId() === sectionId) this.selectedSectionId.set(null);
        this.document.update(doc => {
            if (doc.is_stepper && doc.steps) {
                return {
                    ...doc,
                    steps: doc.steps.map(s => ({
                        ...s,
                        sections: s.sections.filter(sec => sec.id !== sectionId)
                    }))
                };
            }
            return {
                ...doc,
                sections: doc.sections.filter((s: DocumentSection) => s.id !== sectionId)
            };
        });
    }

    updateSectionLabel(sectionId: string, label: string) {
        this.updateSectionProperty(sectionId, 'label', label);
    }

    updateSectionDescription(sectionId: string, description: string) {
        this.updateSectionProperty(sectionId, 'description', description);
    }

    updateSectionDependsOn(sectionId: string, depends_on: string) {
        this.updateSectionProperty(sectionId, 'depends_on', depends_on);
    }

    updateSectionProperty(sectionId: string, prop: keyof DocumentSection, val: any) {
        this.document.update(doc => {
            if (doc.is_stepper && doc.steps) {
                return {
                    ...doc,
                    steps: doc.steps.map(s => ({
                        ...s,
                        sections: s.sections.map(sec => sec.id === sectionId ? { ...sec, [prop]: val } : sec)
                    }))
                };
            }
            return {
                ...doc,
                sections: doc.sections.map((s: DocumentSection) => s.id === sectionId ? { ...s, [prop]: val } : s)
            };
        });
    }

    updateSectionColumns(sectionId: string, columns_count: 1 | 2) {
        this.updateSectionProperty(sectionId, 'columns_count', columns_count);
    }

    // ── Columns ───────────────────────────────────────────────
    addColumn(sectionId: string) {
        const column = { id: uid(), fields: [] };
        this.document.update(doc => {
            const updateSections = (sects: DocumentSection[]) => sects.map(s => s.id === sectionId ? { ...s, columns: [...s.columns, column] } : s);
            if (doc.is_stepper && doc.steps) {
                return { ...doc, steps: doc.steps.map(st => ({ ...st, sections: updateSections(st.sections) })) };
            }
            return { ...doc, sections: updateSections(doc.sections) };
        });
    }

    removeColumn(sectionId: string, colId: string) {
        this.document.update(doc => {
            const updateSections = (sects: DocumentSection[]) => sects.map(s => s.id === sectionId ? { ...s, columns: s.columns.filter(c => c.id !== colId) } : s);
            if (doc.is_stepper && doc.steps) {
                return { ...doc, steps: doc.steps.map(st => ({ ...st, sections: updateSections(st.sections) })) };
            }
            return { ...doc, sections: updateSections(doc.sections) };
        });
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
        const slug = label.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '_') + '_' + (Math.random().toString(36).substr(2, 9));

        const field: DocumentField = {
            id: uid(),
            fieldname: slug,
            fieldtype,
            label,
            hidden: false,
            read_only: false,
            mandatory: false
        };

        this.document.update(doc => {
            const updateSections = (sects: DocumentSection[]) => sects.map(s => {
                if (s.id !== sectionId) return s;
                return {
                    ...s,
                    columns: s.columns.map(c => {
                        if (c.id !== colId) return c;
                        const fields = [...c.fields];
                        if (index !== undefined) fields.splice(index, 0, field);
                        else fields.push(field);
                        return { ...c, fields };
                    })
                };
            });

            if (doc.is_stepper && doc.steps) {
                return { ...doc, steps: doc.steps.map(st => ({ ...st, sections: updateSections(st.sections) })) };
            }
            return { ...doc, sections: updateSections(doc.sections) };
        });
        this.selectField(field.id);
        return field;
    }

    removeField(fieldId: string) {
        if (this.selectedFieldId() === fieldId) this.selectedFieldId.set(null);
        this.document.update(doc => {
            const updateSections = (sects: DocumentSection[]) => sects.map(s => ({
                ...s,
                columns: s.columns.map(c => ({
                    ...c,
                    fields: c.fields.filter(f => f.id !== fieldId)
                }))
            }));

            if (doc.is_stepper && doc.steps) {
                return { ...doc, steps: doc.steps.map(st => ({ ...st, sections: updateSections(st.sections) })) };
            }
            return { ...doc, sections: updateSections(doc.sections) };
        });
    }

    updateField(fieldId: string, patch: Partial<DocumentField>) {
        this.document.update(doc => {
            const updateSections = (sects: DocumentSection[]) => sects.map(s => ({
                ...s,
                columns: s.columns.map(c => ({
                    ...c,
                    fields: c.fields.map(f => f.id === fieldId ? { ...f, ...patch } : f)
                }))
            }));

            if (doc.is_stepper && doc.steps) {
                return { ...doc, steps: doc.steps.map(st => ({ ...st, sections: updateSections(st.sections) })) };
            }
            return { ...doc, sections: updateSections(doc.sections) };
        });
    }


    // ── Drag-Drop: move field between columns ─────────────────
    moveField(
        fromSectionId: string, fromColId: string, fromIndex: number,
        toSectionId: string, toColId: string, toIndex: number
    ) {
        let field!: DocumentField;
        this.document.update(doc => {
            const updateSects = (sects: DocumentSection[]) => sects.map((s: DocumentSection) => ({
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

            let nextDoc = { ...doc };
            if (doc.is_stepper && doc.steps) {
                nextDoc.steps = doc.steps.map(st => ({ ...st, sections: updateSects(st.sections) }));
            } else {
                nextDoc.sections = updateSects(doc.sections);
            }

            if (!field) return doc;

            const injectSects = (sects: DocumentSection[]) => sects.map((s: DocumentSection) => ({
                ...s,
                columns: s.columns.map((c: DocumentColumn) => {
                    if (s.id === toSectionId && c.id === toColId) {
                        const fields = [...c.fields];
                        fields.splice(toIndex, 0, field);
                        return { ...c, fields };
                    }
                    return c;
                })
            }));

            if (nextDoc.is_stepper && nextDoc.steps) {
                nextDoc.steps = nextDoc.steps.map(st => ({ ...st, sections: injectSects(st.sections) }));
            } else {
                nextDoc.sections = injectSects(nextDoc.sections);
            }

            return nextDoc;
        });
    }

    moveSection(fromIndex: number, toIndex: number, stepId?: string) {
        this.document.update(doc => {
            if (doc.is_stepper && stepId && doc.steps) {
                return {
                    ...doc,
                    steps: doc.steps.map(s => {
                        if (s.id !== stepId) return s;
                        const sections = [...s.sections];
                        const [moved] = sections.splice(fromIndex, 1);
                        sections.splice(toIndex, 0, moved);
                        return { ...s, sections };
                    })
                };
            }
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
        this.selectedStepId.set(null);
        this.showFormSettings.set(true);
    }

    selectSection(id: string) {
        this.selectedFieldId.set(null);
        this.showFormSettings.set(false);
        this.selectedSectionId.set(id);

        // Auto-select parent step in stepper mode
        const doc = this.document();
        if (doc.is_stepper && doc.steps) {
            const parentStep = doc.steps.find(s => s.sections.some(sec => sec.id === id));
            if (parentStep) this.selectedStepId.set(parentStep.id);
        }
    }

    selectField(id: string) {
        this.selectedSectionId.set(null);
        this.showFormSettings.set(false);
        this.selectedFieldId.set(id);

        // Auto-select parent step in stepper mode
        const doc = this.document();
        if (doc.is_stepper && doc.steps) {
            const parentStep = doc.steps.find(s =>
                s.sections.some(sec =>
                    sec.columns.some(col =>
                        col.fields.some(f => f.id === id)
                    )
                )
            );
            if (parentStep) this.selectedStepId.set(parentStep.id);
        }
    }

    selectStep(id: string) {
        this.selectedSectionId.set(null);
        this.selectedFieldId.set(null);
        this.showFormSettings.set(false);
        this.selectedStepId.set(id);
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
        this.document.update(doc => {
            const updateSections = (sects: DocumentSection[]) => sects.map(s => ({
                ...s,
                columns: s.columns.map(c => ({
                    ...c,
                    fields: c.fields.map(f => f.id === fieldId ? { ...f, table_fields: [...(f.table_fields ?? []), col] } : f)
                }))
            }));
            if (doc.is_stepper && doc.steps) {
                return { ...doc, steps: doc.steps.map(st => ({ ...st, sections: updateSections(st.sections) })) };
            }
            return { ...doc, sections: updateSections(doc.sections) };
        });
    }

    removeTableColumn(fieldId: string, colId: string) {
        this.document.update(doc => {
            const updateSections = (sects: DocumentSection[]) => sects.map(s => ({
                ...s,
                columns: s.columns.map(c => ({
                    ...c,
                    fields: c.fields.map(f => f.id === fieldId ? { ...f, table_fields: (f.table_fields ?? []).filter(tc => tc.id !== colId) } : f)
                }))
            }));
            if (doc.is_stepper && doc.steps) {
                return { ...doc, steps: doc.steps.map(st => ({ ...st, sections: updateSections(st.sections) })) };
            }
            return { ...doc, sections: updateSections(doc.sections) };
        });
    }

    updateTableColumn(fieldId: string, colId: string, patch: Partial<TableColumnDef>) {
        this.document.update(doc => {
            const updateSections = (sects: DocumentSection[]) => sects.map(s => ({
                ...s,
                columns: s.columns.map(c => ({
                    ...c,
                    fields: c.fields.map(f => f.id === fieldId ? { ...f, table_fields: (f.table_fields ?? []).map(tc => tc.id === colId ? { ...tc, ...patch } : tc) } : f)
                }))
            }));
            if (doc.is_stepper && doc.steps) {
                return { ...doc, steps: doc.steps.map(st => ({ ...st, sections: updateSections(st.sections) })) };
            }
            return { ...doc, sections: updateSections(doc.sections) };
        });
    }
}
