# Application integration

Use the Angular version supported by the installed package's peer dependencies; 1.1.2 declares Angular core/common ^20.3.0 and CDK ^20.2.14. Do not rely on older marketing prerequisites when configuring an application.

Import `VfRenderer`, `VfBuilder`, `DocumentDefinition`, and `provideVfFlow` from `vant-flow`. Configure `provideVfFlow()` at application bootstrap; arrange Monaco assets and application styles as described in the package README. Do not add a second Angular runtime to work around rendering failures.

## Schema and layout

Every document needs a name and sections array. Each section contains columns, each column contains fields. Stepper documents additionally use `is_stepper` and `steps`, with sections nested inside steps. Use the generated contract for supported properties and the bundled JSON examples for concrete layouts.

Field groups:

- Scalar entry: Data, Text, Password, Int, Float, Check, Date, Datetime, Time.
- Choices and relations: Select, Url, Link. Select options are newline-separated. Link options identify the target document; lookup mapping/search configuration uses `link_config`.
- Rich content: Text Editor and Html. Html is script-driven display content; check renderer behavior before making security guarantees.
- Collections: JSONTable, ChildTable, and legacy Table. Table columns use `table_fields`; do not nest table/button columns against the type contract. Resolve relational child schemas through the host contract rather than fabricating columns.
- Media: Attach and Signature. Camera capture is configured by `attach_config` on attachments.
- Actions: Button and document-level `actions`.

Use `mandatory`/`reqd`, `depends_on`, `mandatory_depends_on`, `hidden`, `read_only`, `regex`, defaults, and `data_group` deliberately. `data_group` affects packed data, so test the submitted shape as well as the visual layout. Field storage hints such as indexed/unique/virtual are metadata; Vant does not create database constraints.

## Builder and renderer

Bind builder `[initialSchema]` and handle `(schemaChange)` to persist authoring changes. Runtime uses renderer `[document]`, `[initialData]`, and `(formAction)`; `(formChange)` is a change event, not a server save. `(formReady)` supplies the form context. Hosts implement actual persistence and handle `(formError)`.

For detached scripting, use renderer `[clientScript]`; it takes precedence over schema `client_script` when non-null, including an empty string used to suppress the schema script. Builder uses `[detachedClientScript]`, `[useDetachedClientScript]`, and `(clientScriptChange)`. Use `[previewMetadata]` for host context in builder preview and `[showScriptEditor]` when the host owns script editing elsewhere.

Host renderer controls include `readonly`, `readonlyFields`, `hiddenFields`, `disabledActionButtons`, `hiddenActionButtons`, `showActions`, `disabled`, and `showSectionNavigator`. Preserve the exact input spelling; do not substitute field `read_only` for renderer `readonly`.
