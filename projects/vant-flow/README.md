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

### Injected Metadata

Developers can pass runtime host data into client scripts using the renderer `[metadata]` input. This data is exposed as `frm.metadata`, making it useful for preview/testing, role-based rules, or client-side context that should not be stored in the schema itself.

> [!IMPORTANT]
> `[metadata]` is runtime-only host data. It is separate from `DocumentDefinition.metadata`, which is persisted with the schema.

```html
<vf-renderer
  [document]="invoiceSchema"
  [metadata]="{
    currentUser: { name: 'Alice', role: 'Manager' },
    inspectionMode: 'strict'
  }"
></vf-renderer>
```

```javascript
frm.on('refresh', (_val, frm) => {
    const role = frm.metadata?.currentUser?.role;
    if (role === 'Manager') {
        frm.set_intro('Manager review mode enabled.', 'blue');
    }
});
```

Builder Preview and the example demo pages also expose a JSON editor for this runtime metadata. It feeds `frm.metadata` so scripts that depend on host/client metadata can run correctly. Invalid JSON keeps the last valid metadata object active, and the runtime metadata is not exported with the form schema.

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

## 💻 Local Development & Showcase

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/DonnC/vant-flow.git
    npm install
    ```
2.  **Build Library**: `ng build vant-flow`
3.  **Run Showcase**: `npm start`

The showcase application demonstrates:
- **Landing Page**: Feature overview and navigation.
- **Admin Side**: Integrated Builder + Renderer side-by-side.
- **Standalone Demos**: Isolated components for debugging.
