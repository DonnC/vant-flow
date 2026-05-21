---
name: vant-flow-add-field
description: End-to-end workflow for adding a new Vant Flow field type or extending an existing field contract. Use when changing FieldType, DocumentField or table-column props, builder property surfaces, renderer field rendering, form-context behavior, schema examples, or tests related to field capabilities.
---

# Vant Flow Add Field

Use this skill when the task adds a field, expands field props, or changes a field's runtime behavior.

## Workflow

1. Read `references/add-field-checklist.md`.
2. Read `references/field-capability-matrix.md` to see where the current field already participates.
3. Inspect the existing field implementation in:
   - `projects/vant-flow/src/lib/models/document.model.ts`
   - `projects/vant-flow/src/lib/components/form-field.component.ts`
   - `projects/vant-flow/src/lib/components/builder/property-editor.component.ts`
   - `projects/vant-flow/src/lib/services/builder-state.service.ts`
   - `projects/vant-flow/src/lib/components/form-renderer/form-renderer.component.ts`
4. Update tests and examples before finishing.

## Non-Negotiable Rule

Do not treat a field addition as a one-file change. A real Vant Flow field spans schema authoring, preview, runtime rendering, packing or validation rules when applicable, and documentation or example coverage.

## Property Changes

If the task adds a new prop rather than a whole field type:

- add it to the right schema interface in `document.model.ts`
- decide whether it belongs on `DocumentField`, `TableColumnDef`, or a nested config object
- expose it in the builder only when schema authors should control it
- update runtime handling only where that prop matters
- add focused tests for both schema state and runtime impact

## Table Awareness

When a field is allowed inside `Table`, check both:

- the `TableColumnDef` type restrictions
- compact rendering and row-edit behavior in the renderer

If the new field should not be allowed in tables, keep it out of `tableChildTypes` and document that decision.

## Completion Standard

- The new or changed field can be authored in the builder if appropriate.
- The field renders correctly in runtime and preview.
- Validation and packing still behave correctly.
- Example schemas or README snippets show the capability if it changes product usage.
- Specs cover the new path.
