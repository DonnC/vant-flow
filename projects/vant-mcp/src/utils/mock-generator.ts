import type { DocumentDefinition, DocumentField, DocumentSection } from "vant-flow";

export class VantMockGenerator {
    generateData(schema: DocumentDefinition): any {
        const data: any = {};
        const fields = this.getAllFields(schema);

        for (const field of fields) {
            data[field.fieldname] = field.default !== undefined ? field.default : this.generateFieldValue(field);
        }

        return data;
    }

    private generateFieldValue(field: DocumentField | any): any {
        switch (field.fieldtype) {
            case 'Data':
            case 'Text':
            case 'Password':
                return `Sample ${field.label}`;
            case 'Int':
            case 'Float':
                return Math.floor(Math.random() * 100);
            case 'Check':
                return 1;
            case 'Date':
                return new Date().toISOString().split('T')[0];
            case 'Datetime':
                return new Date().toISOString();
            case 'Time':
                return "14:30";
            case 'Select':
                const options = field.options?.split('\n') || ['Option 1'];
                return options[0].trim();
            case 'Table':
                return [this.generateTableRow(field.table_fields || [])];
            case 'Attach':
                return JSON.stringify([{ name: 'sample.pdf', size: 1024, type: 'application/pdf', url: '#' }]);
            case 'Signature':
                return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
            case 'Text Editor':
                return field.options || '<p>Default AI-generated content for ' + field.label + '</p>';
            case 'Link':
                return {
                    [field.link_config?.mapping?.id || 'id']: 'LINK-REC-001',
                    [field.link_config?.mapping?.title || 'title']: `Sample ${field.label}`,
                    ...(field.link_config?.mapping?.description
                        ? { [field.link_config.mapping.description]: `Description for ${field.label}` }
                        : {})
                };
            case 'Button':
                return null;
            default:
                return null;
        }
    }

    private generateTableRow(columns: any[]): any {
        const row: any = {};
        for (const col of columns) {
            row[col.fieldname] = this.generateFieldValue(col);
        }
        return row;
    }

    private getAllFields(schema: DocumentDefinition): DocumentField[] {
        const fields: DocumentField[] = [];
        const sections: DocumentSection[] = schema.steps
            ? schema.steps.flatMap((s) => s.sections)
            : (schema.sections || []);

        for (const section of sections) {
            for (const col of section.columns) {
                fields.push(...col.fields);
            }
        }
        return fields;
    }
}
