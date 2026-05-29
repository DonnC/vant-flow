import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { VfField } from './form-field.component';

describe('VfField', () => {
  let fixture: ComponentFixture<VfField>;
  let component: VfField;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VfField, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(VfField);
    component = fixture.componentInstance;
    component.field = {
      id: 'attach_1',
      fieldname: 'site_photo',
      fieldtype: 'Attach',
      label: 'Site Photo',
      options: 'image/* | 5MB | 1'
    };
  });

  it('keeps camera capture disabled by default', () => {
    fixture.detectChanges();

    expect(component.cameraCaptureEnabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('input[capture]')).toBeNull();
  });

  it('uses the existing attach pipeline when a camera image is selected', async () => {
    component.field = {
      ...component.field,
      attach_config: { enable_capture: true }
    };

    const emitted: any[] = [];
    component.valueChange.subscribe(value => emitted.push(value));

    fixture.detectChanges();

    const file = new File(['image-bytes'], 'captured-photo.jpg', { type: 'image/jpeg' });
    await component.onCameraSelected({
      target: {
        files: {
          0: file,
          length: 1,
          item: (index: number) => index === 0 ? file : null
        }
      }
    });

    expect(component.cameraCaptureEnabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('input[capture]')).not.toBeNull();
    expect(emitted.length).toBe(1);
    expect(emitted[0].name).toBe('captured-photo.jpg');
    expect(emitted[0].type).toBe('image/jpeg');
  });

  it('renders url preset data fields with a clickable helper link', () => {
    component.field = {
      id: 'data_1',
      fieldname: 'website',
      fieldtype: 'Data',
      label: 'Website',
      regex: 'Url'
    };
    component.value = 'example.com';

    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input');
    const anchor = fixture.nativeElement.querySelector('a');

    expect(input?.type).toBe('url');
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
  });
});
