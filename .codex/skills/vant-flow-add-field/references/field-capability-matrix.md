# Field Capability Matrix

## All Current Field Types

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

## Fields With Dedicated Config Objects

- `Link`
  Uses `link_config` for endpoint, mapping, filters, method, paging, and caching behavior.
- `Attach`
  Uses `attach_config` for camera capture and field-specific attachment behavior.
- `Signature`
  Uses runtime media hooks even though its schema contract is simpler than `Attach`.
- `Table`
  Uses `table_fields` and compact row rendering plus row-detail editing.

## Fields Requiring Special Runtime Handling

- `Check`
  Normalizes values to `1` or `0`.
- `Link`
  Supports async search, full-object selection, filters, caching, and refresh signals.
- `Text Editor`
  Uses Quill and needs readonly HTML cleanup.
- `Table`
  Owns row normalization, child validation, compact cells, and row-detail prompts.
- `Signature`
  Owns canvas drawing, optional media persistence, and preview restoration.
- `Attach`
  Owns file validation, drag-drop, optional camera capture, media persistence, preview, and download.
- `Button`
  Triggers runtime behavior rather than storing a submission value.

## Field Changes That Usually Need Extra Attention

- New async fields
- Fields that store objects instead of primitives
- Fields allowed inside `Table`
- Fields with binary or media data
- Fields that affect validation semantics
- Fields that introduce new host integration hooks
