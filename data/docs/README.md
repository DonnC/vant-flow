# Vant Flow Documentation

This folder documents how `vant-flow` works from the code that exists in this repository today.

## Documents

- [Architecture Overview](./architecture-overview.md)
- [Builder Architecture](./builder-architecture.md)
- [Renderer Architecture](./renderer-architecture.md)
- [MCP Architecture](./mcp-architecture.md)
- [Example Showcase Architecture](./example-showcase-architecture.md)
- [Business Use Cases](./business-use-cases.md)

## Scope

These docs cover:

- The core library in `projects/vant-flow`
- The MCP server in `projects/vant-mcp`
- The example implementation in `examples/vant-flow-demo`
- The AI-assisted and storage-backed workflows demonstrated in the repo

## Core Idea

Vant Flow separates form delivery into two layers:

1. A schema-driven builder that produces a `DocumentDefinition`
2. A renderer that executes that document, form state, validation rules, and client scripts at runtime

That split is what gives developers freedom:

- Ship the renderer once and update forms from data
- Change layout, fields, step flows, and actions without redeploying UI code
- Keep business behavior dynamic through client scripts and injected metadata
- Reuse one rendering engine across very different business processes

## Form Script Button Actions
Solid real use cases

1. `Decline` requires a comment first  
The host app owns the real decline action, but the script blocks it until `comment` has a value.
```js
frm.set_button_action('decline', async (frm) => {
  if (frm.get_value('comment')) return true;
  frm.msgprint('Please add a comment before declining.', 'warning');
  return false;
});
```

2. `Decline` opens a reason prompt, then allows host submission  
Useful when you don’t want the reason field always visible on the form.
```js
frm.set_button_action('decline', async (frm) => {
  const vals = await frm.prompt([
    { label: 'Reason', fieldname: 'reason', fieldtype: 'Text', mandatory: 1 }
  ], undefined, 'Decline Reason');

  if (!vals?.reason) return false;
  frm.set_value('comment', vals.reason);
  return true;
});
```

3. `Approve` only works when another field is valid  
Example: supervisor code or checklist must be completed first.
```js
frm.set_button_action('approve', (frm) => {
  if (!frm.get_value('supervisor_code')) {
    frm.msgprint('Supervisor code is required before approval.', 'error');
    return false;
  }
  return true;
});
```

4. Host-defined custom button with script-side gate  
If the host listens for a custom button like `Escalate`, script can still intercept first.
```js
frm.add_custom_button('Escalate', async (frm) => {
  if (!frm.validate()) return false;

  const vals = await frm.prompt([
    { label: 'Escalation Note', fieldname: 'note', fieldtype: 'Text', mandatory: 1 }
  ], undefined, 'Escalation');

  if (!vals?.note) return false;
  frm.set_value('escalation_note', vals.note);
  return true;
}, 'danger');
```

5. Confirmation before irreversible host action  
Good for actions like cancel, archive, write-off, blacklist.
```js
frm.set_button_action('submit', async (frm) => {
  if (frm.get_value('status') !== 'Write Off') return true;

  return await new Promise((resolve) => {
    frm.confirm(
      'This will mark the record as written off. Continue?',
      () => resolve(true),
      () => resolve(false)
    );
  });
});
```
