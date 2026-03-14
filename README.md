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

## 🚀 Scripting API: The `frm` Object
The `frm` (Form) object is the primary interface for interacting with the form.

### 1. Alerting & Dialogs
Show professional alerts and interactive dialog boxes without external dependencies.

```javascript
// Show a quick alert (indicators: 'success', 'info', 'warning', 'error')
frm.msgprint('Operation successful!', 'success');

// Stop execution and show error
if (frm.get_value('amount') > 1000) {
    frm.throw('Amount cannot exceed 1000');
}

// Ask for confirmation
frm.confirm('Are you sure you want to delete this record?', 
    () => { /* on confirm */ }, 
    () => { /* on cancel */ }
);

// Collect dynamic input
frm.prompt([
    { label: 'Reason', fieldname: 'reason', fieldtype: 'Data', mandatory: 1 },
    { label: 'Date', fieldname: 'date', fieldtype: 'Date' }
], (values) => {
    frm.msgprint('You chose: ' + values.reason);
}, 'Required Info');
```

### 2. Form State & Controls
Lock the form or customize actions dynamically.

```javascript
// Global Read-Only toggle
frm.set_readonly(true);

// Update specific field properties
frm.set_df_property('customer_name', 'read_only', 1);
frm.set_df_property('discount', 'hidden', 0);

// Set form values
frm.set_value('status', 'Completed');
frm.set_value({
    'last_updated': '2024-01-01',
    'modified_by': 'Admin'
});

// Set a dynamic introduction badge
frm.set_intro('This ticket is high priority!', 'orange');
```

### 3. Custom Action Buttons
Add or modify buttons in the form header.

```javascript
// Add a new primary button
frm.add_custom_button('Approve Payment', () => {
    frm.call({ method: 'approve', freeze: true });
}, 'primary');

// Change label of a default button
frm.set_button_label('submit', 'Send to Manager');

// Clear all custom buttons
frm.clear_custom_buttons();
```

### 4. API Calls & UI Freezing
Bridge the gap between frontend and backend with integrated loading states.

```javascript
// Invoke backend method with overlay
frm.call({
    method: 'get_exchange_rate',
    args: { currency: 'EUR' },
    freeze: true,
    freeze_message: 'Fetching rates...',
    callback: (r) => {
        frm.set_value('rate', r.rate);
    }
});

// Manual UI freeze controls
frm.freeze('Synchronizing...');
setTimeout(() => frm.unfreeze(), 2000);
```

### 5. Event Hooks
Hook into the form lifecycle.

```javascript
// Runs when the form is finished rendering
frm.on('refresh', () => {
    frm.msgprint('Welcome back!');
});

// Validation hook: Return false or frm.throw to stop submission
frm.on('validate', () => {
    if (frm.get_value('qty') < 1) {
        frm.throw('Quantity must be at least 1');
        return false;
    }
});

// Hook into specific field changes
frm.on('customer', (value) => {
    frm.set_intro('Customer ' + value + ' selected', 'blue');
});
```

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
