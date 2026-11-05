# Maintenance, presets, and verification

## Working in the library repository

Read AGENTS.md and the relevant `.codex/skills/vant-flow-*` guide. Schema contracts live in `models/document.model.ts`; builder mutations in `builder-state.service.ts`; authoring controls in `components/builder`; field rendering in `form-field.component.ts`; lifecycle/packing in `components/form-renderer`; scripting in `services/form-context.ts` and `utils/script-editor-support.ts`.

For a new field or property, follow it through model, palette, property editor, builder state, runtime field, validation, packing, script typings/completions, public exports, docs/examples, and MCP support where relevant. Avoid wrapping a missing library capability independently in each consuming application.

The generated `contracts.md` lists source exports and public class signatures. Some public context members are lifecycle machinery, not recommended script APIs; the completion catalog identifies editor-supported methods. An exported symbol is not proof that it is appropriate for every host use.

## Optional Baobab preset

`vant-flow/baobab` exports field configuration, script namespace, and link navigation helpers. Inspect its installed exports for exact names. Keep these out of generic applications; the core does not enforce Baobab persistence, permissions, or document generation.

## MCP

If a Vant MCP server is available, discover its actual tools first. The current source exposes schema inspection/verification, builder/renderer contracts, examples, schema scaffolding, field/section/step mutation, script/action updates, and mock data generation. Prefer `verify_schema` for structural feedback, but it does not prove runtime script behavior or backend persistence. MCP is optional: the skill's references work without a server or a particular AI provider.

## Checks

In a source checkout:

```sh
npm run skills:generate
npm run skills:check
npm run skills:test
npm run build
npm run skills:examples
npm run test:lib
```

Run app or MCP tests when those surfaces change. In consumer applications, use their own build/tests and test relevant renderer interactions. Never copy repository-only commands into an application as though they were installed Vant commands.

The skill content has its own version in SKILL.md. Its supported library version and generated manifest must match the package. Regenerate after contract/docs/example changes. Review guides when behavior changes: generation detects stale snapshots, not inaccurate prose.
