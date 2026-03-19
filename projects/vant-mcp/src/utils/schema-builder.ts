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
    link_config?: DocumentField["link_config"];
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

    buildFromPrompt(prompt: string): DocumentDefinition {
        const p = prompt.toLowerCase();
        const blueprint: FormBlueprint = {
            title: this.extractTitle(prompt),
            description: `Generated from: "${prompt}"`,
            is_stepper: p.includes("step") || p.includes("onboarding") || p.includes("stepper"),
            sections: []
        };

        const parts = prompt.split(/step \d+|section|then/i).filter(s => s.trim().length > 0);

        if (blueprint.is_stepper && parts.length > 1) {
            blueprint.steps = parts.map((part, i) => ({
                title: part.split(/with|:|for/i)[0].trim() || `Step ${i + 1}`,
                sections: [this.parseSection(part)]
            }));
        } else {
            blueprint.sections = parts.map(part => this.parseSection(part));
        }

        return this.buildFromBlueprint(blueprint);
    }

    private extractTitle(prompt: string): string {
        const match = prompt.match(/^(?:a|an)?\s*(.*?)\s+(?:form|request|application|with|for)/i);
        if (match) return this.capitalize(match[1]);
        return "New Vant Form";
    }

    private parseSection(text: string): SectionBlueprint {
        const parts = text.split(/with|:|contains/i);
        const label = parts[0].trim() || "Information";
        const fieldsContent = parts[1] || parts[0];
        const labels = fieldsContent.split(/,|and/).map(s => s.trim().replace(/^a\s+|^an\s+/i, '')).filter(s => s.length > 1);

        return {
            label: this.capitalize(label),
            fields: labels.map(l => {
                // Check for explicit Vant-native type hinting like "Amount:Float" or "Choice:Select"
                // Support both full names and common shorthand
                const typeHintPattern = /(Data|Select|Link|Check|Int|Text|Date|Float|Password|Button|Text Editor|Table|Datetime|Time|Signature|Attach)/i;
                const hintMatch = l.match(new RegExp(`^(.*?)\\s?[:\\[\\(]?(${typeHintPattern.source})[\\)\\]]?$`, 'i'));

                if (hintMatch) {
                    return {
                        label: this.capitalize(hintMatch[1].trim()),
                        fieldtype: this.normalizeFieldType(hintMatch[2].trim())
                    };
                }

                return {
                    label: this.capitalize(l),
                    fieldtype: this.inferFieldType(l)
                };
            })
        };
    }

    private normalizeFieldType(type: string): FieldType {
        const t = type.toLowerCase();
        if (t === 'text editor') return 'Text Editor';
        if (t === 'datetime') return 'Datetime';
        // Capitalize first letter for standard types
        const normalized = t.charAt(0).toUpperCase() + t.slice(1);
        // Valid Vant Types as of projects/vant-flow/src/lib/models/document.model.ts
        const validTypes: FieldType[] = [
            'Data', 'Select', 'Link', 'Check', 'Int', 'Text', 'Date', 'Float',
            'Password', 'Button', 'Text Editor', 'Table', 'Datetime', 'Time',
            'Signature', 'Attach'
        ];
        return validTypes.find(vt => vt.toLowerCase() === t) || 'Data';
    }

    private inferFieldType(label: string): FieldType {
        const l = label.toLowerCase();

        // Structural & Semantic Vant-native Inference
        // We look for nouns that ARE Vant types or their direct synonyms
        if (l.includes("date") && l.includes("time")) return "Datetime";
        if (l.includes("date") || l.includes("calendar")) return "Date";
        if (l.includes("time") || l.includes("clock")) return "Time";
        if (l.includes("select") || l.includes("dropdown") || l.includes("choice") || l.includes("selector")) return "Select";
        if (l.includes("check") || l.includes("toggle") || l.includes("switch")) return "Check";
        if (l.includes("float") || l.includes("decimal") || l.includes("amount")) return "Float";
        if (l.includes("int") || l.includes("integer") || l.includes("count") || l.includes("number")) return "Int";
        if (l.includes("editor") || l.includes("rich text") || l.includes("html")) return "Text Editor";
        if (l.includes("attach") || l.includes("upload") || l.includes("file")) return "Attach";
        if (l.includes("password") || l.includes("secret")) return "Password";
        if (l.includes("table") || l.includes("grid") || l.includes("list")) return "Table";
        if (l.includes("sign")) return "Signature";
        if (l.includes("link") || l.includes("ref")) return "Link";
        if (l.includes("button") || l.includes("trigger")) return "Button";
        if (l.includes("text") || l.includes("memo") || l.includes("long")) return "Text";

        return "Data";
    }

    private capitalize(text: string): string {
        if (!text) return "";
        return text.charAt(0).toUpperCase() + text.slice(1);
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
            link_config: blueprint.link_config,
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

    generateSummary(schema: DocumentDefinition): string {
        const parts: string[] = [];
        const title = this.capitalize(schema.name.replace(/_/g, ' '));
        parts.push(`This is a ${schema.is_stepper ? 'multi-step' : 'single-page'} form titled "${title}"`);

        if (schema.module !== "General") {
            parts.push(`managed within the ${schema.module} module.`);
        } else {
            parts.push(`for general information collection.`);
        }

        const sections = this.getAllSections(schema);
        const fields = sections.flatMap(s => s.columns.flatMap(c => c.fields));

        if (schema.is_stepper && schema.steps) {
            const stepTitles = schema.steps.map(s => s.title).join(", ");
            parts.push(`It is organized into ${schema.steps.length} steps: ${stepTitles}.`);
        } else {
            parts.push(`It contains ${sections.length} logical sections.`);
        }

        const typeCounts = fields.reduce((acc, f) => {
            acc[f.fieldtype] = (acc[f.fieldtype] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const importantTypes = Object.entries(typeCounts)
            .filter(([type]) => type !== 'Data')
            .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`);

        if (importantTypes.length > 0) {
            parts.push(`The form collects specialized data including ${importantTypes.join(", ")}.`);
        }

        const topFields = fields.slice(0, 5).map(f => f.label).join(", ");
        parts.push(`Primary fields include ${topFields}${fields.length > 5 ? ' among others' : ''}.`);

        if (schema.client_script && schema.client_script.trim().length > 0) {
            parts.push(`It includes custom client-side logic for dynamic behavior.`);
        }

        return parts.join(" ");
    }

    private slugify(text: string): string {
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '_')
            .replace(/^-+|-+$/g, '');
    }
}
