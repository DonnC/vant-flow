# @vant-flow/mcp

The Vant Flow MCP Server is a Model Context Protocol implementation that turns Vant Flow into an agent-aware UI framework. It allows AI systems to work against the same schema vocabulary that powers the core Vant builder and renderer.

## Agentic UI
Instead of returning vague UI suggestions, this MCP emits valid Vant `DocumentDefinition` JSON and exposes discovery tools so agents can learn what Vant actually supports before generating anything.

Key strengths:
- stepper-aware form generation
- schema-aware scripting guidance through the `frm` API docs
- table, link, attach, and signature field support
- structural schema verification
- mock payload generation for QA and previews

## Whole Vant Toolset
The MCP server is organized around a build-verify-refine workflow.

### 1. Context and Discovery
- `get_capabilities`: One-call JSON snapshot of MCP tools, workflows, and schema rules.
- `get_models`: Vant schema model, `frm` API, renderer contract, and builder authoring rules.
- `get_field_types`: Full field catalog and field-level config reference.
- `get_renderer_contract`: Runtime renderer inputs, outputs, and payload behavior.
- `get_builder_contract`: Builder authoring and preview contract.
- `get_example_schemas`: Advanced schema patterns from the demo app.
- `analyze_schema`: Natural-language schema summary plus detected issues.
- `describe_schema`: Business-friendly schema explanation.
- `verify_schema`: Structural integrity check with `valid`, `issues`, `summary`, and `issueCount`.

### 2. Structured Form Creation
- `create_form_from_prompt`: Generate a Vant form from a natural-language prompt.
- `scaffold_from_blueprint`: Build a schema from a structured blueprint.

### 3. Incremental Schema Editing
- `add_step`
- `add_section`
- `add_field`
- `update_field`
- `update_client_script`
- `configure_actions`
- `set_intro`

### 4. Simulation
- `generate_mock_data`: Generates mock data closer to renderer output, including nested `data_group` paths.

## How to Test

### 1. Install and Build
```bash
cd projects/vant-mcp
npm install
npm run build
```

### 2. Run with MCP Inspector
Run this from `projects/vant-mcp`:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### 3. Recommended Client Workflow
1. Call `get_capabilities` first.
2. Call `get_models`, `get_field_types`, or the contract tools when the client needs deeper Vant awareness.
3. Use `create_form_from_prompt` for direct prompt-to-schema generation.
4. Use `scaffold_from_blueprint` when another AI has already extracted structured requirements from an image, PDF, or conversation.
5. Use `verify_schema` after generation instead of duplicating schema validation rules in the client.

## Notes
- The MCP is intentionally domain-agnostic. It knows Vant structure, not a specific business industry.
- Image and PDF interpretation should happen outside MCP and then feed structured requirements into MCP tools.
- This project does not change core Vant behavior. It exposes and validates what core Vant already supports.
