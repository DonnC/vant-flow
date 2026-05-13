---
name: vant-flow-builder
description: Builder authoring workflow guidance for Vant Flow. Use when working on VfBuilder, VfBuilderState, property editor behavior, palette options, schema import or export, preview mode, preview metadata, or script-authoring surfaces in the builder UI.
---

# Vant Flow Builder

Use this skill for the schema-authoring side of the platform.

## Start Here

1. Read `references/builder-surface-map.md`.
2. Inspect the active files:
   - `projects/vant-flow/src/lib/services/builder-state.service.ts`
   - `projects/vant-flow/src/lib/components/builder/builder-container.component.ts`
   - `projects/vant-flow/src/lib/components/builder/property-editor.component.ts`
   - `projects/vant-flow/src/lib/components/builder/script-editor.component.ts`
3. If preview behavior is affected, also inspect `VfRenderer`.

## Builder Rules

- Keep builder state as the source of truth for schema mutations.
- Prefer adding authoring affordances to the property editor before inventing raw JSON-only configuration.
- Preserve auto-fieldname behavior unless the task intentionally changes naming rules.
- Preserve the distinction between persisted schema metadata and preview-only runtime metadata.
- If a builder feature changes what authors can configure, confirm the runtime actually honors it.

## Stepper And Layout Rules

- When changing sections, columns, or steps, verify both flat-form and stepper paths.
- Keep selection state stable when parent components echo the current schema back into the builder.
- If a builder affordance changes layout semantics, verify preview mode still reflects it through the live renderer.

## Script Authoring Rules

- Keep builder script snippets aligned with real `frm` APIs.
- Honor `showScriptEditor` so host apps can disable script authoring without disabling the rest of the builder.

## Done Criteria

- Builder state mutations remain centralized and predictable.
- Property editing, preview, and export all reflect the new behavior.
- Builder-facing specs cover the changed workflow.
