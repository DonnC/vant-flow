import test from 'node:test';
import assert from 'node:assert/strict';
import { VantSchemaBuilder } from '../dist/utils/schema-builder.js';

test('buildFromBlueprint creates stepper schemas with configured actions and table columns', () => {
  const builder = new VantSchemaBuilder();

  const schema = builder.buildFromBlueprint({
    title: 'Employee Onboarding',
    is_stepper: true,
    module: 'HR',
    actions: {
      submit_label: 'Complete Onboarding'
    },
    steps: [{
      title: 'Personal Details',
      sections: [{
        label: 'Identity',
        columns_count: 2,
        fields: [
          { label: 'Full Name', fieldtype: 'Data', mandatory: true },
          {
            label: 'Supporting Documents',
            fieldtype: 'Table',
            table_fields: [
              { label: 'Document Name', fieldtype: 'Data' },
              { label: 'Attachment', fieldtype: 'Attach' }
            ]
          }
        ]
      }]
    }]
  });

  assert.equal(schema.is_stepper, true);
  assert.equal(schema.module, 'HR');
  assert.equal(schema.actions?.submit?.label, 'Complete Onboarding');
  assert.equal(schema.steps?.length, 1);
  assert.equal(schema.steps?.[0].sections[0].columns.length, 2);

  const tableField = schema.steps?.[0].sections[0].columns.flatMap(c => c.fields).find(f => f.fieldtype === 'Table');
  assert.ok(tableField);
  assert.equal(tableField?.table_fields?.length, 2);
  assert.equal(tableField?.table_fields?.[1].fieldtype, 'Attach');
});

test('buildFromPrompt infers stepper and field types from plain language', () => {
  const builder = new VantSchemaBuilder();

  const schema = builder.buildFromPrompt(
    '3-step employee onboarding with personal details, then payroll amount and start date, and finally documents upload'
  );

  assert.equal(schema.is_stepper, true);
  assert.ok((schema.steps?.length ?? 0) >= 2);

  const fieldTypes = (schema.steps ?? [])
    .flatMap(step => step.sections)
    .flatMap(section => section.columns)
    .flatMap(column => column.fields)
    .map(field => field.fieldtype);

  assert.ok(fieldTypes.includes('Float'));
  assert.ok(fieldTypes.includes('Date'));
  assert.ok(fieldTypes.includes('Attach'));
});

test('addSection, addField, and updateField mutate the target schema in place', () => {
  const builder = new VantSchemaBuilder();
  const schema = builder.buildFromBlueprint({
    title: 'Incident Report',
    sections: [{
      label: 'Summary',
      fields: [{ label: 'Title', fieldtype: 'Data' }]
    }]
  });

  builder.addSection(schema, 'Evidence', undefined, { columns_count: 2 });
  const evidence = schema.sections.find(section => section.label === 'Evidence');
  assert.ok(evidence);
  assert.equal(evidence?.columns.length, 2);

  builder.addField(schema, evidence.id, 'Screenshot', 'Attach');
  builder.updateField(schema, 'screenshot', { hidden: true, description: 'Upload proof' });

  const screenshot = evidence?.columns.flatMap(column => column.fields).find(field => field.fieldname === 'screenshot');
  assert.ok(screenshot);
  assert.equal(screenshot?.fieldtype, 'Attach');
  assert.equal(screenshot?.hidden, true);
  assert.equal(screenshot?.description, 'Upload proof');
});

test('generateSummary describes stepper forms and script presence', () => {
  const builder = new VantSchemaBuilder();
  const schema = builder.buildFromBlueprint({
    title: 'Service Request',
    is_stepper: true,
    client_script: 'frm.on("refresh", () => {})',
    steps: [{
      title: 'Request',
      sections: [{
        label: 'Basics',
        fields: [
          { label: 'Request Date', fieldtype: 'Date' },
          { label: 'Category', fieldtype: 'Select', options: 'A\nB' }
        ]
      }]
    }]
  });

  const summary = builder.generateSummary(schema);

  assert.match(summary, /multi-step/i);
  assert.match(summary, /custom client-side logic/i);
  assert.match(summary, /Date/i);
  assert.match(summary, /Select/i);
});
