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
`;

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // --- Context & Discovery ---
            {
                name: "get_models",
                description: "Get the complete TypeScript interfaces and scripting API docs for Vant Flow.",
                inputSchema: { type: "object", properties: {} },
            },
            {
                name: "analyze_schema",
                description: "Provide a natural language summary of a Vant schema's purpose, fields, and logic.",
                inputSchema: {
                    type: "object",
                    properties: {
                        schema: { type: "object", description: "The DocumentDefinition to analyze" }
                    },
                    required: ["schema"],
                },
            },

            // --- Structural Design ---
            {
                name: "scaffold_form",
                description: "Scaffold a complete Vant Flow form using a 'Blueprint'.",
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
                return { content: [{ type: "text", text: `Models & API:\n${FRM_API_DOCS}` }] };

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

            case "scaffold_form": {
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
