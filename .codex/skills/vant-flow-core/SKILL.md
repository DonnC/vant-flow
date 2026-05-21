---
name: vant-flow-core
description: Architecture and feature map for the Vant Flow Angular form platform. Use when working on DocumentDefinition schemas, builder or renderer behavior, VfFormContext logic, host integrations, example app flows, or when you need repo-specific context before changing the platform.
---

# Vant Flow Core

Use this skill to orient on how Vant Flow works before changing code.

## Quick Start

1. Read `references/repo-map.md` to find the correct layer.
2. Read `references/feature-map.md` if the task changes platform behavior, schema features, or public capabilities.
3. Read the matching project docs only for the active layer:
   - `data/docs/architecture-overview.md` for cross-cutting work
   - `data/docs/builder-architecture.md` for authoring UX
   - `data/docs/renderer-architecture.md` for runtime behavior
4. Inspect the exact source files before editing.

## Platform Model

Treat Vant Flow as one schema-driven platform with four cooperating layers:

- `projects/vant-flow/src/lib/models/document.model.ts` defines the schema and runtime contracts.
- `projects/vant-flow/src/lib/components/builder/*` and `services/builder-state.service.ts` author that schema.
- `projects/vant-flow/src/lib/components/form-renderer/*`, `form-field.component.ts`, and `services/form-context.ts` execute that schema.
- `examples/kai-ng-flow/*` demonstrates real host usage, preview flows, AI scaffolding, and persistence patterns.

Prefer changes that preserve that separation. Do not bury host-owned concerns inside the schema layer when they belong to renderer inputs or host callbacks.

## Core Invariants

- Keep builder and renderer aligned around the same `DocumentDefinition`.
- Preserve backward compatibility for existing field types and persisted schemas unless the user explicitly asks for a breaking change.
- Keep `frm` APIs additive and consistent with the existing Frappe-like naming style.
- Keep host-owned integrations host-owned: uploads, downloads, remote lookups, auth, storage, workflow APIs, and route context should stay outside the library unless they are exposed as contracts.
- If a change affects user-facing capabilities, update the relevant README or example JSON so the feature remains discoverable.

## Change Routing

- Use `vant-flow-add-field` when adding a new field type, a new field property, or changing how a field behaves across builder and renderer.
- Use `vant-flow-runtime` for `VfRenderer`, `VfFormContext`, `frm` APIs, actions, validation, link fields, media hooks, or metadata-driven behavior.
- Use `vant-flow-builder` for builder state, property editor, preview mode, schema import/export, or authoring interactions.
- Use `vant-flow-testing` whenever behavior changes and tests need to be added or updated.

## Done Criteria

- The correct layer was changed instead of patching symptoms elsewhere.
- Related builder, renderer, and runtime surfaces stay in sync.
- Public exports in `projects/vant-flow/src/public-api.ts` still make sense.
- Specs cover the changed behavior.
- Library docs or examples were updated if the feature changed how Vant Flow is used.
