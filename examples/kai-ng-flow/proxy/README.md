# Example Proxy Structure

This proxy is intentionally split by concern so teams can replace parts without rewriting the whole example.

## Entry Point
- `index.js`
  Thin startup file. It only creates the app and starts the server.

## App Composition
- `src/create-app.js`
  Wires together the logger, SQLite database, MCP client, model client, storage helpers, and routes.

## Replaceable Modules
- `src/config.js`
  Environment loading, shared paths, port, model defaults, and provider helpers.
- `src/logger.js`
  File + console logging. Replace this first if your project already has a logging system.
- `src/db.js`
  SQLite initialization. Replace this if your project uses Postgres, MySQL, or a service API.
- `src/demo-data.js`
  Example customer/equipment data for Link field demos. Safe to remove in real projects.
- `src/storage.js`
  Local upload/reference-file storage helpers. Replace this if you use S3, Blob Storage, or another file service.
- `src/mcp-client.js`
  MCP connection and tool-calling logic. Keep this if you want the Vant-aware scaffold flow.
- `src/model-client.js`
  OpenAI/Gemini completion wrapper. Replace this if your project uses a different AI gateway.
- `src/utils.js`
  Shared JSON, prompt, search, and request utility helpers.

## Route Modules
- `src/routes/ai-routes.js`
  AI completion, AI scaffold, and live form assistant endpoints.
- `src/routes/demo-routes.js`
  Demo Link-search endpoints and demo storage endpoints.
- `src/routes/persistence-routes.js`
  Forms, submissions, and chat-history persistence endpoints.

## Common Swap Scenarios
- Keep MCP + replace storage:
  Replace `src/storage.js` and keep the rest.
- Keep AI routes + replace database:
  Replace `src/db.js` and `src/routes/persistence-routes.js`.
- Keep only demo APIs:
  Keep `src/routes/demo-routes.js` and remove AI/MCP wiring from `src/create-app.js`.
- Keep only the MCP-aware scaffold flow:
  Keep `src/mcp-client.js`, `src/model-client.js`, and `src/routes/ai-routes.js`.

## Goal of This Layout
The example should show developers clear seams:
- where Vant MCP integration lives
- where demo-only APIs live
- where persistence lives
- where uploads live
- where AI provider logic lives

That way they can copy only the parts they need instead of treating the example as one opaque server file.
