# Vant Flow AI Rules

Use the repo-local skills in `.codex/skills` for all substantial work in this repository.

## Skill Routing

- Use [vant-flow-core](./.codex/skills/vant-flow-core/SKILL.md) before changing platform behavior or when repo context is needed.
- Use [vant-flow-add-field](./.codex/skills/vant-flow-add-field/SKILL.md) for new field types, new field props, or changes that cross schema, builder, renderer, and runtime behavior.
- Use [vant-flow-runtime](./.codex/skills/vant-flow-runtime/SKILL.md) for `VfRenderer`, `VfFormContext`, `frm` APIs, validation, actions, link loading, media hooks, and host integration behavior.
- Use [vant-flow-builder](./.codex/skills/vant-flow-builder/SKILL.md) for builder state, palette, property editor, script editor, schema import or export, and preview metadata behavior.
- Use [vant-flow-testing](./.codex/skills/vant-flow-testing/SKILL.md) whenever behavior changes or tests are touched.

## Project Rules

- Preserve the schema-driven architecture around `DocumentDefinition`.
- Keep builder authoring and runtime execution in sync.
- Keep host-owned concerns in host-controlled surfaces instead of hardcoding them into the library.
- Update the relevant specs for any behavior change.
- Update `README.md`, `data/docs/*`, or `data/examples/*` when public platform capabilities change.

See [vant-flow-rules](./.codex/rules/vant-flow-rules.md) for the expanded repo playbook.
