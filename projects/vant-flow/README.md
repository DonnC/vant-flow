# Vant Flow

A production-grade, metadata-driven Visual Form Builder and Renderer for Angular 17+.

## 🌟 Features
-   **Visual IDE**: Drag-and-drop builder for complex form layouts.
-   **High-Performance Renderer**: JSON-driven rendering with sub-second initialization.
-   **Client Scripting**: Powerful JavaScript API (`frm`) with Monaco Editor intellisense.
-   **Modern Stack**: Built with Angular Signals, Standalone Components, and Tailwind CSS.
-   **Rich Components**: Signature pads, file attachments, recursive tables, and more.

---

## 🚀 Getting Started

Vant Flow is designed to be highly encapsulated. We provide a centralized configuration utility to set up the necessary underlying editors (Monaco and Quill) with sensible defaults.

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

Vant Flow exposes a powerful scripting API inspired by modern ERP systems.

```javascript
frm.on('refresh', (val, frm) => {
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

## 💻 Local Development & Showcase

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/developer/vant-flow.git
    npm install
    ```
2.  **Build Library**: `ng build vant-flow`
3.  **Run Showcase**: `npm start`

The showcase application demonstrates:
- **Landing Page**: Feature overview and navigation.
- **Admin Side**: Integrated Builder + Renderer side-by-side.
- **Standalone Demos**: Isolated components for debugging.
