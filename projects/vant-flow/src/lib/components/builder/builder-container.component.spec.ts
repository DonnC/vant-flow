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
  it('starts with the preview metadata editor collapsed and expands on click', () => {
    fixture.detectChanges();

    component.setMode('preview');
    fixture.detectChanges();

    const toggleButton = fixture.debugElement.query(By.css('button[aria-controls="preview-metadata-panel"]'));
    expect(toggleButton).not.toBeNull();
    expect(toggleButton.attributes['aria-expanded']).toBe('false');
    expect(fixture.debugElement.query(By.css('#preview-metadata-panel'))).toBeNull();

    toggleButton.nativeElement.click();
    fixture.detectChanges();

    expect(toggleButton.attributes['aria-expanded']).toBe('true');
    expect(fixture.debugElement.query(By.css('#preview-metadata-panel'))).not.toBeNull();
  });

  it('shows the script tab by default when form settings are selected', () => {
    fixture.detectChanges();

    component.state.selectFormSettings();
    fixture.detectChanges();

    const tabs = fixture.debugElement.queryAll(By.css('aside button'));
    expect(tabs.some((tab) => tab.nativeElement.textContent.includes('Script'))).toBeTrue();
  });

  it('hides the script tab when showScriptEditor is false', () => {
    component.showScriptEditor = false;
    fixture.detectChanges();

    component.state.selectFormSettings();
    fixture.detectChanges();

    const tabs = fixture.debugElement.queryAll(By.css('aside button'));
    expect(tabs.some((tab) => tab.nativeElement.textContent.includes('Script'))).toBeFalse();
  });

  it('reloads the builder document when initialSchema changes after mount', () => {
    fixture.detectChanges();

    component.initialSchema = {
      name: 'Updated Form',
      sections: [{
        id: 'section_2',
        columns: [{
          id: 'column_2',
          fields: [{
            id: 'field_2',
            fieldname: 'reference',
            fieldtype: 'Data',
            label: 'Reference',
          }],
        }],
      }],
    };

    component.ngOnChanges({
      initialSchema: {
        previousValue: null,
        currentValue: component.initialSchema,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.state.document().name).toBe('Updated Form');
    expect(component.state.document().sections[0]?.columns[0]?.fields[0]?.label).toBe('Reference');
  });

  it('does not clear the current property selection when the parent echoes back the same schema', () => {
    fixture.detectChanges();

    component.state.selectFormSettings();
    const echoedSchema = component.state.document();

    component.ngOnChanges({
      initialSchema: {
        previousValue: component.initialSchema,
        currentValue: echoedSchema,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.state.showFormSettings()).toBeTrue();
  });
});

