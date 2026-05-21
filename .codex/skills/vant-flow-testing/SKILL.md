---
name: vant-flow-testing
description: Test strategy for Vant Flow platform changes. Use when modifying builder state, property editing, renderer lifecycle, frm APIs, field rendering, host integrations, stepper behavior, schema packing, or example-driven regression coverage in the Vant Flow library.
---

# Vant Flow Testing

Use this skill whenever behavior changes. Vant Flow changes should usually land with spec updates in the same area.

## Start Here

1. Read `references/test-matrix.md`.
2. Read `references/test-commands.md`.
3. Update the smallest set of specs that prove the changed behavior end to end.

## Coverage Rules

- Field-specific UI behavior belongs in `form-field.component.spec.ts`.
- Form lifecycle, validation, packing, host inputs, and action emission belong in `form-renderer.component.spec.ts`.
- `frm` APIs, event hooks, stepper logic, and runtime state belong in `form-context.spec.ts`.
- Schema authoring mutations belong in `builder-state.service.spec.ts`.
- Property editing behavior belongs in `property-editor.component.spec.ts`.
- Builder shell and preview metadata behavior belong in `builder-container.component.spec.ts`.

## What Good Coverage Looks Like

- Assert behavior, not just implementation details.
- Cover both the schema mutation and the runtime effect when a change spans builder and renderer.
- Add regression tests for bugs, especially around hidden fields, validation, table behavior, stepper transitions, and host overrides.
- If a feature is driven by metadata or host callbacks, test both the default path and the overridden path.

## Done Criteria

- Relevant specs were added or updated.
- The appropriate test command was run when possible.
- If tests could not be run, note that clearly and explain why.
