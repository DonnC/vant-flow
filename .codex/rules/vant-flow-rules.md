# Vant Flow Rules

## Purpose

These rules keep AI-assisted work aligned with how Vant Flow is built and shipped.

## Always Route Work Through The Right Skill

- Use `.codex/skills/vant-flow-core` first for platform context.
- Use `.codex/skills/vant-flow-add-field` for new field types, field props, and field capability changes.
- Use `.codex/skills/vant-flow-runtime` for `VfRenderer`, `VfFormContext`, `frm` APIs, validation, actions, links, media, and metadata-driven behavior.
- Use `.codex/skills/vant-flow-builder` for builder state, palette, property editing, preview, and script-authoring UX.
- Use `.codex/skills/vant-flow-testing` whenever behavior changes.

## Platform Guardrails

- Preserve the schema-first architecture. The builder authors `DocumentDefinition`; the renderer executes it.
- Keep host-owned concerns in host-controlled surfaces such as renderer inputs, callbacks, and services.
- Keep `frm` APIs consistent and additive.
- Keep builder preview metadata separate from persisted schema metadata.
- Update docs and samples when public platform behavior changes.

## Definition Of Done

- Source changes match the correct architectural layer.
- Related builder and runtime surfaces stay in sync.
- Relevant specs are updated.
- Appropriate test commands were run when possible.
