# Vant Flow — Documentation

This index is organized by what you are trying to do. Pick your path.

---

## I want to use the library in my app

1. **[README → Quick Start](../../README.md#quick-start)** — install, register, render your first form in 5 minutes
2. **[README → Core Concepts](../../README.md#core-concepts)** — understand `DocumentDefinition`, the `frm` API, and host inputs
3. **[Renderer Architecture](renderer-architecture.md)** — deep reference for all renderer inputs, outputs, and hook points
4. **[Business Use Cases](business-use-cases.md)** — real-world patterns: approvals, KYC, inspections, work orders

**Sample schemas to import and experiment with:**

- [`field-service-work-order.json`](../examples/field-service-work-order.json)
- [`example-stepper-onboarding.json`](../examples/example-stepper-onboarding.json)
- [`inspection-report.json`](../examples/inspection-report.json)
- [`example-signature-attach.json`](../examples/example-signature-attach.json)

---

## I want to understand how it is built

1. **[Architecture Overview](architecture-overview.md)** — the full platform: library, renderer, builder, frm context, MCP
2. **[Renderer Architecture](renderer-architecture.md)** — how the renderer evaluates schema, scripts, and host inputs
3. **[Builder Architecture](builder-architecture.md)** — how the visual builder works and how schemas are authored
4. **[Example Showcase Architecture](example-showcase-architecture.md)** — how the reference app is structured
5. **[MCP Architecture](mcp-architecture.md)** — how the MCP server exposes Vant Flow to AI agents

---

## I want to contribute

1. **[CONTRIBUTING.md](../../CONTRIBUTING.md)** — setup, repo orientation, PR checklist, commit conventions
2. **[Architecture Overview](architecture-overview.md)** — understand the full system before diving into code
3. **[Builder Architecture](builder-architecture.md)** or **[Renderer Architecture](renderer-architecture.md)** — dive into the area you are working on

---

## I want to integrate AI or MCP tooling

1. **[MCP Architecture](mcp-architecture.md)** — how the MCP server is structured and how to add tools
2. **[Architecture Overview](architecture-overview.md)** — how `vant-mcp` sits alongside the library
3. **[Example Showcase Architecture](example-showcase-architecture.md)** — how the demo proxy connects AI to the builder

---

## All documents

| Document | Description |
|---|---|
| [Architecture Overview](architecture-overview.md) | Full platform architecture |
| [Builder Architecture](builder-architecture.md) | Visual schema builder internals |
| [Renderer Architecture](renderer-architecture.md) | Runtime renderer, inputs, hooks, and scripting |
| [MCP Architecture](mcp-architecture.md) | AI/MCP server tooling |
| [Example Showcase Architecture](example-showcase-architecture.md) | Reference application structure |
| [Business Use Cases](business-use-cases.md) | Real-world pattern reference |
