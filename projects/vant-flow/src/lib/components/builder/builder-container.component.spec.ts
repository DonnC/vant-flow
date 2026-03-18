import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { VfBuilder } from './builder-container.component';
import { VfRenderer } from '../form-renderer/form-renderer.component';

describe('VfBuilder', () => {
  let component: VfBuilder;
  let fixture: ComponentFixture<VfBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VfBuilder, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(VfBuilder);
    component = fixture.componentInstance;
    component.initialSchema = {
      name: 'Preview Form',
      sections: [{
        id: 'section_1',
        columns: [{
          id: 'column_1',
          fields: [{
            id: 'field_1',
            fieldname: 'status',
            fieldtype: 'Data',
            label: 'Status'
          }]
        }]
      }]
    };
  });

  it('forwards preview metadata to the renderer only in preview mode', () => {
    component.previewMetadata = { currentUser: { role: 'Manager' } };
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(VfRenderer))).toBeNull();

    component.setMode('preview');
    fixture.detectChanges();

    const renderer = fixture.debugElement.query(By.directive(VfRenderer)).componentInstance as VfRenderer;
    expect(renderer.metadata).toEqual({ currentUser: { role: 'Manager' } });
  });

  it('keeps preview metadata out of the document schema', () => {
    fixture.detectChanges();
    const originalDocument = component.state.document();

    component.onPreviewMetadataInput('{"currentUser":{"name":"Alice"}}');

    expect(component.previewMetadataValue).toEqual({ currentUser: { name: 'Alice' } });
    expect(component.state.document()).toEqual(originalDocument);
    expect(component.state.document().metadata).toBeUndefined();
  });

  it('keeps the last valid preview metadata when JSON becomes invalid', () => {
    fixture.detectChanges();

    component.onPreviewMetadataInput('{"currentUser":{"role":"Manager"}}');
    expect(component.previewMetadataValue).toEqual({ currentUser: { role: 'Manager' } });

    component.onPreviewMetadataInput('{bad json');

    expect(component.previewMetadataError).toContain('Invalid JSON');
    expect(component.previewMetadataValue).toEqual({ currentUser: { role: 'Manager' } });
  });
});
