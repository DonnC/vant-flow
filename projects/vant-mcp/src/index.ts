import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { VantSchemaBuilder } from "./utils/schema-builder.js";
import { VantMockGenerator } from "./utils/mock-generator.js";

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

const builder = new VantSchemaBuilder();
const mockGen = new VantMockGenerator();

const FRM_API_DOCS = `
Vant Flow 'frm' API Hooks and Methods:

Hooks:
- frm.on('refresh', (val, frm) => ...): Triggered when form is loaded.
- frm.on('before_save', (val, frm) => ...): Triggered before saving. Return false to block.
- frm.on('before_step_change', (val, frm) => ...): Triggered on stepper navigation. 'val' has {from, to}.
- frm.on('fieldname', (val, frm) => ...): Triggered when a value changes.
- frm.on('table_fieldname_add', (val, frm) => ...): Triggered when row added to table.
- frm.on('table_fieldname_remove', (val, frm) => ...): Triggered when row removed.

Methods:
- frm.get_value(fieldname): Get field value.
- frm.set_value(fieldname, value): Set field value.
- frm.set_df_property(fieldname, property, value, child_fieldname?): Update field/table column properties (hidden, read_only, label, etc).
- frm.msgprint(msg, [type]): Show notification (info, success, warning, danger).
- frm.set_intro(msg, [color]): Set form-level intro banner.
- frm.add_custom_button(label, action, [type]): Add a button to the form header.
- frm.prompt(fields[], callback, [title]): Show a modal data entry prompt.
- frm.confirm(msg, callback): Show confirmation dialog.
- frm.call({method, args, callback}): Call a backend simulation.
- frm.set_step_hidden(id, hidden): Hide/Show a specific step.
- frm.set_section_property(sectionId, property, value): Set a section's property (hidden, collapsed, etc).
- frm.set_readonly(readOnly): Set full form read-only state.
- frm.add_row(fieldname, row?): Add a row to a table field.
- frm.remove_row(fieldname, index): Remove a table row by index.
- frm.reset(): Reset all form fields to default values.
- frm.freeze(message?): Freeze the form UI.
- frm.unfreeze(): Unfreeze the form UI.
- frm.metadata: Access arbitrary data injected by the host application (type: any).
`;

const FIELD_TYPE_CATALOG = `
Vant Flow Field Type Reference — All supported fieldtypes and their configuration properties.
Use this when generating a DocumentDefinition to always pick the correct fieldtype and props.

== COMMON FIELD PROPERTIES (apply to all fields) ==
- id: string (unique, e.g. "f_inspector") [REQUIRED]
- fieldname: string (snake_case, unique across form, e.g. "inspector_name") [REQUIRED]
- label: string (display label) [REQUIRED]
- fieldtype: FieldType (see below) [REQUIRED]
- mandatory: boolean | 1 | 0 — marks field as required
- read_only: boolean — prevents user input
- hidden: boolean — hides field from UI
- placeholder: string — input hint text
- description: string — shown below field
- default: any — pre-filled default value
- depends_on: string — JS expression e.g. "doc.status == 'Active'" to conditionally show
- data_group: string — groups file data for Attach/Signature fields (e.g. "files")

== FIELD TYPES ==

1. Data
   Simple single-line text input.
   Extra props: regex (string, validation pattern e.g. "^[A-Z]{2}-\\d{4}$")
   Example: { "fieldtype": "Data", "regex": "^QC-[A-Z]{2}-[0-9]{4}$", "description": "Format: QC-AA-0000" }

2. Text
   Multi-line plain text (textarea).
   Example: { "fieldtype": "Text", "placeholder": "Describe the issue..." }

3. Text Editor
   Rich HTML text editor (Quill editor).
   Example: { "fieldtype": "Text Editor" }

4. Int
   Integer number input.
   Example: { "fieldtype": "Int", "default": 0 }

5. Float
   Decimal number input.
   Example: { "fieldtype": "Float", "placeholder": "0.00" }

6. Select
   Dropdown with fixed options.
   REQUIRED extra prop: options (newline-separated string e.g. "Option A\nOption B\nOption C")
   Extra props: default (string, must match one of the options)
   Example: { "fieldtype": "Select", "options": "Morning\nAfternoon\nNight", "default": "Morning" }

7. Check
   Boolean checkbox (true/false). Stores 1 or 0.
   Example: { "fieldtype": "Check", "default": 0, "label": "I agree to terms" }

8. Date
   Date-only picker.
   Example: { "fieldtype": "Date", "mandatory": true }

9. Datetime
   Date + time picker.
   Example: { "fieldtype": "Datetime", "mandatory": true }

10. Time
    Time-only picker (HH:mm format).
    Example: { "fieldtype": "Time", "mandatory": true }

11. Password
    Masked text input.
    Example: { "fieldtype": "Password" }

12. Link
    Reference/relation-style selector input.
    Extra props: options (string, name of the linked doctype or dataset)
    Example: { "fieldtype": "Link", "options": "Employee" }

13. Attach
    File upload widget. Can limit file types, count, and size.
    Extra props: options (string in format "<mime> | <maxSize> | <maxCount>", e.g. ".pdf,.doc | 10MB | 3" or "image/* | 5MB | 5")
    IMPORTANT: Set data_group: "files" for all Attach fields.
    Example: { "fieldtype": "Attach", "options": ".pdf,.docx | 10MB | 3", "data_group": "files" }

14. Signature
    Touchscreen/mouse signature capture pad.
    IMPORTANT: Set data_group: "files" for all Signature fields.
    Example: { "fieldtype": "Signature", "mandatory": true, "data_group": "files" }

15. Button
    Clickable button rendered inside the form body (triggers client script).
    Example: { "fieldtype": "Button", "label": "Calculate Total" }

16. Table
    Repeating data grid (sub-table). Stores an array of row objects.
    REQUIRED extra prop: table_fields (array of column definitions, each with id, fieldname, label, fieldtype)
    table_fields support: Data, Select, Check, Int, Float, Date, Time, Text, Attach — NOT another Table.
    Example:
    {
      "fieldtype": "Table",
      "label": "Line Items",
      "table_fields": [
        { "id": "tc_1", "fieldname": "item_name", "label": "Item", "fieldtype": "Data", "mandatory": true },
        { "id": "tc_2", "fieldname": "qty", "label": "Qty", "fieldtype": "Int" },
        { "id": "tc_3", "fieldname": "unit_price", "label": "Unit Price", "fieldtype": "Float" },
        { "id": "tc_4", "fieldname": "status", "label": "Status", "fieldtype": "Select", "options": "Pending\nApproved\nRejected", "default": "Pending" }
      ]
    }

== DOCUMENT-LEVEL PROPERTIES ==
- name: string — Human-readable form title [REQUIRED]
- module: string — Business module name (e.g. "HR", "Finance", "Quality Management")
- version: string — Semantic version (e.g. "1.0.0")
- description: string — Brief form purpose
- intro_text: string — Top banner HTML text (supports <b>, <i> tags)
- intro_color: "blue" | "orange" | "red" | "gray"
- is_stepper: boolean — Enables multi-step wizard mode (uses 'steps' instead of 'sections')
- metadata: object — Arbitrary metadata (e.g. { is_ai_generated: true })
- actions.save: { label, visible, type } — Save draft button
- actions.submit: { label, visible, type } — Final submit button
- client_script: string — JavaScript executed in the form context (frm.on(...))

== SECTION PROPERTIES ==
- id: string [REQUIRED]
- label: string [REQUIRED]
- columns_count: 1 | 2 | 3 — splits section into columns
- columns: DocumentColumn[] — each column has id and fields[]
- collapsible: boolean
- collapsed: boolean
- depends_on: string
`;

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // --- AI Magic Tools ---
            {
                name: "create_form_from_prompt",
                description: "[MAGIC] Generate a Vant Flow form from a natural language prompt. In the Inspector, this uses 'Smart Templates'. For actual AI Agents, this is the primary design entry point.",
                inputSchema: {
                    type: "object",
                    properties: {
                        prompt: { type: "string", description: "Describe the form (e.g. '3-step onboarding')" }
                    },
                    required: ["prompt"],
                },
            },

            // --- Context & Discovery ---
            {
                name: "get_models",
                description: "Get the complete TypeScript interfaces and scripting API docs for Vant Flow's frm context API.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "get_field_types",
                description: "Get the complete Vant Flow field type catalog — all supported fieldtypes, their configurable properties, valid values, and JSON examples. ALWAYS call this first before generating any form schema to ensure correctness.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "analyze_schema",
                description: "AI-powered summary of a Vant schema's purpose, fields, and logic.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object", description: "The DocumentDefinition to analyze" }
                    },
                    required: ["schema"],
                },
            },
            {
                name: "describe_schema",
                description: "[REVERSE MAGIC] Generate a natural language explanation of a Vant schema's purpose and functionality.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object", description: "The DocumentDefinition to describe" }
                    },
                    required: ["schema"],
                },
            },

            // --- Structural Design (Granular) ---
            {
                name: "scaffold_from_blueprint",
                description: "Scaffold a complete Vant Flow form using a structured 'Blueprint'. Best for complex, high-fidelity AI generations.",
                inputSchema: {
                    type: "object",
                    properties: {
                        blueprint: { type: "object", required: ["title"] }
                    },
                    required: ["blueprint"],
                },
            },
            {
                name: "add_step",
                description: "Add a new step to a multi-step form.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                        title: { type: "string" },
                        description: { type: "string" }
                    },
                    required: ["schema", "title"],
                },
            },
            {
                name: "add_section",
                description: "Add a section to a form or specific step.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                        label: { type: "string" },
                        stepId: { type: "string" },
                        props: { type: "object" }
                    },
                    required: ["schema", "label"],
                },
            },
            {
                name: "add_field",
                description: "Add a field to a specific section.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                        sectionId: { type: "string" },
                        label: { type: "string" },
                        fieldtype: { type: "string" },
                        props: { type: "object" }
                    },
                    required: ["schema", "sectionId", "label", "fieldtype"],
                },
            },
            {
                name: "update_field",
                description: "Granularly update field properties (mandatory, read_only, options, regex, etc).",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                        fieldname: { type: "string" },
                        props: { type: "object" }
                    },
                    required: ["schema", "fieldname", "props"],
                },
            },

            // --- Logic & Config ---
            {
                name: "update_client_script",
                description: "Set or update the form's client-side JavaScript logic.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                        script: { type: "string" }
                    },
                    required: ["schema", "script"],
                },
            },
            {
                name: "configure_actions",
                description: "Update the form's Save/Submit button behavior and labels.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                        actions: { type: "object" }
                    },
                    required: ["schema", "actions"],
                },
            },
            {
                name: "set_intro",
                description: "Configure the top intro banner (text and color).",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                        text: { type: "string" },
                        color: { type: "string", enum: ["blue", "orange", "red", "gray"] }
                    },
                    required: ["schema", "text"],
                },
            },

            // --- Verification ---
            {
                name: "generate_mock_data",
                description: "Generate mock JSON data to verify validations and logic.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                    },
                    required: ["schema"],
                },
            },
            {
                name: "verify_schema",
                description: "Run a structural integrity check on the schema.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object" },
                    },
                    required: ["schema"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "get_models":
                return { content: [{ type: "text", text: `Vant Flow frm Scripting API:\n${FRM_API_DOCS}\n\nFor field type reference, call the 'get_field_types' tool.` }] };

            case "get_field_types":
                return { content: [{ type: "text", text: FIELD_TYPE_CATALOG }] };

            case "create_form_from_prompt": {
                // This tool provides the AI with the full field type reference + instructions.
                // An AI agent should use this context to then construct the schema as JSON directly,
                // NOT use hardcoded templates. The get_field_types catalog is the source of truth.
                const promptText = (args as any).prompt;
                const guidance = `You have been asked to create a Vant Flow form for: "${promptText}"

Here is the complete Vant Flow field type and document reference — the SINGLE SOURCE OF TRUTH:

${FIELD_TYPE_CATALOG}

Instructions:
1. Analyze the user's prompt carefully. Identify the domain, entities, and data fields required.
2. Design a rich, multi-section DocumentDefinition with correct fieldtypes.
3. Use Select with meaningful options, Table with typed columns, Attach/Signature where applicable.
4. Set columns_count: 2 for header info sections to use space efficiently.
5. Write a relevant intro_text and customize actions.submit label for the domain.
6. Set metadata.is_ai_generated = true.
7. Return ONLY valid DocumentDefinition JSON — no markdown, no explanation.`;
                return { content: [{ type: "text", text: guidance }] };
            }

            case "analyze_schema": {
                const s = (args as any).schema;
                const steps = s.steps?.length || 0;
                const sections = s.steps ? s.steps.flatMap((step: any) => step.sections).length : s.sections?.length || 0;
                const scriptLines = s.client_script?.split('\n').length || 0;
                return {
                    content: [{
                        type: "text",
                        text: `Schema Analysis:
- Type: ${s.is_stepper ? 'Stepper' : 'Standard'}
- Depth: ${steps} Steps, ${sections} Sections
- Logic: ${scriptLines} lines of client script
- Key Fields: ${JSON.stringify(s.name)} ${s.module ? 'in module ' + s.module : ''}`
                    }]
                };
            }

            case "describe_schema": {
                const s = (args as any).schema;
                const description = builder.generateSummary(s);
                return {
                    content: [{
                        type: "text",
                        text: description
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
                const { schema, text, color } = args as any;
                schema.intro_text = text;
                schema.intro_color = color || "blue";
                return { content: [{ type: "text", text: JSON.stringify(schema, null, 2) }] };
            }

            case "generate_mock_data": {
                const data = mockGen.generateData((args as any).schema);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            }

            case "verify_schema": {
                const s = (args as any).schema;
                const errors = [];
                if (!s.name) errors.push("Missing form name");
                if (s.is_stepper && (!s.steps || s.steps.length === 0)) errors.push("Stepper form must have steps");
                return {
                    content: [{
                        type: "text",
                        text: errors.length > 0 ? "Errors found:\n- " + errors.join('\n- ') : "Schema is structurally valid."
                    }]
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
