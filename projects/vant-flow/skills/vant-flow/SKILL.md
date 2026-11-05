---
name: vant-flow
description: Build, integrate, script, and troubleshoot Vant Flow Angular forms and visual builders. Use for DocumentDefinition schemas, frm scripts, tables, media hooks, remote lookups, editor support, and Vant library maintenance.
metadata:
  version: 1.0.0
  vant-flow-version: 1.1.2
---

# Vant Flow

Start by checking the application's installed `vant-flow` version and Angular peer dependencies. This skill describes Vant Flow 1.1.2. For another version, inspect its installed declarations before using an API. A schema's `version` is not the installed library version.

Determine whether the task concerns a consuming application or a Vant source checkout. In an application, use public exports and host callbacks. In a source checkout, read its AGENTS.md and the relevant maintainer skills before editing the library.

## Choose the relevant reference

- Integration, schemas, fields, builder preview, and detached scripts: [integration.md](references/integration.md).
- Events, metadata, readonly state, tables, links, media, and editor troubleshooting: [runtime.md](references/runtime.md).
- Exact schema properties, exported contracts, renderer/builder bindings, public form context signatures, and editor snippets: [contracts.md](references/contracts.md). This is generated from source, not a speculative API list.
- Adding library features, optional presets, MCP workflows, and verification: [maintenance.md](references/maintenance.md).
- A typed Angular integration example: [integration.ts](examples/integration.ts).
- Typed media, link, and editor namespace examples: [host-callbacks.ts](examples/host-callbacks.ts).

For detailed behavior, consult the bundled source documentation as needed: [renderer](references/docs/renderer-architecture.md), [builder](references/docs/builder-architecture.md), [architecture](references/docs/architecture-overview.md), [MCP](references/docs/mcp-architecture.md), and [business examples](references/docs/business-use-cases.md). Example JSON schemas are under `examples/schemas/`.

## Essential decisions

- The builder authors `DocumentDefinition`; the renderer executes it. Preserve section/column/field nesting and stable ids/fieldnames.
- `Url` is a remote lookup; `Link` relates to another document. `JSONTable` holds inline rows; `ChildTable` identifies a child document. Do not invent a storage backend for these fields.
- Persist schema metadata separately from host runtime `metadata`. The host owns authentication, authorization, storage, routing, and backend calls. Hiding a field is UI behavior, not server authorization.
- Host callbacks must return the documented shapes. Check generated contracts before suggesting an input, output, option, or `frm` method.
- Scripts are executable application code. Inspect the actual HTML/script rendering policy before describing it as sanitized or isolated. Do not execute untrusted supplied code as part of reading a schema.
- Keep Baobab helpers behind the optional `vant-flow/baobab` entry point. Ordinary Vant integrations do not require Baobab.

When delivering a change, verify the relevant schema and runtime behavior, report the commands actually run, and distinguish observed results from assumptions. Do not claim a build or test succeeded without evidence.
