# Add Field Checklist

## 1. Schema Contract

- Update `FieldType` in `projects/vant-flow/src/lib/models/document.model.ts`.
- Add or update field-specific config interfaces if needed.
- Decide whether new props belong on:
  - `DocumentField`
  - `TableColumnDef`
  - nested config such as `link_config` or `attach_config`
- Review `PALETTE_ITEMS` so the field is authorable.

## 2. Builder Authoring

- Add the field to `FIELD_TYPES` in `projects/vant-flow/src/lib/components/builder/property-editor.component.ts`.
- If table support is valid, add it to `tableChildTypes`.
- Add property editor controls for any new props.
- If the builder should supply a better default label, update `addField()` in `projects/vant-flow/src/lib/services/builder-state.service.ts`.
- If new props need authoring affordances beyond the property panel, update the relevant builder component.

## 3. Runtime Rendering

- Add or update the field switch in `projects/vant-flow/src/lib/components/form-field.component.ts`.
- Handle compact rendering for table cells and row summaries if needed.
- Add field-specific parsing, display formatting, or async behavior there when the field owns it.
- If the field changes section-level or action-level behavior, coordinate with `VfRenderer` or `VfFormContext` instead of overloading the field component.

## 4. Renderer Lifecycle

- Review `initForm()` in `projects/vant-flow/src/lib/components/form-renderer/form-renderer.component.ts` for default normalization.
- Review `collectValidationErrors()` for mandatory or regex behavior.
- Review `packData()` only if the field affects how submission payloads are shaped.
- Review table row editing behavior if the field appears in `Table`.

## 5. Script And Runtime APIs

- If schema authors or hosts need to mutate the new capability through `frm`, update `projects/vant-flow/src/lib/services/form-context.ts`.
- If the script editor helper types or snippets need awareness, update `projects/vant-flow/src/lib/components/builder/script-editor.component.ts`.

## 6. Public Surface And Docs

- Check whether `projects/vant-flow/src/public-api.ts` needs to export a new type or helper.
- Update `README.md` when the feature changes how consumers use the library.
- Add or update a schema sample in `data/examples/` when the field is a meaningful product feature.
- If the feature affects architecture guidance, update the matching file in `data/docs/`.

## 7. Tests

- `projects/vant-flow/src/lib/components/form-field.component.spec.ts` for field-specific rendering or interaction
- `projects/vant-flow/src/lib/components/form-renderer/form-renderer.component.spec.ts` for init, validation, packing, or host integration changes
- `projects/vant-flow/src/lib/services/form-context.spec.ts` for `frm` API or runtime state changes
- `projects/vant-flow/src/lib/services/builder-state.service.spec.ts` for schema authoring state changes
- `projects/vant-flow/src/lib/components/builder/property-editor.component.spec.ts` for builder editing behavior
- `projects/vant-flow/src/lib/components/builder/builder-container.component.spec.ts` for preview or builder shell changes
