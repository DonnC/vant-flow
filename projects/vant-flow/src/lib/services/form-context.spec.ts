import { VfFormContext } from './form-context';
import { VfUtilityService } from './app-utility.service';
import { VfBuilderState } from './builder-state.service';
import { DocumentDefinition } from '../models/document.model';

describe('VfFormContext', () => {
  let context: VfFormContext;
  let appUtility: jasmine.SpyObj<VfUtilityService>;
  let state: VfBuilderState;
  let formData: Record<string, any>;

  beforeEach(() => {
    appUtility = jasmine.createSpyObj<VfUtilityService>('VfUtilityService', [
      'show_alert',
      'confirm',
      'prompt',
      'call',
      'freeze',
      'unfreeze',
      'scrollToTop'
    ]);
    state = {} as VfBuilderState;
    context = new VfFormContext(appUtility, state);
    formData = {};
  });

  it('initializes field, section, and step signals from the document', () => {
    const document: DocumentDefinition = {
      name: 'Stepper Form',
      sections: [{
        id: 'section_flat',
        columns: [{
          id: 'column_flat',
          fields: [{ id: 'field_flat', fieldname: 'full_name', fieldtype: 'Data', label: 'Full Name' }]
        }]
      }],
      steps: [{
        id: 'step_1',
        title: 'Details',
        sections: [{
          id: 'section_step',
          columns: [{
            id: 'column_step',
            fields: [{ id: 'field_step', fieldname: 'age', fieldtype: 'Int', label: 'Age' }]
          }]
        }]
      }],
      actions: {
        submit: { label: 'Send', visible: true }
      }
    };

    context.initialize(document, formData, { role: 'admin' });

    expect(context.getFieldSignal('full_name', 'label')()).toBe('Full Name');
    expect(context.getFieldSignal('age', 'label')()).toBe('Age');
    expect(context.getSectionSignal('section_step', 'id')()).toBe('section_step');
    expect(context.getStepSignal('step_1', 'title')()).toBe('Details');
    expect(context.actionsConfig()?.submit?.label).toBe('Send');
    expect(context.metadata).toEqual({ role: 'admin' });
  });

  it('updates a nested table column through set_df_property', () => {
    const document: DocumentDefinition = {
      name: 'Table Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [{
            id: 'field_1',
            fieldname: 'items',
            fieldtype: 'Table',
            label: 'Items',
            table_fields: [
              { id: 'col_1', fieldname: 'attachment_col', fieldtype: 'Attach', label: 'Attachment' }
            ]
          }]
        }]
      }]
    };

    context.initialize(document, formData);
    context.set_df_property('items', 'hidden', true, 'attachment_col');

    const table = context.getFieldSignal('items', 'table_fields')();
    expect(table?.[0].hidden).toBeTrue();
  });

  it('treats reqd as an alias of mandatory in set_df_property', () => {
    const document: DocumentDefinition = {
      name: 'Required Alias Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [
            { id: 'field_1', fieldname: 'restored_at', fieldtype: 'Datetime', label: 'Restored At', mandatory: false }
          ]
        }]
      }]
    };

    context.initialize(document, formData);
    context.set_df_property('restored_at', 'reqd', true);

    expect(context.getFieldSignal('restored_at', 'mandatory')()).toBeTrue();
  });

  it('skips hidden steps when moving to the next step', () => {
    const document: DocumentDefinition = {
      name: 'Stepper Form',
      is_stepper: true,
      sections: [],
      steps: [
        { id: 'step_1', title: 'One', sections: [] },
        { id: 'step_2', title: 'Two', sections: [] },
        { id: 'step_3', title: 'Three', sections: [] }
      ]
    };

    context.initialize(document, formData);
    context.set_step_hidden('step_2', true);

    context.next_step();

    expect(context.currentStepIndex()).toBe(2);
    expect(appUtility.scrollToTop).toHaveBeenCalled();
  });

  it('does not move to the next step when before_step_change returns false', () => {
    const document: DocumentDefinition = {
      name: 'Stepper Form',
      is_stepper: true,
      sections: [],
      steps: [
        { id: 'step_1', title: 'One', sections: [] },
        { id: 'step_2', title: 'Two', sections: [] }
      ]
    };

    context.initialize(document, formData);
    context.on('before_step_change', () => false);

    context.next_step();

    expect(context.currentStepIndex()).toBe(0);
    expect(appUtility.scrollToTop).not.toHaveBeenCalled();
  });

  it('sets multiple values and triggers change handlers for each field', () => {
    const changeSpy = jasmine.createSpy('changeSpy');
    context.initialize({ name: 'Value Form', sections: [] }, formData);
    context.on('first_name', changeSpy);
    context.on('age', changeSpy);

    context.set_value({ first_name: 'Alice', age: 30 });

    expect(formData['first_name']).toBe('Alice');
    expect(formData['age']).toBe(30);
    expect(changeSpy).toHaveBeenCalledTimes(2);
    expect(context.valueUpdateSignal()).toBe(3);
  });

  it('resets flat form fields to defaults and triggers refresh', () => {
    const refreshSpy = jasmine.createSpy('refreshSpy');
    const fieldSpy = jasmine.createSpy('fieldSpy');
    const document: DocumentDefinition = {
      name: 'Reset Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [
            { id: 'field_1', fieldname: 'full_name', fieldtype: 'Data', label: 'Full Name', default: 'Jane' },
            { id: 'field_2', fieldname: 'is_active', fieldtype: 'Check', label: 'Is Active', default: true },
            { id: 'field_3', fieldname: 'items', fieldtype: 'Table', label: 'Items', default: [{ item: 'A' }] }
          ]
        }]
      }]
    };

    context.initialize(document, formData);
    context.on('refresh', refreshSpy);
    context.on('full_name', fieldSpy);
    context.on('is_active', fieldSpy);
    context.on('items', fieldSpy);

    context.set_intro('Temporary', 'red');
    context.add_custom_button('Approve', () => undefined);
    context.set_readonly(true);
    context.reset();

    expect(formData['full_name']).toBe('Jane');
    expect(formData['is_active']).toBe(1);
    expect(formData['items']).toEqual([{ item: 'A' }]);
    expect(context.dynamicIntro()).toBeNull();
    expect(context.customButtons()).toEqual([]);
    expect(context.isReadOnly()).toBeFalse();
    expect(refreshSpy).toHaveBeenCalled();
    expect(fieldSpy).toHaveBeenCalledTimes(3);
  });

  it('executes client scripts that register refresh hooks', () => {
    const document: DocumentDefinition = {
      name: 'Script Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [
            { id: 'field_1', fieldname: 'status', fieldtype: 'Data', label: 'Status' }
          ]
        }]
      }]
    };

    context.initialize(document, formData);
    context.execute(`
      frm.on('refresh', (_val, frm) => {
        frm.set_intro('Loaded from script', 'orange');
        frm.set_value('status', 'Ready');
      });
    `, 'refresh');

    context.trigger('refresh');

    expect(context.dynamicIntro()).toEqual({ message: 'Loaded from script', color: 'orange' });
    expect(formData['status']).toBe('Ready');
  });

  it('executes field change scripts and mutates field state through frm', () => {
    const document: DocumentDefinition = {
      name: 'Script Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [
            { id: 'field_1', fieldname: 'status', fieldtype: 'Data', label: 'Status' },
            { id: 'field_2', fieldname: 'remarks', fieldtype: 'Text', label: 'Remarks', hidden: false }
          ]
        }]
      }]
    };

    context.initialize(document, formData);
    context.execute(`
      frm.on('status', (val, frm) => {
        if (val === 'Approved') {
          frm.set_df_property('remarks', 'hidden', true);
        }
      });
    `, 'status');

    context.set_value('status', 'Approved');

    expect(context.getFieldSignal('remarks', 'hidden')()).toBeTrue();
  });

  it('exposes runtime metadata to scripts during refresh and field events', () => {
    const document: DocumentDefinition = {
      name: 'Metadata Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [
            { id: 'field_1', fieldname: 'quality_score', fieldtype: 'Int', label: 'Quality Score' },
            { id: 'field_2', fieldname: 'remarks', fieldtype: 'Text', label: 'Remarks' }
          ]
        }]
      }]
    };

    context.initialize(document, formData, {
      currentUser: { role: 'Manager', name: 'Alice' },
      inspectionMode: 'strict'
    });
    context.execute(`
      frm.on('refresh', (_val, frm) => {
        frm.set_value('remarks', frm.metadata?.currentUser?.name || 'Unknown');
      });

      frm.on('quality_score', (val, frm) => {
        if (frm.metadata?.inspectionMode === 'strict' && val < 90) {
          frm.set_df_property('remarks', 'hidden', true);
        }
      });
    `, 'refresh');

    context.trigger('refresh');
    context.set_value('quality_score', 85);

    expect(formData['remarks']).toBe('Alice');
    expect(context.getFieldSignal('remarks', 'hidden')()).toBeTrue();
  });

  it('updates link filters through frm.set_filter and bumps the refresh signal', () => {
    const document: DocumentDefinition = {
      name: 'Link Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [{
            id: 'field_1',
            fieldname: 'item',
            fieldtype: 'Link',
            label: 'Item',
            link_config: {
              data_source: '/api/items/search',
              mapping: { id: 'id', title: 'name' },
              filters: { category: 'Voucher' }
            }
          }]
        }]
      }]
    };

    context.initialize(document, formData);
    const before = context.getLinkRefreshSignal('item')();

    context.set_filter('item', { category: 'Voucher', brand: 'MTN' });

    expect(context.getFieldSignal('item', 'link_config')()?.filters).toEqual({
      category: 'Voucher',
      brand: 'MTN'
    });
    expect(context.getLinkRefreshSignal('item')()).toBe(before + 1);
  });
});
