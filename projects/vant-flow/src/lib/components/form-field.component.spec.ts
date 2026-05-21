import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { VfField } from './form-field.component';

describe('VfField Attach Camera Capture', () => {
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
});
