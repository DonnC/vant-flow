import { extractBaobabContract } from './baobab-contract';
import { DocumentDefinition } from '../models/document.model';

describe('extractBaobabContract', () => {
  it('flattens stepper layouts into a Baobab field contract', () => {
    const document: Pick<DocumentDefinition, 'sections' | 'steps' | 'is_stepper'> = {
      is_stepper: true,
      sections: [],
      steps: [
        {
          id: 'step_1',
          title: 'Basics',
          sections: [
            {
              id: 'section_1',
              columns: [
                {
                  id: 'column_1',
                  fields: [
                    {
                      id: 'field_1',
                      fieldname: 'website',
                      fieldtype: 'Url',
                      label: 'Website',
                      default: 'https://example.com',
                      mandatory: true,
                      indexed: true
                    },
                    {
                      id: 'field_2',
                      fieldname: 'customer',
                      fieldtype: 'Link',
                      label: 'Customer',
                      options: 'Customer',
                      baobab: {
                        unique: true,
                        virtual: false
                      }
                    },
                    {
                      id: 'field_3',
                      fieldname: 'line_items',
                      fieldtype: 'JSONTable',
                      label: 'Line Items'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    expect(extractBaobabContract(document)).toEqual([
      {
        fieldname: 'website',
        fieldtype: 'Url',
        options: undefined,
        mandatory: true,
        default: 'https://example.com',
        index: true,
        unique: false,
        virtual: false
      },
      {
        fieldname: 'customer',
        fieldtype: 'Link',
        options: 'Customer',
        mandatory: false,
        default: undefined,
        index: false,
        unique: true,
        virtual: false
      },
      {
        fieldname: 'line_items',
        fieldtype: 'JSONTable',
        options: undefined,
        mandatory: false,
        default: undefined,
        index: false,
        unique: false,
        virtual: true
      }
    ]);
  });

  it('supports flat forms and top-level virtual overrides', () => {
    const document: Pick<DocumentDefinition, 'sections' | 'steps' | 'is_stepper'> = {
      is_stepper: false,
      sections: [
        {
          id: 'section_1',
          columns: [
            {
              id: 'column_1',
              fields: [
                {
                  id: 'field_1',
                  fieldname: 'invoice_items',
                  fieldtype: 'ChildTable',
                  label: 'Invoice Items',
                  options: 'Sales Invoice Item',
                  virtual: false,
                  unique: false
                }
              ]
            }
          ]
        }
      ]
    };

    expect(extractBaobabContract(document)).toEqual([
      {
        fieldname: 'invoice_items',
        fieldtype: 'ChildTable',
        options: 'Sales Invoice Item',
        mandatory: false,
        default: undefined,
        index: false,
        unique: false,
        virtual: false
      }
    ]);
  });
});
