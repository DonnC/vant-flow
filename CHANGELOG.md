# Changelog

## 1.1.0

### Added

- Field types: `Url` (remote lookup with autocomplete), `Html` (rendered HTML that scripts inject), `JSONTable` (rows stored with the record) and `ChildTable` (rows of another document type). `Link` now describes a relationship to another document.
- `in_list_view`, `indexed`, `unique` and `virtual` on fields and table columns, and `is_child_doctype` on documents, so hosts can derive list views and storage from a schema.
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
