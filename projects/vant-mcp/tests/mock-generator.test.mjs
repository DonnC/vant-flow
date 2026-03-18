import test from 'node:test';
import assert from 'node:assert/strict';
import { VantMockGenerator } from '../dist/utils/mock-generator.js';

test('generateData returns defaults when provided and generated values for each field type', () => {
  const generator = new VantMockGenerator();

  const data = generator.generateData({
    name: 'Mock Form',
    sections: [{
      id: 'section_1',
      columns: [{
        id: 'column_1',
        fields: [
          { id: 'field_1', fieldname: 'full_name', fieldtype: 'Data', label: 'Full Name' },
          { id: 'field_2', fieldname: 'score', fieldtype: 'Float', label: 'Score' },
          { id: 'field_3', fieldname: 'approved', fieldtype: 'Check', label: 'Approved' },
          { id: 'field_4', fieldname: 'status', fieldtype: 'Select', label: 'Status', options: 'Pending\nApproved' },
          { id: 'field_5', fieldname: 'bio', fieldtype: 'Text Editor', label: 'Bio' },
          { id: 'field_6', fieldname: 'attachment', fieldtype: 'Attach', label: 'Attachment' },
          { id: 'field_7', fieldname: 'signature', fieldtype: 'Signature', label: 'Signature' },
          { id: 'field_8', fieldname: 'identifier', fieldtype: 'Link', label: 'Identifier' },
          { id: 'field_9', fieldname: 'line_items', fieldtype: 'Table', label: 'Line Items', table_fields: [
            { id: 'col_1', fieldname: 'item_name', fieldtype: 'Data', label: 'Item Name' },
            { id: 'col_2', fieldname: 'quantity', fieldtype: 'Int', label: 'Quantity' }
          ]},
          { id: 'field_10', fieldname: 'prefilled', fieldtype: 'Data', label: 'Prefilled', default: 'Existing Value' }
        ]
      }]
    }]
  });

  assert.equal(data.full_name, 'Sample Full Name');
  assert.equal(typeof data.score, 'number');
  assert.equal(data.approved, 1);
  assert.equal(data.status, 'Pending');
  assert.match(data.bio, /Bio/);
  assert.match(data.attachment, /sample\.pdf/);
  assert.match(data.signature, /^data:image\/png;base64,/);
  assert.equal(data.identifier, 'LINK-REC-001');
  assert.equal(data.prefilled, 'Existing Value');
  assert.equal(Array.isArray(data.line_items), true);
  assert.equal(data.line_items.length, 1);
  assert.equal(typeof data.line_items[0].item_name, 'string');
  assert.equal(typeof data.line_items[0].quantity, 'number');
});

test('generateData reads fields from stepper schemas as well as flat schemas', () => {
  const generator = new VantMockGenerator();

  const data = generator.generateData({
    name: 'Stepper Mock',
    is_stepper: true,
    sections: [],
    steps: [{
      id: 'step_1',
      title: 'Details',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [
            { id: 'field_1', fieldname: 'visit_date', fieldtype: 'Date', label: 'Visit Date' },
            { id: 'field_2', fieldname: 'visit_time', fieldtype: 'Time', label: 'Visit Time' }
          ]
        }]
      }]
    }]
  });

  assert.match(data.visit_date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(data.visit_time, '14:30');
});
