import {
    DocumentDefinition,
    DocumentSection,
    DocumentField,
    FieldType,
    DocumentStep,
    TableColumnDef,
    DocumentColumn
} from "@vant-flow/models";

export interface FormBlueprint {
    title: string;
    is_stepper?: boolean;
    module?: string;
    version?: string;
    description?: string;
    intro_text?: string;
    intro_color?: 'blue' | 'orange' | 'red' | 'gray';
    steps?: {
        title: string;
        description?: string;
        sections: SectionBlueprint[];
    }[];
    sections?: SectionBlueprint[];
    client_script?: string;
    actions?: {
        save_label?: string;
        submit_label?: string;
    };
}

export interface SectionBlueprint {
    label: string;
    columns_count?: number;
    collapsible?: boolean;
    collapsed?: boolean;
    depends_on?: string;
    fields: FieldBlueprint[];
}

export interface FieldBlueprint {
    label: string;
    fieldtype: FieldType;
    fieldname?: string;
    mandatory?: boolean;
    read_only?: boolean;
    hidden?: boolean;
    placeholder?: string;
    description?: string;
    options?: string;
    regex?: string;
    default?: any;
    data_group?: string;
    depends_on?: string;
    table_fields?: {
        label: string;
        fieldtype: Exclude<FieldType, 'Table'>;
        fieldname?: string;
        mandatory?: boolean;
        options?: string;
        default?: any;
        regex?: string;
    }[];
}

export class VantSchemaBuilder {
    buildFromBlueprint(blueprint: FormBlueprint): DocumentDefinition {
        const schema: DocumentDefinition = {
            name: this.slugify(blueprint.title),
            module: blueprint.module || "General",
            version: blueprint.version || "1.0.0",
            description: blueprint.description || `Generated ${blueprint.title}`,
            is_stepper: !!blueprint.is_stepper,
            intro_text: blueprint.intro_text || "",
            intro_color: blueprint.intro_color || "blue",
            sections: [],
            actions: {
                save: {
                    label: blueprint.actions?.save_label || "Save Progress",
                    visible: true,
                    type: "secondary"
                },
                submit: {
                    label: blueprint.actions?.submit_label || "Submit",
                    visible: true,
                    type: "primary"
                }
            },
            client_script: blueprint.client_script || ""
        };

        if (blueprint.is_stepper && blueprint.steps) {
            schema.steps = blueprint.steps.map(s => ({
                id: this.generateId(),
                title: s.title,
                description: s.description,
                sections: s.sections.map(sec => this.createSectionFromBlueprint(sec))
            }));
        } else if (blueprint.sections) {
            schema.sections = blueprint.sections.map(sec => this.createSectionFromBlueprint(sec));
        }

        return schema;
    }

    // --- Granular Operations ---

    addStep(schema: DocumentDefinition, title: string, description?: string): DocumentDefinition {
        if (!schema.steps) schema.steps = [];
        schema.steps.push({
            id: this.generateId(),
            title,
            description,
            sections: []
        });
        schema.is_stepper = true;
        return schema;
    }

    addSection(schema: DocumentDefinition, label: string, stepId?: string, props: Partial<DocumentSection> = {}): DocumentDefinition {
        const section = this.createSection(label, props);
        if (stepId && schema.steps) {
            const step = schema.steps.find(s => s.id === stepId || s.title === stepId);
            if (step) step.sections.push(section);
        } else if (schema.steps && schema.steps.length > 0) {
            schema.steps[schema.steps.length - 1].sections.push(section);
        } else {
            schema.sections.push(section);
        }
        return schema;
    }

    addField(schema: DocumentDefinition, sectionId: string, label: string, fieldtype: FieldType, props: Partial<DocumentField> = {}): DocumentDefinition {
        const field = this.createField(label, fieldtype, props);
        const section = this.findSection(schema, sectionId);
        if (section) {
            const colIndex = (props as any).colIndex || 0;
            if (!section.columns[colIndex]) {
                section.columns[colIndex] = { id: this.generateId(), fields: [] };
            }
            section.columns[colIndex].fields.push(field);
        }
        return schema;
    }

    updateField(schema: DocumentDefinition, fieldname: string, props: Partial<DocumentField>): DocumentDefinition {
        const sections = this.getAllSections(schema);
        for (const sec of sections) {
            for (const col of sec.columns) {
                const field = col.fields.find(f => f.fieldname === fieldname);
                if (field) {
                    Object.assign(field, props);
                    return schema;
                }
            }
        }
        return schema;
    }

    // --- Utilities ---

    private createSectionFromBlueprint(blueprint: SectionBlueprint): DocumentSection {
        const columns_count = blueprint.columns_count || 1;
        const columns = Array.from({ length: columns_count }, () => ({
            id: this.generateId(),
            fields: [] as DocumentField[]
        }));

        blueprint.fields.forEach((f, index) => {
            const colIndex = index % columns_count;
            columns[colIndex].fields.push(this.createFieldFromBlueprint(f));
        });

        return {
            id: this.generateId(),
            label: blueprint.label,
            columns_count,
            columns,
            collapsible: blueprint.collapsible || false,
            collapsed: blueprint.collapsed || false,
            depends_on: blueprint.depends_on
        };
    }

    private createFieldFromBlueprint(blueprint: FieldBlueprint): DocumentField {
        const field: DocumentField = {
            id: this.generateId(),
            label: blueprint.label,
            fieldname: blueprint.fieldname || this.slugify(blueprint.label),
            fieldtype: blueprint.fieldtype,
            mandatory: blueprint.mandatory || false,
            read_only: blueprint.read_only || false,
            hidden: blueprint.hidden || false,
            placeholder: blueprint.placeholder,
            description: blueprint.description,
            options: blueprint.options,
            regex: blueprint.regex,
            default: blueprint.default,
            data_group: blueprint.data_group,
            depends_on: blueprint.depends_on
        };

        if (blueprint.fieldtype === 'Table' && blueprint.table_fields) {
            field.table_fields = blueprint.table_fields.map(tf => ({
                id: this.generateId(),
                label: tf.label,
                fieldname: tf.fieldname || this.slugify(tf.label),
                fieldtype: tf.fieldtype,
                mandatory: tf.mandatory || false,
                options: tf.options,
                default: tf.default,
                regex: tf.regex
            } as TableColumnDef));
        }

        return field;
    }

    private createSection(label: string, props: Partial<DocumentSection> = {}): DocumentSection {
        const columns_count = props.columns_count || 1;
        return {
            id: this.generateId(),
            label,
            columns_count,
            columns: Array.from({ length: columns_count }, () => ({
                id: this.generateId(),
                fields: []
            })),
            collapsible: props.collapsible || false,
            collapsed: props.collapsed || false,
            depends_on: props.depends_on
        };
    }

    private createField(label: string, fieldtype: FieldType, props: Partial<DocumentField> = {}): DocumentField {
        return {
            id: this.generateId(),
            label,
            fieldname: props.fieldname || this.slugify(label),
            fieldtype,
            mandatory: props.mandatory || false,
            read_only: props.read_only || false,
            hidden: props.hidden || false,
            ...props
        };
    }

    private findSection(schema: DocumentDefinition, idOrLabel: string): DocumentSection | undefined {
        return this.getAllSections(schema).find(s => s.id === idOrLabel || s.label === idOrLabel);
    }

    private getAllSections(schema: DocumentDefinition): DocumentSection[] {
        if (schema.steps) return schema.steps.flatMap(s => s.sections);
        return schema.sections || [];
    }

    private generateId(): string {
        return "id_" + Math.random().toString(36).substring(2, 9);
    }

    private slugify(text: string): string {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '_')
            .replace(/^-+|-+$/g, '');
    }
}
