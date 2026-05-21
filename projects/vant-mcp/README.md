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

## Internal Deployment

For an internal organization setup, the usual deployment model is:

1. Build the MCP server once:
```bash
cd projects/vant-mcp
npm install
npm run build
```

2. Run it as a long-lived internal service in `sse` mode:
```bash
TRANSPORT=sse PORT=3001 node dist/index.js
```

3. Put it behind your internal reverse proxy if needed.

Typical internal URL examples:
- `http://mcp.internal.example/sse`
- `http://10.0.10.15:3001/sse`
- `http://internal-tools.company.local/vant-mcp/sse`

The example proxy or any other internal client then points `MCP_SERVER_URL` at that hosted endpoint.

### What a production-style internal setup usually includes
- process manager such as `systemd`, PM2, Docker, or Kubernetes
- internal DNS name for the MCP service
- reverse proxy in front of the SSE endpoint when needed
- centralized logs
- environment-managed secrets and runtime config

### Minimal systemd-style example
```ini
[Unit]
Description=Vant Flow MCP Server
After=network.target

[Service]
WorkingDirectory=/opt/vant-flow/projects/vant-mcp
Environment=TRANSPORT=sse
Environment=PORT=3001
ExecStart=/usr/bin/node /opt/vant-flow/projects/vant-mcp/dist/index.js
Restart=always
User=vant

[Install]
WantedBy=multi-user.target
```

The exact service manager is not important. What matters is that the MCP becomes a stable internal HTTP endpoint your AI-facing apps can call.

## If MCP Is Deployed Remotely, Does The Example Change?

Usually, only configuration changes.

The example app does not need a different architecture just because MCP is hosted elsewhere. In the current example, you normally only change:
- `MCP_SERVER_URL`

For example:
```env
MCP_SERVER_URL=http://mcp.internal.example/sse
```

The rest of the example can stay the same if:
- the remote MCP is reachable from the proxy
- the transport is compatible
- the tool names and contracts remain the same

You would only need code changes if:
- your org uses a different auth model
- your org wraps MCP behind another gateway
- your org wants a different orchestration strategy than the example proxy

## How Tool Calling Works

There are two valid patterns, and they are different:

### 1. Explicit orchestration
This is what the current example does.

The example proxy manually decides which MCP tools to call and in what order. For example:
- call `get_capabilities`
- call `get_models`
- call `get_field_types`
- call `create_form_from_prompt`
- call `verify_schema`

This is why the example contains explicit `callTool(...)` logic in its MCP client layer.

Why this is useful:
- deterministic and easy to debug
- simple to log
- good for demos and controlled product flows
- easier for app developers to reason about

### 2. Agent-driven tool use
In a more autonomous setup, the AI model itself can decide when to call MCP tools during a conversation.

That pattern looks more like:
- user asks for a form
- agent inspects available MCP tools
- agent decides which tool to call
- agent may call several tools over multiple turns
- agent returns a result after tool use

Why this is useful:
- more flexible
- better for open-ended assistant experiences
- closer to a true tool-using AI agent

But it also introduces:
- less deterministic orchestration
- more complex observability
- more complexity around safety, retries, and cost control

## Which Model Does This Repo Use?

Right now:
- `projects/vant-mcp` is a tool server
- `examples/kai-ng-flow/proxy` is an explicit orchestrator

So the current example is not "the AI automatically decides all MCP tool calls at runtime."
Instead, the example proxy chooses a controlled sequence of MCP calls on purpose.

That is a good example pattern for product teams because it is easier to understand, replace, and operate internally.

## Notes
- The MCP is intentionally domain-agnostic. It knows Vant structure, not a specific business industry.
- Image and PDF interpretation should happen outside MCP and then feed structured requirements into MCP tools.
- This project does not change core Vant behavior. It exposes and validates what core Vant already supports.
