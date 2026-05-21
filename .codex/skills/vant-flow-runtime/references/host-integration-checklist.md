# Host Integration Checklist

## When Touching Renderer Inputs

- Verify `ngOnChanges()` behavior in `VfRenderer`.
- Verify host overrides are reversible when arrays change.
- Verify the runtime context is rebuilt only when needed.

## When Touching `metadata`

- Keep schema `DocumentDefinition.metadata` distinct from runtime renderer `[metadata]`.
- Preserve access through `frm.metadata`.
- Update builder preview behavior if preview metadata should reflect the change.

## When Touching `mediaHandler` Or `mediaResolver`

- Keep binary storage concerns out of client scripts.
- Preserve both direct URL and object-reference flows.
- Test attach and signature behavior, not just one of them when contracts change.

## When Touching Link Behavior

- Preserve support for both built-in HTTP loading and host-provided `linkDataSource`.
- Preserve `linkRequestObserver` state shape.
- Preserve `frm.set_filter(...)` and `frm.refresh_link(...)` semantics.

## When Touching Actions

- Keep schema actions, runtime actions, and emitted action events aligned.
- Distinguish renderer header actions from field-level `Button` fields.
