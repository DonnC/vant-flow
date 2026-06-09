import { VfBuilderState } from './builder-state.service';
import { DocumentDefinition } from '../models/document.model';

describe('VfBuilderState', () => {
  let state: VfBuilderState;

  beforeEach(() => {
    state = new VfBuilderState();
  });

  it('imports a valid document, restores default actions, and clears selections', () => {
    state.selectedFieldId.set('field_1');
    state.selectedSectionId.set('section_1');
    state.selectedStepId.set('step_1');

    const raw = JSON.stringify({
      name: 'Imported Form',
      sections: [],
      client_script: 'frm.on("refresh", () => {})'
    });

    const result = state.importDocument(raw);

    expect(result).toBeTrue();
    expect(state.document().name).toBe('Imported Form');
    expect(state.document().actions?.submit?.label).toBe('Submit');
    expect(state.selectedFieldId()).toBeNull();
    expect(state.selectedSectionId()).toBeNull();
    expect(state.selectedStepId()).toBeNull();
  });

  it('rejects invalid JSON payloads', () => {
    spyOn(console, 'error');

    const result = state.importDocument('{bad json');

    expect(result).toBeFalse();
    expect(state.document().name).toBe('New Document');
  });

  it('collects unique data group suggestions across sections', () => {
    state.document.set({
      name: 'Grouped Form',
      sections: [
        {
          id: 'section_1',
          columns: [{
            id: 'column_1',
            fields: [
              { id: 'field_1', fieldname: 'first_name', fieldtype: 'Data', label: 'First Name', data_group: 'user' },
              { id: 'field_2', fieldname: 'city', fieldtype: 'Data', label: 'City', data_group: 'user.profile' }
            ]
          }]
        },
        {
          id: 'section_2',
          columns: [{
            id: 'column_2',
            fields: [
              { id: 'field_3', fieldname: 'country', fieldtype: 'Data', label: 'Country', data_group: 'user' }
            ]
          }]
        }
      ]
    });

    expect(state.dataGroupSuggestions()).toEqual(['user', 'user.profile']);
  });

  it('selects the parent step when a stepper field is selected', () => {
    const document: DocumentDefinition = {
      name: 'Stepper Form',
      is_stepper: true,
      sections: [],
      steps: [
        {
          id: 'step_1',
          title: 'Basic Details',
          sections: [{
            id: 'section_1',
            columns: [{
              id: 'column_1',
              fields: [
                { id: 'field_1', fieldname: 'full_name', fieldtype: 'Data', label: 'Full Name' }
              ]
            }]
          }]
        }
      ]
    };

    state.document.set(document);

    state.selectField('field_1');

    expect(state.selectedFieldId()).toBe('field_1');
    expect(state.selectedStepId()).toBe('step_1');
    expect(state.selectedField()?.fieldname).toBe('full_name');
  });

  it('moves a field between columns without losing the field', () => {
    state.document.set({
      name: 'Move Form',
      sections: [{
        id: 'section_1',
        columns: [
          {
            id: 'column_1',
            fields: [
              { id: 'field_1', fieldname: 'source_field', fieldtype: 'Data', label: 'Source Field' }
            ]
          },
          {
            id: 'column_2',
            fields: []
          }
        ]
      }]
    });

    state.moveField('section_1', 'column_1', 0, 'section_1', 'column_2', 0);

    const section = state.document().sections[0];
    expect(section.columns[0].fields.length).toBe(0);
    expect(section.columns[1].fields.length).toBe(1);
    expect(section.columns[1].fields[0].fieldname).toBe('source_field');
  });

  it('defaults new fields to indexed false', () => {
    state.document.set({
      name: 'Indexed Defaults',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: []
        }]
      }]
    });

    const field = state.addField('section_1', 'column_1', 'Data');

    expect(field.indexed).toBeFalse();
    expect(state.document().sections[0].columns[0].fields[0].indexed).toBeFalse();
  });

  it('defaults new child tables to non-virtual and hides them from list view by default', () => {
    state.document.set({
      name: 'Child Table Defaults',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: []
        }]
      }]
    });

    const field = state.addField('section_1', 'column_1', 'ChildTable');

    expect(field.virtual).toBeFalse();
    expect(field.in_list_view).toBeFalse();
    expect(field.label).toBe('Child Rows');
  });

  it('collapses a section back to one column and drops fields from removed columns', () => {
    state.document.set({
      name: 'Layout Form',
      sections: [{
        id: 'section_1',
        columns_count: 2,
        columns: [
          {
            id: 'column_1',
            fields: [{ id: 'field_1', fieldname: 'first_name', fieldtype: 'Data', label: 'First Name' }]
          },
          {
            id: 'column_2',
            fields: [{ id: 'field_2', fieldname: 'last_name', fieldtype: 'Data', label: 'Last Name' }]
          }
        ]
      }]
    });

    state.updateSectionColumns('section_1', 1);

    const section = state.document().sections[0];
    expect(section.columns_count).toBe(1);
    expect(section.columns.length).toBe(1);
    expect(section.columns[0].fields.map(field => field.fieldname)).toEqual(['first_name']);
  });

  it('removes a free-added column and drops the deleted column fields', () => {
    state.document.set({
      name: 'Columns Form',
      sections: [{
        id: 'section_1',
        columns_count: 3,
        columns: [
          {
            id: 'column_1',
            fields: [{ id: 'field_1', fieldname: 'alpha', fieldtype: 'Data', label: 'Alpha' }]
          },
          {
            id: 'column_2',
            fields: [{ id: 'field_2', fieldname: 'beta', fieldtype: 'Data', label: 'Beta' }]
          },
          {
            id: 'column_3',
            fields: []
          }
        ]
      }]
    });

    state.removeColumn('section_1', 'column_2');

    const section = state.document().sections[0];
    expect(section.columns_count).toBe(2);
    expect(section.columns.length).toBe(2);
    expect(section.columns[0].fields.map(field => field.fieldname)).toEqual(['alpha']);
    expect(section.columns.some(column => column.fields.some(field => field.fieldname === 'beta'))).toBeFalse();
  });
});
