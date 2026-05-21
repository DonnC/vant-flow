import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { VantSchemaBuilder } from "./utils/schema-builder.js";
import { VantMockGenerator } from "./utils/mock-generator.js";
import * as fs from "fs";
import * as path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "mcp.log");

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logToFile(message: string, isError: boolean = false) {
    const timestamp = new Date().toISOString();
    const type = isError ? "[ERROR]" : "[INFO]";
    const logMessage = `${timestamp} ${type} ${message}\n`;
    fs.appendFileSync(LOG_FILE, logMessage);
    if (isError) {
        console.error(message);
    } else {
        console.log(message);
    }
}

const builder = new VantSchemaBuilder();
const mockGen = new VantMockGenerator();

const VALID_FIELD_TYPES = new Set([
    "Data", "Select", "Link", "Check", "Int", "Text", "Date", "Float",
    "Password", "Button", "Text Editor", "Table", "Datetime", "Time",
    "Signature", "Attach"
]);

const VALID_TABLE_CHILD_TYPES = new Set([
    "Data", "Select", "Link", "Check", "Int", "Text", "Date", "Float",
    "Password", "Button", "Text Editor", "Datetime", "Time",
    "Signature", "Attach"
]);

const VALID_INTRO_COLORS = new Set(["blue", "orange", "red", "gray"]);
const VALID_HTTP_METHODS = new Set(["GET", "POST"]);
const VALID_CAPTURE_MODES = new Set(["user", "environment"]);

const FRM_API_DOCS = `
Vant Flow 'frm' API Hooks and Methods:

Hooks:
- frm.on('refresh', (val, frm) => ...): Triggered when form is loaded.
- frm.on('before_save', (val, frm) => ...): Triggered before saving. Return false to block.
- frm.on('before_step_change', (val, frm) => ...): Triggered on stepper navigation. 'val' has { from, to }.
- frm.on('fieldname', (val, frm) => ...): Triggered when a value changes.
- frm.on('table_fieldname_add', (val, frm) => ...): Triggered when a row is added to a table.
- frm.on('table_fieldname_remove', (val, frm) => ...): Triggered when a row is removed from a table.

Methods:
- frm.get_value(fieldname): Get field value.
- frm.set_value(fieldname, value): Set field value.
- frm.set_df_property(fieldname, property, value, child_fieldname?): Update field or table-child properties.
- frm.set_filter(fieldname, filters): Replace runtime filters for a Link field.
- frm.refresh_link(fieldname): Force a Link field to refetch its data source.
- frm.msgprint(msg, [type]): Show notification (info, success, warning, danger).
- frm.set_intro(msg, [color]): Set or clear the form-level intro banner.
- frm.add_custom_button(label, action, [type]): Add a button to the form header.
- frm.prompt(fields[], callback, [title]): Show a modal data entry prompt.
- frm.confirm(msg, callback): Show confirmation dialog.
- frm.call({ method, args, callback }): Call a backend simulation.
- frm.set_step_hidden(id, hidden): Hide or show a specific step.
- frm.set_section_property(sectionId, property, value): Set a section property (hidden, collapsed, etc).
- frm.set_readonly(readOnly): Set full form read-only state.
- frm.add_row(fieldname, row?): Add a row to a table field.
- frm.remove_row(fieldname, index): Remove a table row by index.
- frm.validate(): Run validation.
- frm.validate_step(stepId?): Run validation for the current or named step.
- frm.reset(): Reset all form fields to default values.
- frm.freeze(message?): Freeze the form UI.
- frm.unfreeze(): Unfreeze the form UI.
- frm.metadata: Access arbitrary runtime metadata injected by the host.
`;

const SCHEMA_MODEL_DOCS = `
Vant Flow Schema Model Reference

DocumentDefinition:
- name: string [required]
- module?: string
- description?: string
- version?: string
- is_stepper?: boolean
- intro_text?: string
- intro_color?: "blue" | "orange" | "red" | "gray"
- sections: DocumentSection[]
- steps?: DocumentStep[]
- client_script?: string
- actions?: FormActionsConfig
- metadata?: Record<string, any>

DocumentSection:
- id: string [required]
- label?: string
- description?: string
- depends_on?: string
- hidden?: boolean
- collapsible?: boolean
- collapsed?: boolean
- columns_count?: number
- columns: DocumentColumn[] [required]

DocumentColumn:
- id: string [required]
- fields: DocumentField[] [required]

DocumentField common properties:
- id: string [required]
- fieldname: string [required]
- fieldtype: FieldType [required]
- label: string [required]
- default?: any
- mandatory?: boolean
- reqd?: boolean
- indexed?: boolean
- options?: string
- hidden?: boolean
- read_only?: boolean
- depends_on?: string
- mandatory_depends_on?: string
- description?: string
- placeholder?: string
- regex?: string
- table_fields?: TableColumnDef[]
- data_group?: string
- link_config?: VfLinkFieldConfig
- attach_config?: VfAttachFieldConfig
`;

const RENDERER_CONTRACT_DOCS = `
Vant Flow Renderer Contract

Inputs accepted by VfRenderer:
- document
- initialData
- readonly
- runFormScripts
- readonlyFields
- hiddenFields
- disabledActionButtons
- hiddenActionButtons
- showActions
- submitLabel
- disabled
- metadata
- mediaHandler
- mediaResolver
- linkDataSource
- linkRequestObserver

Outputs:
- formReady
- formChange
- formAction
- formError

Runtime notes:
- data_group packs flat field values into nested submit payload objects
- Check values normalize to 1 or 0
- Link values store the selected object
- Table rows are emitted as array objects and usually include idx
- custom runtimeAction returning false blocks formAction emission
- mediaHandler and mediaResolver are only used for Attach and Signature fields
`;

const BUILDER_CONTRACT_DOCS = `
Vant Flow Builder Authoring Surface

Builder-level authoring:
- document.name, module, description, version
- intro_text and intro_color
- actions configuration
- client_script authoring
- preview-only runtime metadata editor for frm.metadata testing
- showScriptEditor input controls whether the script tab is available

Field authoring supported by the builder:
- common properties: label, fieldname, fieldtype, mandatory, reqd, hidden, read_only
- placeholder, description, default, regex
- depends_on and mandatory_depends_on
- data_group
- Select options
- Button style via options
- Text Editor initial HTML via options
- Attach camera capture via attach_config.enable_capture
- Link authoring via link_config.data_source, mapping, method, filters, min_query_length
- Table authoring via table_fields child columns, including child Attach capture support

Preview/testing:
- preview metadata is runtime-only and is not persisted into schema.metadata
- builder preview executes client_script against the renderer contract
`;

const EXAMPLE_SCHEMAS_DOCS = `
Representative Vant schema patterns from the example app:

1. Quality Inspection Report
- intro_text and intro_color
- regex on a Data field
- conditional section via depends_on
- Text Editor and Button fields
- complex Table with mixed child column types
- actions.save and actions.submit
- client_script using frm.metadata and frm.set_intro()

2. Voucher Catalog Request
- Link field with link_config
- remote data source mapping and filters
- client_script using frm.set_filter() and frm.refresh_link()

Use these patterns to understand:
- when metadata-aware scripts are useful
- how to configure Link fields
- how to structure Table child columns
- how to combine actions, intro banners, and conditional logic
`;

const FIELD_TYPE_CATALOG = `
Vant Flow Field Type Reference - all supported fieldtypes and their configuration properties.

Common field properties:
- id: string [required]
- fieldname: string [required]
- label: string [required]
- fieldtype: FieldType [required]
- mandatory?: boolean | 1 | 0
- reqd?: boolean | 1 | 0
- read_only?: boolean
- hidden?: boolean
- placeholder?: string
- description?: string
- default?: any
- depends_on?: string
- mandatory_depends_on?: string
- data_group?: string

Field types:
1. Data - single-line text input, supports regex
2. Text - multi-line textarea
3. Text Editor - rich HTML editor, options can hold initial HTML
4. Int - integer number input
5. Float - decimal number input
6. Select - dropdown with newline-separated options
7. Check - boolean checkbox, renderer stores 1 or 0
8. Date - date-only picker
9. Datetime - date + time picker
10. Time - time-only picker
11. Password - masked text input
12. Link - remote autocomplete selector that stores the selected object
13. Attach - file upload widget; use data_group: "files"
14. Signature - signature capture; use data_group: "files"
15. Button - in-form button rendered in the body
16. Table - repeating child-row grid; requires table_fields and does not support nested Table

Link field config:
- link_config.data_source [required]
- link_config.mapping.id [required]
- link_config.mapping.title [required]
- link_config.mapping.description
- link_config.filters
- link_config.method
- link_config.search_param
- link_config.limit_param
- link_config.results_path
- link_config.cache
- link_config.min_query_length
- link_config.page_size

Attach field config:
- options format: "<mime> | <maxSize> | <maxCount>"
- attach_config.enable_capture
- attach_config.capture_mode
`;

const BLUEPRINT_CONTRACT_DOCS = `
Blueprint contract for scaffold_from_blueprint:

{
  "title": "Human readable form title",
  "is_stepper": false,
  "module": "General",
  "version": "1.0.0",
  "description": "Short description",
  "intro_text": "Optional intro banner",
  "intro_color": "blue",
  "sections": [
    {
      "label": "Section label",
      "columns_count": 1,
      "fields": [
        {
          "label": "Field label",
          "fieldtype": "Data",
          "fieldname": "field_label_in_snake_case",
          "mandatory": true
        }
      ]
    }
  ]
}

Use sections for single-page forms.
Use steps[] with nested sections[] for explicit stepper flows.
Use table_fields on Table fields.
Use newline-separated strings for Select options.
Use data_group: "files" for Attach and Signature fields.
`;

function buildCapabilitiesSnapshot() {
    return {
        server: {
            name: "vant-flow-server",
            version: "1.0.0"
        },
        recommended_workflow: {
            prompt_only: ["get_capabilities", "create_form_from_prompt", "verify_schema", "analyze_schema"],
            structured_scaffold: ["get_models", "get_field_types", "scaffold_from_blueprint", "verify_schema"],
            refinement: ["add_step", "add_section", "add_field", "update_field", "update_client_script", "configure_actions", "set_intro"],
            discovery: ["get_models", "get_field_types", "get_renderer_contract", "get_builder_contract", "get_example_schemas"]
        },
        schema_rules: [
            "DocumentDefinition.name should be human-readable.",
            "Sections must use columns[].fields[].",
            "Fields must use id, fieldname, fieldtype, and label.",
            "Select options must be newline-separated strings.",
            "Table fields must use table_fields.",
            "Attach and Signature fields should use data_group 'files'."
        ],
        tools: [
            { name: "create_form_from_prompt", description: "Generate a Vant form from a natural-language prompt." },
            { name: "get_models", description: "Get frm API, schema model, renderer contract, and builder docs." },
            { name: "get_field_types", description: "Get the full field type catalog." },
            { name: "get_capabilities", description: "Get a compact JSON summary of MCP capabilities and workflows." },
            { name: "get_renderer_contract", description: "Get the VfRenderer runtime contract." },
            { name: "get_builder_contract", description: "Get the builder authoring contract." },
            { name: "get_example_schemas", description: "Get example-schema guidance from the demo app." },
            { name: "analyze_schema", description: "Summarize a Vant schema in natural language." },
            { name: "describe_schema", description: "Describe a schema in business-friendly language." },
            { name: "verify_schema", description: "Validate structural integrity and report issues." },
            { name: "scaffold_from_blueprint", description: "Build a schema from a structured blueprint." },
            { name: "add_step", description: "Add a step to a stepper form." },
            { name: "add_section", description: "Add a section to a form or step." },
            { name: "add_field", description: "Add a field to a specific section." },
            { name: "update_field", description: "Patch an existing field by fieldname." },
            { name: "update_client_script", description: "Set the form client script." },
            { name: "configure_actions", description: "Update form actions like submit/save." },
            { name: "set_intro", description: "Set intro banner text and color." },
            { name: "generate_mock_data", description: "Generate mock form data from a schema." }
        ],
        blueprint_contract: BLUEPRINT_CONTRACT_DOCS.trim()
    };
}

function isPlainObject(value: any) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function flattenSections(schema: any): any[] {
    return Array.isArray(schema?.steps)
        ? schema.steps.flatMap((step: any) => step?.sections || [])
        : (schema?.sections || []);
}

function verifyTableField(tableField: any, pathPrefix: string) {
    const issues: string[] = [];
    if (!Array.isArray(tableField.table_fields) || tableField.table_fields.length === 0) {
        issues.push(`${pathPrefix}.table_fields must be a non-empty array.`);
        return issues;
    }

    const childFieldnames = new Set<string>();
    tableField.table_fields.forEach((col: any, index: number) => {
        const colPath = `${pathPrefix}.table_fields[${index}]`;
        if (!col?.id || typeof col.id !== "string") issues.push(`${colPath}.id is required.`);
        if (!col?.fieldname || typeof col.fieldname !== "string") {
            issues.push(`${colPath}.fieldname is required.`);
        } else if (childFieldnames.has(col.fieldname)) {
            issues.push(`${colPath}.fieldname duplicates another table child fieldname.`);
        } else {
            childFieldnames.add(col.fieldname);
        }
        if (!col?.label || typeof col.label !== "string") issues.push(`${colPath}.label is required.`);
        if (!VALID_TABLE_CHILD_TYPES.has(col?.fieldtype)) {
            issues.push(`${colPath}.fieldtype must be a supported non-Table field type.`);
        }
        if (col?.fieldtype === "Select" && typeof col.options !== "string") {
            issues.push(`${colPath}.options must be a newline-separated string for Select.`);
        }
        if (col?.fieldtype === "Attach") {
            const attachConfig = col.attach_config;
            if (attachConfig && !isPlainObject(attachConfig)) {
                issues.push(`${colPath}.attach_config must be an object.`);
            }
            if (attachConfig?.capture_mode && !VALID_CAPTURE_MODES.has(attachConfig.capture_mode)) {
                issues.push(`${colPath}.attach_config.capture_mode must be "user" or "environment".`);
            }
        }
    });

    return issues;
}

function verifySchemaShape(schema: any): string[] {
    const issues: string[] = [];
    if (!isPlainObject(schema)) {
        return ["Schema must be an object."];
    }

    if (!schema.name || typeof schema.name !== "string") {
        issues.push("DocumentDefinition.name is required.");
    }

    if (schema.intro_color && !VALID_INTRO_COLORS.has(schema.intro_color)) {
        issues.push("DocumentDefinition.intro_color must be one of blue, orange, red, or gray.");
    }

    if (schema.is_stepper && (!Array.isArray(schema.steps) || schema.steps.length === 0)) {
        issues.push("Stepper forms must define a non-empty steps array.");
    }

    if (schema.steps && !Array.isArray(schema.steps)) {
        issues.push("DocumentDefinition.steps must be an array when present.");
    }

    if (schema.sections && !Array.isArray(schema.sections)) {
        issues.push("DocumentDefinition.sections must be an array when present.");
    }

    if (schema.actions && !isPlainObject(schema.actions)) {
        issues.push("DocumentDefinition.actions must be an object.");
    }

    if (isPlainObject(schema.actions)) {
        Object.entries(schema.actions).forEach(([key, value]) => {
            const actionConfig = value as Record<string, any>;
            if (!isPlainObject(actionConfig)) {
                issues.push(`actions.${key} must be an object.`);
                return;
            }
            if (typeof actionConfig.label !== "string") issues.push(`actions.${key}.label is required.`);
            if (typeof actionConfig.visible !== "boolean") issues.push(`actions.${key}.visible must be boolean.`);
        });
    }

    if (Array.isArray(schema.steps)) {
        schema.steps.forEach((step: any, index: number) => {
            const stepPath = `steps[${index}]`;
            if (!step?.id || typeof step.id !== "string") issues.push(`${stepPath}.id is required.`);
            if (!step?.title || typeof step.title !== "string") issues.push(`${stepPath}.title is required.`);
            if (!Array.isArray(step?.sections) || step.sections.length === 0) {
                issues.push(`${stepPath}.sections must be a non-empty array.`);
            }
        });
    }

    const sections = flattenSections(schema);
    if (!Array.isArray(sections) || sections.length === 0) {
        issues.push("Schema must contain at least one section or step section.");
        return issues;
    }

    const fieldnames = new Set<string>();

    sections.forEach((section: any, sectionIndex: number) => {
        const sectionPath = `sections[${sectionIndex}]`;
        if (!section?.id || typeof section.id !== "string") {
            issues.push(`${sectionPath}.id is required.`);
        }
        if (!Array.isArray(section?.columns) || section.columns.length === 0) {
            issues.push(`${sectionPath}.columns must be a non-empty array.`);
            return;
        }
        if (section.columns_count !== undefined && section.columns_count !== section.columns.length) {
            issues.push(`${sectionPath}.columns_count should match columns.length.`);
        }

        section.columns.forEach((column: any, colIndex: number) => {
            const colPath = `${sectionPath}.columns[${colIndex}]`;
            if (!column?.id || typeof column.id !== "string") {
                issues.push(`${colPath}.id is required.`);
            }
            if (!Array.isArray(column?.fields)) {
                issues.push(`${colPath}.fields must be an array.`);
                return;
            }

            column.fields.forEach((field: any, fieldIndex: number) => {
                const fieldPath = `${colPath}.fields[${fieldIndex}]`;
                if (!field?.id || typeof field.id !== "string") issues.push(`${fieldPath}.id is required.`);
                if (!field?.fieldname || typeof field.fieldname !== "string") {
                    issues.push(`${fieldPath}.fieldname is required.`);
                } else if (fieldnames.has(field.fieldname)) {
                    issues.push(`${fieldPath}.fieldname duplicates another fieldname.`);
                } else {
                    fieldnames.add(field.fieldname);
                }
                if (!field?.label || typeof field.label !== "string") issues.push(`${fieldPath}.label is required.`);
                if (!VALID_FIELD_TYPES.has(field?.fieldtype)) issues.push(`${fieldPath}.fieldtype is not a supported Vant field type.`);
                if (field?.depends_on !== undefined && typeof field.depends_on !== "string") issues.push(`${fieldPath}.depends_on must be a string.`);
                if (field?.mandatory_depends_on !== undefined && typeof field.mandatory_depends_on !== "string") issues.push(`${fieldPath}.mandatory_depends_on must be a string.`);
                if (field?.data_group !== undefined && typeof field.data_group !== "string") issues.push(`${fieldPath}.data_group must be a string.`);
                if (field?.fieldtype === "Select" && typeof field.options !== "string") issues.push(`${fieldPath}.options must be a newline-separated string for Select.`);
                if ((field?.fieldtype === "Attach" || field?.fieldtype === "Signature") && field.data_group !== "files") {
                    issues.push(`${fieldPath}.data_group should be "files" for ${field.fieldtype}.`);
                }
                if ((field?.fieldtype === "Attach" || field?.fieldtype === "Signature") && field.attach_config) {
                    if (!isPlainObject(field.attach_config)) {
                        issues.push(`${fieldPath}.attach_config must be an object.`);
                    } else if (field.attach_config.capture_mode && !VALID_CAPTURE_MODES.has(field.attach_config.capture_mode)) {
                        issues.push(`${fieldPath}.attach_config.capture_mode must be "user" or "environment".`);
                    }
                }
                if (field?.fieldtype === "Link") {
                    if (!isPlainObject(field.link_config)) {
                        issues.push(`${fieldPath}.link_config is required for Link fields.`);
                    } else {
                        if (typeof field.link_config.data_source !== "string" || !field.link_config.data_source.trim()) issues.push(`${fieldPath}.link_config.data_source is required.`);
                        if (!isPlainObject(field.link_config.mapping)) {
                            issues.push(`${fieldPath}.link_config.mapping is required.`);
                        } else {
                            if (typeof field.link_config.mapping.id !== "string") issues.push(`${fieldPath}.link_config.mapping.id is required.`);
                            if (typeof field.link_config.mapping.title !== "string") issues.push(`${fieldPath}.link_config.mapping.title is required.`);
                        }
                        if (field.link_config.method && !VALID_HTTP_METHODS.has(field.link_config.method)) {
                            issues.push(`${fieldPath}.link_config.method must be GET or POST.`);
                        }
                    }
                }
                if (field?.fieldtype === "Table") {
                    issues.push(...verifyTableField(field, fieldPath));
                }
            });
        });
    });

    return issues;
}

function createVantServer() {
    const server = new Server(
        {
            name: "vant-flow-server",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
            },
        }
    );

    registerHandlers(server);
    return server;
}

function registerHandlers(server: Server) {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "create_form_from_prompt",
                    description: "[MAGIC] Generate a Vant Flow form from a natural language prompt.",
                    inputSchema: { type: "object", properties: { prompt: { type: "string", description: "Describe the form" } }, required: ["prompt"] },
                },
                {
                    name: "get_models",
                    description: "Get the frm API, schema model, renderer contract, and builder authoring docs.",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "get_field_types",
                    description: "Get the complete Vant Flow field type catalog.",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "get_capabilities",
                    description: "Get a compact JSON summary of Vant MCP capabilities, workflows, and contracts.",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "get_renderer_contract",
                    description: "Get the renderer runtime contract and event surface.",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "get_builder_contract",
                    description: "Get the builder authoring and preview contract.",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "get_example_schemas",
                    description: "Get example-schema guidance that demonstrates advanced Vant patterns.",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "analyze_schema",
                    description: "AI-friendly summary of a Vant schema, including detected issues.",
                    inputSchema: { type: "object", properties: { schema: { type: "object", description: "The DocumentDefinition to analyze" } }, required: ["schema"] },
                },
                {
                    name: "describe_schema",
                    description: "Generate a natural-language explanation of a Vant schema.",
                    inputSchema: { type: "object", properties: { schema: { type: "object", description: "The DocumentDefinition to describe" } }, required: ["schema"] },
                },
                {
                    name: "verify_schema",
                    description: "Check a Vant schema for structural and authoring issues.",
                    inputSchema: { type: "object", properties: { schema: { type: "object", description: "The DocumentDefinition to verify" } }, required: ["schema"] },
                },
                {
                    name: "scaffold_from_blueprint",
                    description: "Scaffold a complete Vant Flow form using a structured blueprint.",
                    inputSchema: { type: "object", properties: { blueprint: { type: "object", required: ["title"] } }, required: ["blueprint"] },
                },
                {
                    name: "add_step",
                    description: "Add a new step to a multi-step form.",
                    inputSchema: { type: "object", properties: { schema: { type: "object" }, title: { type: "string" }, description: { type: "string" } }, required: ["schema", "title"] },
                },
                {
                    name: "add_section",
                    description: "Add a section to a form or specific step.",
                    inputSchema: { type: "object", properties: { schema: { type: "object" }, label: { type: "string" }, stepId: { type: "string" }, props: { type: "object" } }, required: ["schema", "label"] },
                },
                {
                    name: "add_field",
                    description: "Add a field to a specific section.",
                    inputSchema: { type: "object", properties: { schema: { type: "object" }, sectionId: { type: "string" }, label: { type: "string" }, fieldtype: { type: "string" }, props: { type: "object" } }, required: ["schema", "sectionId", "label", "fieldtype"] },
                },
                {
                    name: "update_field",
                    description: "Update field properties.",
                    inputSchema: { type: "object", properties: { schema: { type: "object" }, fieldname: { type: "string" }, props: { type: "object" } }, required: ["schema", "fieldname", "props"] },
                },
                {
                    name: "update_client_script",
                    description: "Set or update the form's client-side JavaScript logic.",
                    inputSchema: { type: "object", properties: { schema: { type: "object" }, script: { type: "string" } }, required: ["schema", "script"] },
                },
                {
                    name: "configure_actions",
                    description: "Update the form's action configuration, including custom actions.",
                    inputSchema: { type: "object", properties: { schema: { type: "object" }, actions: { type: "object" } }, required: ["schema", "actions"] },
                },
                {
                    name: "set_intro",
                    description: "Set the form intro banner text and optional intro color.",
                    inputSchema: { type: "object", properties: { schema: { type: "object" }, intro_text: { type: "string" }, intro_color: { type: "string", enum: ["blue", "orange", "red", "gray"] } }, required: ["schema", "intro_text"] },
                },
                {
                    name: "generate_mock_data",
                    description: "Generate mock JSON data that more closely resembles renderer output.",
                    inputSchema: { type: "object", properties: { schema: { type: "object" } }, required: ["schema"] },
                },
            ],
        };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            switch (name) {
                case "get_models":
                    return {
                        content: [{
                            type: "text",
                            text: [
                                "Vant Flow frm API",
                                FRM_API_DOCS.trim(),
                                "",
                                "Schema Model",
                                SCHEMA_MODEL_DOCS.trim(),
                                "",
                                "Renderer Contract",
                                RENDERER_CONTRACT_DOCS.trim(),
                                "",
                                "Builder Contract",
                                BUILDER_CONTRACT_DOCS.trim()
                            ].join("\n")
                        }]
                    };
                case "get_field_types":
                    return { content: [{ type: "text", text: FIELD_TYPE_CATALOG.trim() }] };
                case "get_capabilities":
                    return { content: [{ type: "text", text: JSON.stringify(buildCapabilitiesSnapshot(), null, 2) }] };
                case "get_renderer_contract":
                    return { content: [{ type: "text", text: RENDERER_CONTRACT_DOCS.trim() }] };
                case "get_builder_contract":
                    return { content: [{ type: "text", text: BUILDER_CONTRACT_DOCS.trim() }] };
                case "get_example_schemas":
                    return { content: [{ type: "text", text: EXAMPLE_SCHEMAS_DOCS.trim() }] };
                case "create_form_from_prompt": {
                    const schema = builder.buildFromPrompt((args as any).prompt);
                    return { content: [{ type: "text", text: JSON.stringify(schema, null, 2) }] };
                }
                case "analyze_schema": {
                    const schema = (args as any).schema;
                    const issues = verifySchemaShape(schema);
                    const summary = builder.generateSummary(schema);
                    const text = issues.length > 0
                        ? `${summary}\n\nPotential issues:\n- ${issues.join("\n- ")}`
                        : `${summary}\n\nNo obvious structural issues detected.`;
                    return { content: [{ type: "text", text }] };
                }
                case "describe_schema": {
                    const description = builder.generateSummary((args as any).schema);
                    return { content: [{ type: "text", text: description }] };
                }
                case "verify_schema": {
                    const schema = (args as any).schema;
                    const issues = verifySchemaShape(schema);
                    return {
                        content: [{
                            type: "text",
                            text: JSON.stringify({
                                valid: issues.length === 0,
                                issues,
                                summary: builder.generateSummary(schema),
                                issueCount: issues.length
                            }, null, 2)
                        }]
                    };
                }
                case "scaffold_from_blueprint": {
                    const schema = builder.buildFromBlueprint((args as any).blueprint);
                    return { content: [{ type: "text", text: JSON.stringify(schema, null, 2) }] };
                }
                case "add_step": {
                    const { schema, title, description } = args as any;
                    const updated = builder.addStep(schema, title, description);
                    return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
                }
                case "add_section": {
                    const { schema, label, stepId, props } = args as any;
                    const updated = builder.addSection(schema, label, stepId, props);
                    return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
                }
                case "add_field": {
                    const { schema, sectionId, label, fieldtype, props } = args as any;
                    const updated = builder.addField(schema, sectionId, label, fieldtype, props);
                    return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
                }
                case "update_field": {
                    const { schema, fieldname, props } = args as any;
                    const updated = builder.updateField(schema, fieldname, props);
                    return { content: [{ type: "text", text: JSON.stringify(updated, null, 2) }] };
                }
                case "update_client_script": {
                    const { schema, script } = args as any;
                    schema.client_script = script;
                    return { content: [{ type: "text", text: JSON.stringify(schema, null, 2) }] };
                }
                case "configure_actions": {
                    const { schema, actions } = args as any;
                    schema.actions = { ...schema.actions, ...actions };
                    return { content: [{ type: "text", text: JSON.stringify(schema, null, 2) }] };
                }
                case "set_intro": {
                    const { schema, intro_text, intro_color } = args as any;
                    schema.intro_text = intro_text;
                    if (intro_color) {
                        schema.intro_color = intro_color;
                    }
                    return { content: [{ type: "text", text: JSON.stringify(schema, null, 2) }] };
                }
                case "generate_mock_data": {
                    const data = mockGen.generateData((args as any).schema);
                    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
                }
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error: any) {
            return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
        }
    });
}

let activeAppServer: any = null;

async function main() {
    const transportMode = (process.env.TRANSPORT || "stdio").trim();
    logToFile(`Starting MCP server with TRANSPORT="${transportMode}"`);

    process.on("uncaughtException", (err) => {
        logToFile(`CRITICAL: Uncaught Exception: ${err.message}`, true);
        if (err.stack) logToFile(err.stack, true);
    });
    process.on("unhandledRejection", (reason, promise) => {
        logToFile(`CRITICAL: Unhandled Rejection at: ${promise} reason: ${reason}`, true);
    });
    process.on("exit", (code) => {
        logToFile(`PROCESS EXITING with code: ${code}`);
    });

    if (transportMode === "stdio") {
        const server = createVantServer();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Vant Flow MCP server running on stdio");
    } else if (transportMode === "sse") {
        const app = express();
        app.use(cors());

        const serverTransports = new Map<string, SSEServerTransport>();

        app.get("/sse", async (req, res) => {
            logToFile("New SSE connection established");
            try {
                const server = createVantServer();
                const transport = new SSEServerTransport("/messages", res);
                await server.connect(transport);

                if (transport.sessionId) {
                    logToFile(`Session initialized: ${transport.sessionId}`);
                    serverTransports.set(transport.sessionId, transport);

                    req.on("close", () => {
                        logToFile(`Connection closed for session: ${transport.sessionId}`);
                        serverTransports.delete(transport.sessionId);
                    });
                } else {
                    logToFile("Warning: Transport connected but no sessionId generated", true);
                }
            } catch (err: any) {
                logToFile(`SSE Connection Error: ${err.message}`, true);
                res.status(500).send(`SSE Error: ${err.message}`);
            }
        });

        app.post("/messages", async (req, res) => {
            const sessionId = req.query.sessionId as string;
            const transport = serverTransports.get(sessionId);
            if (transport) {
                await transport.handlePostMessage(req, res);
            } else {
                res.status(400).send("No active SSE transport for session");
            }
        });

        const PORT = process.env.PORT || 3001;
        activeAppServer = app.listen(PORT, () => {
            console.error(`Vant Flow MCP server running on SSE at http://localhost:${PORT}/sse`);
        });

        setInterval(() => {
            const sessions = serverTransports.size;
            if (sessions > 0) {
                logToFile(`MCP Heartbeat: ${sessions} active sessions`);
            }
        }, 30000);

        return new Promise(() => {
            console.error("Server listener thread active. Use Ctrl+C to terminate.");
        });
    }
}

main().catch((err) => {
    logToFile(`Fatal startup error: ${err?.message || err}`, true);
    if (activeAppServer?.close) {
        activeAppServer.close();
    }
    process.exit(1);
});
