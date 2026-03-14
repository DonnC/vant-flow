# Kai-NG-Flow: Metadata-Driven Form Engine for Angular

Kai-NG-Flow is a high-performance, open-source form builder and renderer for Angular v17+, deeply inspired by the Frappe Framework's client-side architecture. It enables developers to build complex, reactive forms using simple JSON metadata and customize behavior with a powerful, Frappe-like Scripting API.

---

## 🏗️ Core Architecture: Signal-Driven Context
The engine is built on a **Context-Injection** pattern. Every form rendered by `app-form-renderer` creates an isolated `FormContext` instance. 

1. **Metadata Core**: Forms are defined by `DocumentDefinition` JSON, which includes sections, columns, and fields.
2. **Signal-Based Reactivity**: Each field and section's internal state (label, read-only, hidden, mandatory) is wrapped in an Angular **Signal**. This allows the scripting API to update the UI instantly without complex ChangeDetection cycles.
3. **Scripting Sandbox**: Client scripts are executed in a controlled function scope where `frm` and `frappe` objects are injected, providing a seamless bridge between the metadata and business logic.
4. **Pluggable Utility Layer**: Common UI tasks (dialogs, alerts, API calls, loading states) are handled by a centralized `AppUtilityService`, making it easy to swap themes or backend integrations.

---

### 🛠️ Scripting API: The `frm` Object

The `frm` object is the primary way to interact with the form. Below is the comprehensive API reference:

| Method | Description | Example |
| :--- | :--- | :--- |
| `on(event, fn)` | Listen to `refresh`, `validate`, or field changes. | `frm.on('refresh', () => { ... })` |
| `set_value(key, val)` | Update a field value (triggers change events). | `frm.set_value('status', 'Open')` |
| `get_value(key)` | Get current field value. | `const val = frm.get_value('amount')` |
| `set_df_property(...)`| Set field properties (label, hidden, read_only). | `frm.set_df_property('name', 'read_only', 1)` |
| `set_intro(msg, clr)` | Show a persistent banner at the top. | `frm.set_intro('Manual Review Required', 'orange')` |
| `add_custom_button(...)`| Add a button to the form header. | `frm.add_custom_button('Action', () => { ... })` |
| `set_button_label(...)` | Change label of default actions (save/submit). | `frm.set_button_label('save', 'Finalize')` |
| `set_button_action(...)`| Override the behavior of default actions. | `frm.set_button_action('submit', () => { ... })` |
| `msgprint(msg, type)` | Show a toast/alert notification. | `frm.msgprint('Saved!', 'success')` |
| `confirm(msg, yes, no)`| Show a confirmation dialog. | `frm.confirm('Are you sure?', () => { ... })` |
| `prompt(fields, cb)` | Open a dynamic dialog for user input. | `frm.prompt([{...}], (v) => { ... })` |
| `throw(msg)` | Show error and stop execution. | `frm.throw('Invalid Data')` |
| `call(opts)` | Invoke backend API with UI freezing. | `frm.call({ method: 'ping', freeze: true })` |
| `freeze(msg)` | Manually show loading overlay. | `frm.freeze('Processing...')` |
| `unfreeze()` | Remove loading overlay. | `frm.unfreeze()` |

---

### 🧪 Advanced Validation Logic

#### Global & Table Validation
The engine automatically runs validation on **Submission** or when `validate` hook is triggered:
1.  **Mandatory Checks**: Ensures all fields marked as `mandatory` are filled.
2.  **Regex Patterns**: Validates field content against the defined `regex` property.
3.  **Table Validation**: **NEW!** The engine now recursively validates every row in a `Table` field. If a child column is mandatory or has a regex, the entire form submission will block until the table data is corrected.

#### Prompt Validation
`frm.prompt` now supports data integrity out of the box. You can pass `mandatory: 1` or a `regex` pattern in the prompt field definitions, and the "Submit" button will only fire your callback if the input is valid.

---

### 💻 Modern Script Editor
The builder includes a professional Monaco-based editor with:
- **Intellisense**: Full type definitions for `frm` and `frappe`.
- **Snippet Library**: A searchable dropdown to instantly insert common boilerplate (Hooks, API calls, UI interactions).


---

## 🔌 Using as a Pluggable Module
To use this engine in your own project:

1. **Copy the Services**: Take `src/app/services/form-context.ts` and `src/app/services/app-utility.service.ts`.
2. **Copy the Renderer**: Include the `src/app/components/form-renderer` folder.
3. **Register Services**: Add `AppUtilityService` to your root providers and `FormContext` to the component-level providers of your host app.
4. **Invoke**:
   ```html
   <app-form-renderer [document]="mySchema" (formSubmit)="handle($event)"></app-form-renderer>
   ```

---

## 🛠️ Technical Stack
- **Engine**: Angular 17+ (Signals, Standalone Components, Control Flow)
- **Styling**: Tailwind CSS (Utilizing `animate-in`, `glassmorphism`, `modern shadows`)
- **Editor**: ngx-quill (Rich text with expansion support)
- **Icons**: Lucide-inspired SVG system
