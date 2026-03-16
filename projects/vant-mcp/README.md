# @vant-flow/mcp

The **Vant Flow MCP Server** is a Model Context Protocol implementation that turns Vant Flow into an **Agent-Aware UI Framework**. It allows AI agents (like Claude, GPT, or Gemini) to architect, build, and test banking-grade forms using the Vant Flow architecture.

## 🚀 The "Agentic UI" Concept
This package provides the "Hands" for an AI agent. Instead of an AI just giving you a text description of a form, it uses these tools to emit valid Vant `DocumentDefinition` JSON, complete with:
- **Stepper Flows**: Deciding when a form is too complex for a single page.
- **Sandboxed Scripting**: Generating `frm` API logic for real-time calculations.
- **High-Density Tables**: Configuring complex child-table relationships.
- **Contextual Validations**: Setting regex and mandatory flags based on regulatory needs.

---

## 🛠️ Whole Vant Toolset (12 Primary Tools)

The MCP server provides a comprehensive toolkit categorized for a professional "Build-Verify-Refine" workflow:

### 0. 🪄 AI Magic (Prompt-to-Form)
- `create_form_from_prompt`: Generate a Vant form from a string (e.g., "employee onboarding"). In the Inspector, this uses "Smart Templates" to show immediate magic. For AI agents, this is the primary design request entry.

### 1. 🔍 Context & Discovery
- `get_models`: Teaches the AI the Vant Type System and `frm` API hooks.
- `analyze_schema`: Provides a natural language summary of any existing Vant schema.
- `verify_schema`: Structural integrity check to ensure JSON validity.

### 2. 🏛️ Structural Design (Granular)
- `scaffold_from_blueprint`: Uses structured **Blueprints** to generate high-fidelity initial designs. Best for high-precision AI generations.
- `add_step`: Adds a new step to a multi-step form.
- `add_section`: Injects sections into specific steps or forms.
- `add_field`: Surgical field injection into any section.
- `update_field`: Precision updates to field properties (mandatory, read-only, etc).

### 3. Logic & Config
- `update_client_script`: Sets or enhances the form's JavaScript logic.
- `configure_actions`: Updates button labels (Save/Submit) and visibility.
- `set_intro`: Configures the premium banner text and styling.

### 4. Simulation
- `generate_mock_data`: Generates complex data objects for debugging and testing.

---

## 🧪 How to Test

Since this server runs on **stdio**, you can test it using the official **MCP Inspector** (which provides a web-based UI similar to FastMCP).

### 1. Install & Build
```bash
cd projects/vant-mcp
npm install
npm run build
```

### 2. Run with MCP Inspector
Run this command from the `projects/vant-mcp` directory:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```
This will open a browser window where you can:
1. See the list of tools.
2. Run tools like `scaffold_form` with a prompt.
3. See the generated JSON output instantly.

---

## 💡 Playbooks: The "Build-Verify-Refine" Workflow

Use these playbooks in the MCP Inspector to see how the 13 tools work together in a professional lifecycle.

### Playbook A: The "Safe-Save" Forex Portal
1. **Magic Scaffold**: Use `create_form_from_prompt` with:
   *"Forex purchase request with Currency selector, Amount, and specific Bank selection."*
2. **Precision Refinement**: Use `update_field` on the `Amount` field:
   - `props`: `{ "mandatory": true, "fieldtype": "Float" }`
3. **Inject Logic**: Use `update_client_script` to ensure the user doesn't buy more than 5000 USD:
   ```javascript
   frm.on('before_save', (val, frm) => {
     if (frm.get_value('amount') > 5000) {
       frm.msgprint('Transaction exceeds regulatory limit of 5000 USD', 'danger');
       return false;
     }
   });
   ```
4. **Simulate**: Use `generate_mock_data` to get a payload, then manually change `amount` to 6000 and run a mock "save" event.

### Playbook B: The "High-Risk" Multi-Step Audit
1. **Magic Scaffold**: Use `create_form_from_prompt` with:
   *"3-step ESG environmental audit form."*
2. **Add Complexity**: Use `add_section` to Step 2:
   - `label`: *"High Risk Mitigation"*
   - `props`: `{ "depends_on": "eval:frm.get_value('risk_level') === 'High'" }`
3. **Inject Field**: Use `add_field` to that new section:
   - `label`: *"Auditor Signature"*
   - `fieldtype`: *"Signature"*
4. **Verify**: Use `analyze_schema` to see the new structure and `verify_schema` to ensure the logic injection is valid.

### Playbook C: The Dynamic Calculations
1. **Magic Scaffold**: Use `create_form_from_prompt` with *"Loan Application"*.
2. **Inject Calculation**: Use `update_client_script` to auto-calculate interest:
   ```javascript
   frm.on('principal_amount', (val, frm) => {
     const interest = val * 0.15;
     frm.set_value('interest_charge', interest);
     frm.msgprint('Interest recalculated at 15% rate', 'info');
   });
   ```
3. **Verify**: Use `generate_mock_data` to ensure the `interest_charge` field name is correctly identified in the payload.

---

## 🔒 Security Note
All scripts generated by the MCP are designed to be executed within the **Vant Flow Sandbox**. They have no access to `window`, `document`, or `localStorage`, ensuring parent application safety even when AI generates the logic.
