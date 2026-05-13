# Test Matrix

## Specs By Responsibility

- `projects/vant-flow/src/lib/components/form-field.component.spec.ts`
  Use for field interactions such as file selection, camera capture, async field UI, compact display, or field-level validation visuals.
- `projects/vant-flow/src/lib/components/form-renderer/form-renderer.component.spec.ts`
  Use for initialization, host overrides, form action emission, packing, validation, stepper navigation entry points, and metadata wiring.
- `projects/vant-flow/src/lib/services/form-context.spec.ts`
  Use for `frm` APIs, runtime events, button state, step transitions, metadata access, link refreshes, and reset logic.
- `projects/vant-flow/src/lib/services/builder-state.service.spec.ts`
  Use for document mutation rules, selection behavior, fieldname generation, import behavior, and move operations.
- `projects/vant-flow/src/lib/components/builder/property-editor.component.spec.ts`
  Use for property-editor-driven mutations and fieldname sync behavior.
- `projects/vant-flow/src/lib/components/builder/builder-container.component.spec.ts`
  Use for preview mode, preview metadata behavior, schema reload behavior, and `showScriptEditor`.

## High-Risk Areas Worth Explicit Coverage

- New field types or field props
- `depends_on` and `mandatory_depends_on`
- `data_group` payload packing
- Renderer host override arrays
- `runFormScripts`
- `frm.validate()` recursion safety
- Stepper skip and cancel behavior
- Link filters and refresh signals
- Attach and signature media flows
