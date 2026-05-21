# Test Commands

## Main Commands

- `npm run test:lib`
- `npm run test:app`
- `npm run test:mcp`
- `npm run test:all`

## Guidance

- Prefer `npm run test:lib` for library-only work in `projects/vant-flow`.
- Run `npm run test:app` when the example app host behavior changed.
- Run `npm run test:mcp` when a schema contract change also affects `projects/vant-mcp`.
- Use `npm run test:all` for broad validation when the change crosses library, example app, and MCP boundaries.
