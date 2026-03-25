import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VfPropertyEditor } from './property-editor.component';

describe('VfPropertyEditor', () => {
  let component: VfPropertyEditor;
  let fixture: ComponentFixture<VfPropertyEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VfPropertyEditor]
    }).compileComponents();

    fixture = TestBed.createComponent(VfPropertyEditor);
    component = fixture.componentInstance;

    component.state.document.set({
      name: 'Test Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: []
        }]
      }]
    });
  });

  it('keeps a newly added fieldname in sync with label changes until the user edits fieldname manually', () => {
    const field = component.state.addField('section_1', 'column_1', 'Data');
    fixture.detectChanges();

    component.update('label', 'Inspection Batch Number');
    expect(component.state.selectedField()?.fieldname).toBe('inspection_batch_number');

    component.update('fieldname', 'custom db key');
    expect(component.state.selectedField()?.fieldname).toBe('custom_db_key');

    component.update('label', 'Another Label');
    expect(component.state.selectedField()?.fieldname).toBe('custom_db_key');
  });

  it('creates a unique sanitized fieldname when a label would collide with an existing field', () => {
    component.state.addField('section_1', 'column_1', 'Data');
    component.update('label', 'Status');

    const secondField = component.state.addField('section_1', 'column_1', 'Data');
    fixture.detectChanges();

    component.update('label', 'Status');

    expect(component.state.selectedField()?.id).toBe(secondField.id);
    expect(component.state.selectedField()?.fieldname).toBe('status_2');
  });
});
