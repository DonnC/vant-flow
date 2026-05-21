# Feature Map

## Schema Features

- Flat forms through `sections`
- Stepper flows through `is_stepper` and `steps`
- Document metadata such as `name`, `module`, `description`, `version`, and intro banner fields
- Conditional UI through `depends_on` and `mandatory_depends_on`
- Nested payload packing through `data_group`
- Renderer header actions through `actions`
- Runtime-only host metadata through renderer `[metadata]`

## Supported Field Types

- `Data`
- `Select`
- `Link`
- `Check`
- `Int`
- `Text`
- `Date`
- `Float`
- `Password`
- `Button`
- `Text Editor`
- `Table`
- `Datetime`
- `Time`
- `Signature`
- `Attach`

## Runtime Capabilities

- Script hooks with `frm.on(...)`
- Runtime value mutation with `frm.get_value(...)` and `frm.set_value(...)`
- Runtime field state mutation with `frm.set_df_property(...)`
- Runtime section state mutation with `frm.set_section_property(...)`
- Runtime action changes with `frm.add_custom_button(...)`, `frm.set_button_label(...)`, `frm.set_button_action(...)`, and `frm.set_button_property(...)`
- Form and step validation through `frm.validate()` and `frm.validate_step()`
- Stepper transitions through `frm.next_step()`, `frm.prev_step()`, and `frm.go_to_step(...)`
- Table row operations through `frm.add_row(...)` and `frm.remove_row(...)`
- Link filtering through `frm.set_filter(...)` and `frm.refresh_link(...)`
- Dialog and feedback helpers through `frm.prompt(...)`, `frm.confirm(...)`, and `frm.msgprint(...)`
- Host service calls through `frm.call(...)`

## Host Integration Surfaces

- `runFormScripts`
- `readonlyFields`
- `hiddenFields`
- `disabledActionButtons`
- `hiddenActionButtons`
- `mediaHandler`
- `mediaResolver`
- `linkDataSource`
- `linkRequestObserver`

## Example Platform Flows

- Builder authoring and preview
- Admin-managed schema persistence
- User-facing runtime rendering
- Submission replay and readonly views
- AI-assisted schema generation
- AI-assisted form filling
