# Builder Surface Map

## Core Files

- `projects/vant-flow/src/lib/services/builder-state.service.ts`
  Central schema mutation logic.
- `projects/vant-flow/src/lib/components/builder/builder-container.component.ts`
  Builder shell, tabs, mode switching, schema loading, preview metadata editor, and schemaChange emission.
- `projects/vant-flow/src/lib/components/builder/property-editor.component.ts`
  Document, section, step, field, and table-column authoring UI.
- `projects/vant-flow/src/lib/components/builder/field-palette.component.ts`
  Entry point for what authors can add.
- `projects/vant-flow/src/lib/components/builder/script-editor.component.ts`
  Script snippets, hints, and `frm` type guidance.
- `projects/vant-flow/src/lib/components/builder/canvas-*.ts`
  Canvas layout and drag-drop behavior.

## Builder Responsibilities

- Document metadata editing
- Stepper mode authoring
- Section and column layout
- Field creation and editing
- Table column authoring
- Script editing
- Preview mode using the live renderer
- Preview metadata input that does not mutate the saved schema

## Common Change Routes

- Need a new authorable property:
  update `property-editor.component.ts` and `builder-state.service.ts`
- Need a new default field label or naming behavior:
  update `builder-state.service.ts`
- Need a palette change:
  update model palette metadata and any builder palette UI
- Need preview-only changes:
  update `builder-container.component.ts` and verify `VfRenderer`
