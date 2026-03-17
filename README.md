# 🌊 Vant Flow
Form builder designed to bridge the gap between static JSON schemas and complex business logic. It allows developers to render fully functional, reactive forms from a database and execute sandboxed JavaScript "Client Scripts" to handle dynamic behavior—all without needing to redeploy the frontend

![admin](data/screenshots/admin.png)

## 🖋️ A Note on Inspiration

This is a specialized, lightweight subset heavily inspired by the immensely powerful and mature [Frappe Framework](https://frappeframework.com/).

---

## 💡 Core Philosophy: "Logic in Motion"

In traditional enterprise apps, a simple change (like hiding a field based on a new regulation) requires a full CI/CD cycle. **Vant Flow** changes the game:

1. **Metadata is King**: Define fields, validations, and layouts in JSON.
2. **Logic is Dynamic**: Write "Client Scripts" stored in your database.
3. **Security is Absolute**: Scripts run in a **Hardened Sandbox** using JS Proxies. They can manipulate the form, but they cannot "escape" the enclave to access dangerous browser globals.

### Why "Vant Flow"?

* **Vant**: Derived from *Vantage* and *Avant*. It represents a superior architectural position—giving you a vantage point over your application's logic—and an "avant-garde," modern approach to development.
* **Flow**: Represents the seamless movement of logic. Logic isn't hardcoded; it *flows* from your backend to the UI, allowing the form to react and evolve in real-time.

---

## 🌟 Features

* **Visual IDE**: Drag-and-drop builder for complex form layouts with collapsible property management.
* **Stepper Flow**: Native support for multi-step onboarding and wizard-style forms with global validation.
* **High-Performance Renderer**: JSON-driven rendering with sub-second initialization and reactive column visibility.
* **Client Scripting**: Powerful JavaScript API (`frm`) with Monaco Editor intellisense, executed in a secure Proxy-based sandbox.
* **Modern Stack**: Built with Angular Signals, Standalone Components, and Tailwind CSS.
* **Rich Components**: Signature pads, file attachments, recursive tables, and text editors.
* **Enhanced Tables**: Support for any field type as a column with specialized compact rendering (previews for attachments, text editors, and signatures).

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install vant-flow

```

### 2. Configure the Library

In your `app.config.ts`, add the `provideVfFlow()` provider:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideVfFlow } from 'vant-flow';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideVfFlow()
  ]
};
```

---

## 🛠️ API Reference

### Configuration Options (`VfFlowConfig`)

`provideVfFlow` accepts an optional configuration object to customize the internal editors.

```typescript
provideVfFlow({
  monaco: {
    baseUrl: 'assets/monaco-editor/vs', // Path to Monaco assets
    defaultOptions: { automaticLayout: true }
  },
  quill: {
    theme: 'snow',
    modules: {
      toolbar: [['bold', 'italic'], ['link', 'image']]
    }
  }
})
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `monaco` | `NgxMonacoEditorConfig` | _Sensible Defaults_ | Configures the Monaco Editor used in Script Editor. |
| `quill` | `QuillConfig` | _Rich-text Defaults_ | Configures the Quill Editor with `quill-table-better` support. |

### Core Components

| Component | Selector | Description |
|-----------|----------|-------------|
| `VfBuilder` | `vf-builder` | The full visual IDE for designing forms. Supports `[initialSchema]` and `(schemaChange)`. |
| `VfRenderer` | `vf-renderer` | The form renderer. Supports `[document]`, `(formReady)`, and `(formSubmit)`. |
| `VfToastOutlet` | `vf-toast-outlet` | Notification host for `VfUtilityService` toasts. |

### Core Services

| Service | Description | Key Methods |
|---------|-------------|-------------|
| `VfFormContext` | The `frm` API context for client scripts. | `set_value`, `get_value`, `msgprint`, `call` |
| `VfUtilityService` | Global utilities for UI feedback. | `toast()`, `alert()`, `confirm()`, `freeze()` |
| `VfBuilderState` | Central state for the builder. | `document`, `selectedField` |

---

## 📜 Client Scripting Example (`frm`)

Vant Flow exposes a powerful scripting API inspired by Frappe, but optimized for the Angular lifecycle.

```javascript
frm.on('refresh', (frm) => {
    frm.set_intro('Welcome to the premium form', 'blue');
    
    // Toggle field visibility dynamically
    if (frm.get_value('status') === 'Approved') {
        frm.set_df_property('batch_id', 'read_only', true);
    }
});

frm.on('quality_score', (val, frm) => {
    if (val < 80) {
        frm.msgprint('Warning: Score is below threshold', 'warning');
    }
});

```

---

### Enhanced Table Interaction
The `set_df_property` method now supports targeting columns within a table by providing a fourth argument:

```javascript
// Target a top-level field
frm.set_df_property('email', 'read_only', true);

// Target a column within a table
frm.set_df_property('items_table', 'options', '.pdf,.jpg', 'attachment_col');
frm.set_df_property('items_table', 'hidden', true, 'rate_col');
```

---

### 📦 Injected Metadata

Developers can pass arbitrary data (like an authenticated user object, roles, server responses, configuration options) from the host application seamlessly into client scripts using the `[metadata]` input. 

This empowers scripts to evaluate custom business rules using external domain knowledge context without making a network request or coupling the library to specific dependencies!

**Host Application (`app.component.html`)**:

```html
<vf-renderer
  [document]="invoiceSchema"
  [initialData]="invoiceData"
  [metadata]="{ 
    currentUser: { name: 'Alice', role: 'Manager' }, 
    maxTransactionLimit: 5000 
  }"
></vf-renderer>
```

**Client Script**:

```javascript
frm.on('amount', (val, frm) => {
    // Access external references injected via [metadata] using frm.metadata
    const isManager = frm.metadata?.currentUser?.role === 'Manager';
    const limit = frm.metadata?.maxTransactionLimit || 1000;

    if (val > limit && !isManager) {
        frm.msgprint(`Amount exceeds limit of $${limit} for your role!`, 'error');
        frm.set_value('amount', limit);
    }
});
```

Tables also feature **Smart Compact Rendering**:
- **Text Editor**: Automatic HTML stripping for table cell previews.
- **Attach**: Visual file counters and icons.
- **Signature**: High-density "Signed" status badges.
- **Check**: Minimal checkbox-only display (hides label for vertical spacing).

---

## 🛡️ Security: The Sandbox

Vant Flow shadows dangerous globals to prevent data exfiltration. Inside a client script, the following are `undefined`:

* `window`, `document`, `localStorage`, `sessionStorage`, `cookie`.
* `fetch`, `XMLHttpRequest` (Use `frm.call` for secure backend communication).

---

## 💻 Local Development & Workspace

This project is structured as an **Angular Workspace**. The root directory manages shared dependencies and configuration.

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/DonnC/vant-flow.git
    npm install
    ```

2.  **Build Primary Library**: 
    ```bash
    npm run build # ng build vant-flow
    ```

3.  **Run Example Application**:
    ```bash
    npm start # ng serve kai-ng-flow
    ```

4.  **Run Vant MCP Server**:
    ```bash
    npm run build:mcp # Build the server
    npm run mcp       # Run Inspector for projects/vant-mcp
    ```

---

## 📂 Repository Structure

- `projects/vant-flow`: Core library source.
- `projects/vant-mcp`: Model Context Protocol server for AI integration.
- `examples/kai-ng-flow`: Reference Angular application using the library.
