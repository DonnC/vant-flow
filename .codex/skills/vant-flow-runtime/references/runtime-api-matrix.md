# Runtime API Matrix

## Renderer Inputs

- `document`
- `initialData`
- `readonly`
- `runFormScripts`
- `readonlyFields`
- `hiddenFields`
- `disabledActionButtons`
- `hiddenActionButtons`
- `showActions`
- `submitLabel`
- `disabled`
- `metadata`
- `mediaHandler`
- `mediaResolver`
- `linkDataSource`
- `linkRequestObserver`

## Renderer Outputs

- `formAction`
- `formChange`
- `formError`
- `formReady`

## `frm` APIs In Active Use

- `on`
- `get_value`
- `set_value`
- `set_df_property`
- `set_section_property`
- `set_intro`
- `validate`
- `validate_step`
- `set_readonly`
- `set_filter`
- `refresh_link`
- `next_step`
- `prev_step`
- `go_to_step`
- `set_step_hidden`
- `add_custom_button`
- `clear_custom_buttons`
- `reset`
- `add_row`
- `remove_row`
- `call`
- `freeze`
- `unfreeze`
- `set_button_action`
- `set_button_label`
- `set_button_property`
- `msgprint`
- `confirm`
- `throw`
- `prompt`

## Runtime Decision Map

- Need to render or interact with a single field type:
  edit `form-field.component.ts`
- Need to change form initialization, action emission, depends-on evaluation, packing, or renderer validation:
  edit `form-renderer.component.ts`
- Need to expose or change a scriptable API:
  edit `form-context.ts`
- Need to document script snippets or authoring hints:
  edit `builder/script-editor.component.ts` too
