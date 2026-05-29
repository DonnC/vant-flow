# Contributing to Vant Flow

Thank you for your interest in contributing. Vant Flow is a focused, opinionated project — contributions that improve correctness, usability, and developer experience are always welcome.

---

## Before you open a PR

- **Bug fixes** and **documentation improvements** — open a PR directly. No issue required.
- **New features or field types** — open an issue first to align on design before investing time.
- **Breaking changes** — discuss in an issue; these need careful coordination.

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/DonnC/vant-flow.git
cd vant-flow
npm install
```

### 2. Start the dev workflow

```bash
npm run dev
```

This builds the library once, then starts both the library watcher and the demo app. The demo at `http://localhost:4200` hot-reloads when you change either the library or the app.

For the full stack including AI proxy and MCP server:

```bash
npm run dev:full
```

Copy `.env.example` → `.env` and add keys if you need the AI flows.

### 3. Run the tests

```bash
npm run test:lib   # library unit tests
npm run test:app   # demo app tests
npm run test:mcp   # MCP server tests
npm run test:all   # all suites
```

---

## Repo orientation

| Area | Path | Start reading |
|---|---|---|
| Core library | `projects/vant-flow/src/lib` | `public-api.ts` |
| Renderer | `projects/vant-flow/src/lib/components/form-renderer` | `form-renderer.component.ts` |
| Builder | `projects/vant-flow/src/lib/components/builder` | `vf-builder.component.ts` |
| Form context / API | `projects/vant-flow/src/lib/services` | `form-context.ts` |
| Field components | `projects/vant-flow/src/lib/components` | `form-field.component.ts` |
| MCP server | `projects/vant-mcp/src` | `index.ts` → `tools/` |
| Demo app | `examples/vant-flow-demo/src` | `app/` |
| Architecture docs | `data/docs/` | `architecture-overview.md` |

---

## How to add a field type

1. Add the new fieldtype string to `DocumentField.fieldtype` in the model (`document.model.ts`)
2. Add a rendering branch in `form-field.component.ts`
3. Add the field to the builder's palette (`field-palette.component.ts`) and property panel (`property-editor.component.ts`)
4. Add a sample schema in `data/examples/`
5. Document any new inputs or behaviours in `data/docs/renderer-architecture.md`

---

## Commit conventions

Use **conventional commits**:

```
feat: add MultiSelect field type
fix: resolve dependency evaluation on hidden sections
docs: add Link field usage example to README
refactor: extract frm validation into separate utility
test: add renderer readonly overlay tests
```

Scope is optional but helpful: `feat(renderer):`, `fix(builder):`, `docs(mcp):`.

---

## Pull request checklist

- [ ] Tests pass (`npm run test:lib`)
- [ ] No new lint errors (`ng build vant-flow`)
- [ ] New behaviour is covered by a test or demo
- [ ] Public API changes are reflected in `public-api.ts` and documented
- [ ] Commit messages follow conventional commit format

---

## Good first contributions

If you are new to the project, these are welcoming areas:

- **Additional field types** — `Rating`, `Color`, `JSON`, `Toggle`
- **`frm` API extensions** — new helper methods on `VfFormContext`
- **Accessibility** — keyboard navigation, ARIA roles, focus management in the renderer
- **Additional MCP tools** — schema diff, field search, validation report
- **Schema migration helpers** — version-aware upgrade utilities
- **More sample schemas** in `data/examples/`

---

## Questions

Open a [GitHub Discussion](https://github.com/DonnC/vant-flow/discussions) for design questions or ideas. Use [Issues](https://github.com/DonnC/vant-flow/issues) for confirmed bugs.
