---
name: vant-flow-runtime
description: Renderer, frm scripting, validation, actions, and host integration guidance for Vant Flow. Use when working on VfRenderer, VfFormContext, client-script behavior, metadata-driven logic, action buttons, link field loading, media handlers, or runtime field and section state.
---

# Vant Flow Runtime

Use this skill for changes that happen after a schema is already authored and being executed.

## Start Here

1. Read `references/runtime-api-matrix.md`.
2. Read `references/host-integration-checklist.md` if the task touches renderer inputs, host callbacks, media handlers, or remote link loading.
3. Inspect:
   - `projects/vant-flow/src/lib/components/form-renderer/form-renderer.component.ts`
   - `projects/vant-flow/src/lib/services/form-context.ts`
   - `projects/vant-flow/src/lib/components/form-field.component.ts`

## Runtime Design Rules

- Put per-field UI behavior in `VfField`.
- Put form lifecycle, payload packing, full-form validation, and host-facing outputs in `VfRenderer`.
- Put script APIs and runtime state mutation in `VfFormContext`.
- Prefer host inputs and callbacks for page-level workflow state. Prefer `frm` for dynamic in-form reactions.

## Validation Rules

- Preserve built-in required and regex validation unless the task explicitly changes those semantics.
- If scripts call `frm.validate()` during the `validate` hook, maintain the non-recursive fallback behavior.
- If stepper behavior changes, verify both full-form and per-step validation paths.

## Action Rules

- Renderer header actions are not the same as field-level `Button` fields.
- Custom action behavior should stop emission when the callback or action returns `false`.
- Keep `formAction` payloads consistent: `action`, `buttonName`, packed `data`, `rawData`, `frm`, and `source`.

## Link And Media Rules

- Keep `Link` as a full-object selection model, not an ID-only control.
- Keep uploads and downloads application-owned through `mediaHandler` and `mediaResolver`.
- Keep request/observer contracts stable when extending async field behavior.

## Done Criteria

- Script behavior, renderer lifecycle, and host integration rules all still agree.
- Related runtime specs were updated.
- Docs changed if a host integration contract or public runtime API changed.
