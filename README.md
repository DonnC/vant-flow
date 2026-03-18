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
        frm.set_df_property('batch_id', 'reqd', true); // alias of mandatory
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
frm.set_df_property('email', 'reqd', true); // alias of mandatory

// Target a column within a table
frm.set_df_property('items_table', 'options', '.pdf,.jpg', 'attachment_col');
frm.set_df_property('items_table', 'hidden', true, 'rate_col');
```

### 🔗 Link Field Data Sources

`Link` fields can now behave like Frappe-style autocomplete lookups backed by a remote endpoint. Unlike `Select`, a `Link` field stores the full selected object in form data.

**Field Config Example**:

```json
{
  "id": "f_item",
  "fieldname": "item",
  "fieldtype": "Link",
  "label": "Item",
  "link_config": {
    "data_source": "/api/items/search",
    "mapping": {
      "id": "id",
      "title": "item_name",
      "description": "item_description"
    },
    "filters": {
      "category": "Voucher"
    },
    "method": "GET",
    "cache": true,
    "min_query_length": 1
  }
}
```

**Renderer Integration Example**:

```typescript
linkDataSource = async ({ query, filters, config }) => {
  const params = new URLSearchParams({
    q: query,
    category: filters.category || ''
  });

  const res = await fetch(`${config.data_source}?${params.toString()}`);
  return await res.json();
};
```

```html
<vf-renderer
  [document]="catalogSchema"
  [linkDataSource]="linkDataSource"
></vf-renderer>
```

**Client Script Example**:

```javascript
frm.on('category', (val, frm) => {
    frm.set_filter('item', { category: val });
    frm.refresh_link('item');
});
```

**Behavior Notes**:
- `Select` remains the right choice for static/manual option lists.
- `frm.set_df_property('my_select', 'options', 'A\\nB\\nC')` still works for dynamic `Select` choices.
- `Link` is for remote autocomplete data sources and stores the full object selected by the user.
- Dropdown rendering uses `link_config.mapping.title` and optional `link_config.mapping.description`.
- Built-in fetches are cached by query + filters, and you can override transport with `[linkDataSource]`.
- Response shapes are flexible: the endpoint may return an array directly, or an object containing the result array under `results_path`, `results`, `items`, or `data`.
- Nested dot-paths are supported for both `results_path` and mapping keys, so paths like `payload.data.items`, `record.id`, `profile.display_name`, and `profile.meta.search_hint` all work.

**Endpoint Contract Notes**:
- `mapping.id`, `mapping.title`, and `mapping.description` accept flat keys or nested dot-paths.
- In built-in `GET` mode, Vant sends `q`, `limit`, `fieldname`, `fieldtype`, and filters as `filters.<key>=<value>` by default.
- In built-in `POST` mode, Vant sends `{ q, limit, fieldname, fieldtype, filters }` by default.
- `search_param` and `limit_param` let you rename the `q` and `limit` keys.
- For authenticated, presigned, or app-specific transport, prefer `[linkDataSource]` and return a plain array of result objects.

**Nested Mapping Example**:

```json
{
  "link_config": {
    "data_source": "/api/catalog/search",
    "results_path": "payload.data.items",
    "mapping": {
      "id": "record.id",
      "title": "record.profile.display_name",
      "description": "record.profile.meta.search_hint"
    }
  }
}
```

--- 

### 🤖 AI Agent Integrations

Vant Flow's strictly typed JSON schema structure (`DocumentDefinition`) and comprehensive `VfFormContext` (frm) make it incredibly well-suited for **Large Language Model (LLM)** integrations. 

Because the entire form state, validation, and layout can be represented and manipulated via structured JSON and Javascript, AI Agents can interact with Vant Forms as if they were human users.

The included demo application (`kai-ng-flow`) showcases two prime examples of this "AI-First" capability using the **Google Gemini Pro SDK**:

1. **Scaffolding from Prompts (Admin Builder)**: Rather than manually dragging fields, administrators can simply type requirements (e.g. *"I need a vehicle inspection form with an equipment checkpoint table"*). The AI generates the complete `DocumentDefinition` JSON, which is instantly loaded into the visual builder for final refinement.
2. **AI Form Assistant (Client Runner)**: End-users are provided an embedded ChatGPT-style side panel. The assistant is fed the complex JSON schema as its system prompt. Users can converse natively, and the AI will invoke `frm.set_value()` under the hood to completely fill out the actual form fields in the foreground UI based on their unstructured responses.

This unlocks powerful workflows for enterprise data capturing, allowing complex form logic to be abstracted behind natural language! 

#### 💡 Example AI Test Prompts

Try testing the AI capabilities with these richer real-world prompts that push schema generation, stepper flows, tables, scripts, media fields, and data-aware behavior:

**1. Field Service: Work Order With Parts, Media, and Sign-Off**
* **Admin Builder:** "Create a multi-step Field Service Work Order form for fiber internet repairs. Step 1 should capture dispatch details, customer, service location, priority, SLA target, and a Link field for equipment with remote search filters. Step 2 should capture diagnostics, outage category, root cause, replaced parts in a child table, before/after photo attachments, and engineer notes. Step 3 should capture customer confirmation, engineer signature, customer signature, and final resolution status. Add client scripts that change required fields based on outage severity, calculate total parts cost from the table, and show an intro message for supervisors using frm.metadata.currentUser.role."
* **Client Chat:** "This is an urgent fiber break in Borrowdale. Customer is ZimFresh HQ, router serial FBR-0092, outage started at 07:10, we replaced two SFP modules at $85 each, attached before and after photos, and the customer signed off after service was restored at 09:42."

**2. Banking: SME Loan Origination With Compliance Checks**
* **Admin Builder:** "Generate a Commercial Loan Application form for small businesses. Include company profile, directors table, KYC document uploads, financial ratios, collateral details, a guarantor section, compliance declarations, and approval actions. Add scripts to compute debt service coverage, enforce mandatory collateral above a requested amount threshold, and use frm.metadata.user.branch and frm.metadata.user.role to show approval warnings."
* **Client Chat:** "We are Green Basket Wholesale applying for a $75,000 working capital loan. Two directors are Tawanda Moyo and Chipo Dube, annual revenue is $420,000, monthly debt obligations are $4,500, and we are offering two delivery trucks plus warehouse stock as collateral."

**3. Healthcare: Emergency Department Triage and Admission**
* **Admin Builder:** "Build a hospital Emergency Department triage and admission form with patient demographics, arrival mode, vitals, allergy history, presenting complaint, pain scale, clinician notes, ordered tests, admitted ward selection, and consent signature. Include a stepper flow, a medications table, critical-alert badges, and scripts that flag sepsis risk when temperature, heart rate, and blood pressure thresholds are crossed."
* **Client Chat:** "Patient is Mary Sibanda, 62, brought in by ambulance with shortness of breath, chest tightness, temperature 38.9, pulse 122, BP 92 over 58, allergic to penicillin, pain score 7, and she consented to emergency treatment."

**4. Insurance: Motor Claim With Assessment Workflow**
* **Admin Builder:** "Create a motor insurance claim form with policy lookup, driver details, accident timeline, third-party information, police report upload, vehicle damage photo attachments, assessor notes, repair estimate table, and settlement recommendation. Add scripts to require police report details for injury-related claims, calculate total repair estimate, and show different approval guidance based on frm.metadata.currentUser.claimsAuthority."
* **Client Chat:** "Policy MTR-44291, accident happened yesterday at 6:20 PM near Samora Machel Avenue, rear bumper and tail light were damaged, no injuries, police reference RRB-1120, and the first estimate is $380 for parts and $140 for labor."

**5. Telecom Sales: SIM Registration and KYC**
* **Admin Builder:** "Design a telecom SIM registration and KYC onboarding form with customer profile, ID verification uploads, plan selection, address details, optional business registration details, selfie capture attachment, and digital consent signature. Add scripts to reveal business fields only for corporate accounts, validate age requirements from date of birth, and use a Link field to search available plans from an endpoint filtered by customer segment."
* **Client Chat:** "Register a prepaid SIM for Rutendo Ncube, born May 14 1998, national ID 63-198765 B 12, residential customer in Avondale, wants a youth social bundle plan, and I have uploaded her ID front and back."

**6. Supply Chain: Warehouse Receiving Discrepancy Report**
* **Admin Builder:** "Create a Warehouse Goods Receiving and Discrepancy form with supplier Link lookup, purchase order Link lookup, truck arrival details, received items child table, rejected quantities, damage photo uploads, quarantine decision, and supervisor approval. Add scripts that compare ordered versus received quantities, require reason codes for shortages, and automatically filter the purchase order Link based on the selected supplier."
* **Client Chat:** "Supplier is Delta Packaging, PO is PO-88421, truck arrived at 08:15, item CARTON-12 ordered 500 received 480 with 20 water-damaged units, item LABEL-77 ordered and received 1200, and the damaged cartons were moved to quarantine."

**7. HR: New Hire Onboarding With Asset Allocation**
* **Admin Builder:** "Build a multi-step Employee Onboarding form with personal details, emergency contacts, tax info, banking details, department and manager lookup, equipment allocation, software access checklist, policy acknowledgements, and employee signature. Add scripts to make laptop and access fields mandatory for technical roles, calculate relocation benefits eligibility from branch and grade, and display branch-specific onboarding notes from frm.metadata."
* **Client Chat:** "New hire is Nigel Chari joining as a Senior Backend Engineer in the Digital Banking team on April 1st, manager is Tariro Mlambo, branch is Harare HQ, he needs a laptop, two monitors, GitHub, Jira, VPN, and relocation assistance from Bulawayo."

**8. Construction: Site Inspection With Risk Scoring**
* **Admin Builder:** "Generate a Construction Site Inspection form with project details, contractor Link lookup, weather conditions, PPE compliance checklist, incident observations, corrective action table, geotag/photo attachments, risk score calculation, and inspector signature. Add scripts to auto-calculate risk level from issue severity, hide closeout fields until all critical findings are addressed, and surface a red intro banner for high-risk projects."
* **Client Chat:** "Project is Eastgate Mall Extension, contractor is BuildAxis, weather was light rain, three workers were missing eye protection near the cutting area, scaffolding bay 2 lacked toe boards, I added two corrective actions with responsible supervisors, and the inspector signed at 16:35."

**9. Retail Operations: Multi-Branch Stock Transfer Request**
* **Admin Builder:** "Create a Stock Transfer Request form for retail branches with source branch, destination branch, transfer reason, urgency, item selection via Link field, requested quantities table, attachment for manager note, and approval actions. Add scripts to block same-branch transfers, filter item availability by source branch, and show inventory policy hints from frm.metadata."
* **Client Chat:** "Transfer 40 units of item Spark 2L and 24 units of item Fresh Milk 500ml from Borrowdale branch to Avondale branch because Avondale is below safety stock and needs replenishment before weekend rush."

**10. Public Sector: Grant Application With Eligibility Rules**
* **Admin Builder:** "Create a grant application form for youth entrepreneurship funding. Include applicant bio, business summary, funding request, budget breakdown table, milestone plan, supporting document uploads, referee details, declarations, and final signature. Add scripts to compute the total requested budget, validate age eligibility, reveal mentor details for first-time founders, and use frm.metadata.reviewCycle to display the current application window."
* **Client Chat:** "Applicant is Ashley Muchengeti, 27, applying for $12,000 to expand a solar irrigation startup, budget includes pumps, piping, installation, and training, and the project will create four jobs within six months."

**Importable Showcase JSON**
* A copyable schema that demonstrates Link data sources, Attach, Signature, tables, and metadata-aware scripts is available at `examples/kai-ng-flow/src/assets/examples/field-service-work-order.json`.

---

#### 🤖 AI & LLM Support

Vant Flow supports both **Google Gemini** and **OpenAI** for form scaffolding and assistance.

*   **Configuring Tokens (Securely)**:
    1.  Create a `.env` file in the root directory (use `.env.example` as a template).
    2.  Add your `GEMINI_API_KEY` or `OPEN_AI_KEY` and `OPEN_AI_MODEL`.
    3.  Run `npm start` – the configuration is automatically synchronized into the Angular environment via a secure, git-ignored file.
*   **Switching Models**: By default, the system favors OpenAI if a key is present. You can change the model by updating `OPEN_AI_MODEL` in your `.env` (e.g., `gpt-4o-mini-2024-07-18`).
*   **MCP Integration**: The AI service uses the exact same tool definitions as the **Vant MCP Server**, ensuring consistent "Magic" form generation across both the MCP Inspector and the built-in UI.

> [!IMPORTANT]
> To use a live model, ensure your internet connection is active and your API key has sufficient quota.

*   **Live MCP Mode**: For advanced development, you can connect the app to a running MCP server:
    1.  Start the MCP server in SSE mode: `npm run mcp:sse`
    2.  Start the app: `npm start`
    3.  The app will connect to `http://localhost:3001/sse` and fetch dynamic tools and guidance!

---

### 📦 Injected Metadata

Developers can pass arbitrary data (like an authenticated user object, roles, server responses, configuration options) from the host application seamlessly into client scripts using the `[metadata]` input. 

This empowers scripts to evaluate custom business rules using external domain knowledge context without making a network request or coupling the library to specific dependencies!

> [!IMPORTANT]
> The renderer `[metadata]` input is **runtime host data**. It is separate from `DocumentDefinition.metadata`, which is persisted as part of the schema. Use `[metadata]` for preview/testing or client-side context you do not want saved into the form JSON.

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

**Preview / Testing Example**:

```html
<vf-builder
  [initialSchema]="invoiceSchema"
  [previewMetadata]="{
    currentUser: { name: 'Alice', role: 'Manager' },
    inspectionMode: 'strict'
  }"
></vf-builder>
```

In Builder Preview and the example app, this runtime metadata feeds `frm.metadata` so scripts that depend on host/client metadata can run correctly. Invalid JSON in the preview editor keeps using the last valid metadata object, and the runtime metadata is not exported with the schema.

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
