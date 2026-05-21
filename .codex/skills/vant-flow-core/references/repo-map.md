# Repo Map

## Library

- `projects/vant-flow/src/lib/models/document.model.ts`
  Source of truth for field types, schema contracts, action config, media contracts, and link contracts.
- `projects/vant-flow/src/lib/components/form-field.component.ts`
  Field-level rendering and field-specific runtime behavior such as Link, Attach, Signature, Text Editor, and validation visuals.
- `projects/vant-flow/src/lib/components/form-renderer/form-renderer.component.ts`
  Form lifecycle, init, depends-on evaluation, validation, stepper navigation, action emission, and payload packing.
- `projects/vant-flow/src/lib/services/form-context.ts`
  `frm` runtime API for scripts, runtime state, dynamic actions, prompts, links, and step control.
- `projects/vant-flow/src/lib/services/builder-state.service.ts`
  Builder schema mutations, field naming, sections, steps, columns, and table-column authoring.
- `projects/vant-flow/src/lib/components/builder/*`
  Authoring shell, property editor, field palette, script editor, and preview integration.
- `projects/vant-flow/src/public-api.ts`
  Public export surface. Review when adding reusable library contracts or components.

## Example App

- `examples/kai-ng-flow/src/app/demo-pages/*`
  Real host usage across landing, admin, builder, renderer, and user flows.
- `examples/kai-ng-flow/src/app/core/services/*`
  AI scaffolding, mock storage, and demo media integration examples.
- `examples/kai-ng-flow/proxy/*`
  Demo backend and AI/MCP proxy behaviors.

## Docs And Samples

- `README.md`
  Main product-level usage, integration examples, and feature documentation.
- `data/docs/architecture-overview.md`
  Cross-platform architecture.
- `data/docs/builder-architecture.md`
  Authoring-side details.
- `data/docs/renderer-architecture.md`
  Runtime-side details.
- `data/examples/*.json`
  Real schema examples for regression checks and feature discovery.

## MCP

- `projects/vant-mcp/*`
  AI helper tooling for schema generation and validation. Touch this when a schema contract change also affects AI-assisted tooling.
