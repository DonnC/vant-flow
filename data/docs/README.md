# Vant Flow Documentation

This folder documents how `vant-flow` works from the code that exists in this repository today.

## Documents

- [Architecture Overview](./architecture-overview.md)
- [Builder Architecture](./builder-architecture.md)
- [Renderer Architecture](./renderer-architecture.md)
- [MCP Architecture](./mcp-architecture.md)
- [Example Showcase Architecture](./example-showcase-architecture.md)
- [Business Use Cases](./business-use-cases.md)

## Scope

These docs cover:

- The core library in `projects/vant-flow`
- The MCP server in `projects/vant-mcp`
- The example implementation in `examples/kai-ng-flow`
- The AI-assisted and storage-backed workflows demonstrated in the repo

## Core Idea

Vant Flow separates form delivery into two layers:

1. A schema-driven builder that produces a `DocumentDefinition`
2. A renderer that executes that document, form state, validation rules, and client scripts at runtime

That split is what gives developers freedom:

- Ship the renderer once and update forms from data
- Change layout, fields, step flows, and actions without redeploying UI code
- Keep business behavior dynamic through client scripts and injected metadata
- Reuse one rendering engine across very different business processes
