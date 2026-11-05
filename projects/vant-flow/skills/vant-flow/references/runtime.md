# Runtime recipes and troubleshooting

## Scripts and lifecycle

Register handlers with `frm.on('refresh', (_value, frm) => { ... })` or `frm.on('fieldname', (value, frm) => { ... })`. Use `get_value`, `set_value`, `has_field`, `set_df_property`, and `set_section_property`; inspect generated signatures for overloads and return types. Event handlers may perform asynchronous work, but do not assume every lifecycle dispatch awaits promises: inspect the dispatcher before depending on ordering.

`frm.is_new()` currently checks `metadata.document_id` and `metadata.document_name`; loading field data alone does not identify a saved record. Hosts must pass the identity. `frm.set_readonly(true)` controls form interaction. Server permissions must still protect writes.

`frm.metadata` is runtime host context, distinct from `document.metadata`. Possible host-defined values include user, tenant, permissions, lifecycle, and application helpers; none are automatically authenticated by Vant. Handle missing metadata in scripts.

```javascript
frm.on('refresh', (_value, frm) => {
  if (!frm.is_new()) frm.set_readonly(true);
  if (frm.metadata?.permissions?.canViewCost === false) {
    frm.set_df_property('cost', 'hidden', true);
  }
});
```

Actions use `set_button_action`, `set_button_property`, `set_button_label`, and custom buttons. Dialog helpers include `msgprint`, `confirm`, `prompt`, and `throw`; consult signatures instead of assuming native browser dialog return values. Use the step APIs for navigation, and validate hidden/skipped-step behavior when modifying a stepper.

## Links and tables

Supply `linkDataSource` to resolve host-backed choices and `linkRequestObserver` for request state. Configure id/title mappings intentionally: persisted identity and readable display are different concerns. `provideVfFlow({ linkHref })` supplies the selected record's open-link destination; return null to hide it. Encode route segments and verify read-only link navigation.

Use `set_filter` and `refresh_link` when dependencies change. Investigate pending promises, change detection, clipping, and mappings before introducing host-side DOM workarounds.

For table rows, verify configured column types/options, compact grid display, row-dialog editing, validation, packed row data, and reload behavior together. `add_row`/`remove_row` change runtime rows; persistence belongs to the host. Media callbacks inside row prompts receive the owning form context.

## Media

`mediaHandler(payload, context)` receives a File or signature data and returns a string, stored-media object, or null. The host should return a usable storage reference and reject failed uploads. `mediaResolver(media, context)` resolves preview/download URLs; honor `context.action`, host authentication, and private-file access.

Unresolvable references and failed image previews show amber warnings. Preview failures are remembered; download explicitly retries. Changing the value/resolver clears preview state. Signature success requires a loaded image. A warning does not itself change required-field validation or prevent workflow submission; hosts enforce storage completeness.

## HTML content policy

In 1.1.2, Html uses Angular innerHTML with `bypassSecurityTrustHtml`; it is not a sanitizer or a sandbox. The host owns the trust policy for supplied markup. Inserting a script tag with innerHTML also does not establish a supported JavaScript execution lifecycle. Keep behavior in form scripts or host components instead of promising that arbitrary embedded scripts will execute.

## Monaco and API discovery

Use `registerVfScriptEditorSupport` and its returned `dispose()` rather than duplicating the frm catalog. The generated reference includes actual completion insert text. Preserve snippet insertion rules and configure Tab handling on the Monaco editor; simply showing a completion list does not guarantee snippet expansion.

Host globals use `namespaces` with `VfScriptNamespace` completion and declaration objects. Registering editor types does not inject executable globals at runtime; supply the real implementation separately. Dispose registrations when the editor is destroyed.

If the editor is blank or short, check asset URLs/worker configuration, container height through every flex ancestor, resize/layout calls, and console errors. Do not resolve an asset error by silently replacing the editor with a textarea.
