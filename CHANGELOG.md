# Changelog

## 1.1.2 - 2026-11-05

### Added

- Portable `vant-flow` agent skill bundled with the npm package, with integration/runtime guidance, generated API contracts, schema examples, and an Angular example. Install it for Codex, Claude, or an explicit skills directory.
- Skill snapshot generation, freshness checks, and installer regression checks through `skills:generate`, `skills:check`, and `skills:test`.
- Attachment and signature fields show a compact amber warning when a stored reference cannot be resolved or an image preview fails. The explanation is available on hover and keyboard focus, including in compact table cells.
- Regression coverage for missing media references, failed previews and uploads, download retries, files sharing a name, stale resolver results, and media uploads inside table-row prompts.

### Fixed

- Background media resolution failures no longer repeatedly invoke the resolver or produce error dialogs. Explicitly choosing download retries a failed resolution.
- Media caches distinguish separate file values with the same filename. Replacing a field value or its resolver resets preview state, and outdated asynchronous results are ignored.
- Signature previews clear the previous canvas image and show capture success only after the image loads. Read-only signatures cannot be cleared.
- Upload handlers returning no stored file are treated as failures; failed signature uploads do not emit a new stored value.
- Media upload and resolution callbacks inside prompts receive the owning form context, including prompts used to edit table rows.

### Documentation

- Documented media warning behavior and the host application's responsibility for storage validation and submission handling while uploads are pending or failed.

## 1.1.1

### Changed

- The README and docs describe Vant Flow on its own terms.
- The rich-text editor's style class is `ql-vf-style`. Override that class if you styled the editor through the previous one.

## 1.1.0

### Added

- Field types: `Url` (remote lookup with autocomplete), `Html` (rendered HTML that scripts inject), `JSONTable` (rows stored with the record) and `ChildTable` (rows of another document type). `Link` now describes a relationship to another document.
- `in_list_view`, `indexed`, `unique` and `virtual` on fields and table columns, and `is_child_table` on documents, so hosts can derive list views and storage from a schema.
- Detached client scripts: the renderer and builder accept a script kept outside the schema (`clientScript`, `detachedClientScript`).
- Runtime metadata typing (`VfRuntimeMetadata`). The builder offers document choices from `metadata.documents` for Link and ChildTable options.
- `frm.is_new()` and further `frm` script API additions, with editor completions and type checking through `registerVfScriptEditorSupport`.
- Host script globals: pass `namespaces` to `registerVfScriptEditorSupport` to get completions and typings for your own script API next to `frm`.
- `provideVfFlow({ linkHref })` shows an "open" button on filled Link fields, pointing wherever your host keeps records.
- `vant-flow/baobab`, an optional entry point with the Baobab Desk preset. Apps that do not import it do not bundle it.
- Compact child table rows, and table cells that can render with their column's schema definition.

### Changed

- Link fields show an open button only when `linkHref` is provided.
- Baobab-specific code moved out of the core entry point into `vant-flow/baobab`. In `1.0.1-baobab.1` it was part of the core: `includeBaobabApi` is now `namespaces: [VF_BAOBAB_SCRIPT_NAMESPACE]`, and `extractBaobabContract` was removed (Baobab derives storage on its server).

### Fixed

- A read-only URL or email field no longer gets a blocking overlay when its runtime `regex` property is unset.
- The library test suite passes again; renderer and property editor specs had fallen behind the components they test.

## 1.0.0

First public release.
