import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { VfField } from './form-field.component';

describe('VfField', () => {
  function imageUrl(color = 'black') {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2;
    canvas.getContext('2d')!.fillStyle = color;
    canvas.getContext('2d')!.fillRect(0, 0, 2, 2);
    return canvas.toDataURL();
  }
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

  it('keeps empty optional media fields quiet', () => {
    component.readOnly = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.vf-media-warning')).toBeNull();
  });

  it('shows one quiet warning for a signature without a usable reference', async () => {
    component.field = { ...component.field, fieldtype: 'Signature' };
    component.value = { name: 'signature.png', metadata: {} };
    component.readOnly = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const warnings = fixture.nativeElement.querySelectorAll('.vf-media-warning');
    expect(warnings.length).toBe(1);
    expect(warnings[0].getAttribute('aria-label')).toContain('unavailable');
    expect(fixture.nativeElement.textContent).not.toContain('Signature Captured');
    expect(fixture.nativeElement.querySelector('vf-icon-button')).toBeNull();
  });

  it('does not repeatedly resolve missing attachments and permits an explicit retry', async () => {
    const file = { name: 'report.pdf', metadata: { customKey: 'opaque-reference' }, type: 'application/pdf' };
    component.value = file;
    component.readOnly = true;
    const resolver = jasmine.createSpy('resolver').and.resolveTo(null);
    component.mediaResolver = resolver;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    fixture.detectChanges();
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('report.pdf');
    expect(fixture.nativeElement.querySelectorAll('.vf-media-warning').length).toBe(1);
    resolver.and.resolveTo('/download/report.pdf');
    const open = spyOn(window, 'open').and.returnValue({} as Window);
    await component.downloadFile(file);
    fixture.detectChanges();
    expect(open).toHaveBeenCalledWith('/download/report.pdf', '_blank', 'noopener,noreferrer');
    expect(fixture.nativeElement.querySelector('.vf-media-warning')).toBeNull();
  });

  it('turns failed image previews into a small warning and clears it for a new value', () => {
    component.value = { name: 'photo.png', type: 'image/png', url: '/missing.png' };
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('img');
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.vf-media-warning')?.getAttribute('aria-label')).toBe('Image preview unavailable');
    component.value = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.vf-media-warning')).toBeNull();
  });

  it('keeps resolver failures quiet in compact table-style fields', async () => {
    component.compact = true;
    component.value = { name: 'photo.png', type: 'image/png', fileId: 'private-file' };
    const resolver = jasmine.createSpy('resolver').and.rejectWith(new Error('Access denied'));
    component.mediaResolver = resolver;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.vf-media-warning').length).toBe(1);
    fixture.detectChanges();
    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it('flags a signature image load error without claiming the signature is captured', async () => {
    const image = { onload: null, onerror: null, src: '' } as unknown as HTMLImageElement;
    spyOn(window, 'Image').and.returnValue(image);
    component.field = { ...component.field, fieldtype: 'Signature' };
    component.value = '/signature.png';
    fixture.detectChanges();
    await fixture.whenStable();
    image.onerror?.(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.vf-media-warning').length).toBe(1);
    expect(fixture.nativeElement.textContent).not.toContain('Signature Captured');
    component.value = '';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.vf-media-warning')).toBeNull();
  });

  it('does not emit a stored signature when an initiated upload fails', async () => {
    component.field = { ...component.field, fieldtype: 'Signature' };
    component.mediaHandler = async () => { throw new Error('Server returned no file ID'); };
    const changed = jasmine.createSpy('valueChange');
    component.valueChange.subscribe(changed);
    spyOn(console, 'error');
    fixture.detectChanges();
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    spyOn(canvas, 'toBlob').and.callFake(callback => callback(new Blob(['signature'], { type: 'image/png' })));
    component.isDrawing = true;
    component.stopDrawing();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(changed).not.toHaveBeenCalled();
    expect(component.signatureMediaIssue).toBe('Signature upload failed');
    expect(fixture.nativeElement.querySelectorAll('.vf-media-warning').length).toBe(1);
  });

  it('does not share resolution results between files with the same name', async () => {
    const firstUrl = imageUrl('black');
    const secondUrl = imageUrl('red');
    component.field = { ...component.field, options: 'image/* | 5MB | 2' };
    component.value = [
      { name: 'photo.png', type: 'image/png', metadata: { storageKey: 'one' } },
      { name: 'photo.png', type: 'image/png', metadata: { storageKey: 'two' } },
    ];
    const resolver = jasmine.createSpy('resolver').and.callFake(async (media: any) => media.metadata.storageKey === 'one' ? firstUrl : secondUrl);
    component.mediaResolver = resolver;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(resolver).toHaveBeenCalledTimes(2);
    const sources = Array.from(fixture.nativeElement.querySelectorAll('img') as NodeListOf<HTMLImageElement>).map(image => image.getAttribute('src'));
    expect(sources).toEqual([firstUrl, secondUrl]);
  });

  it('ignores an outdated resolution after the field value changes', async () => {
    const freshUrl = imageUrl();
    let resolveOld!: (value: null) => void;
    component.mediaResolver = async (media: any) => media.metadata.key === 'old'
      ? new Promise<null>(resolve => { resolveOld = resolve; })
      : freshUrl;
    component.value = { name: 'old.png', type: 'image/png', metadata: { key: 'old' } };
    fixture.detectChanges();
    await Promise.resolve();
    component.value = { name: 'new.png', type: 'image/png', metadata: { key: 'new' } };
    fixture.detectChanges();
    resolveOld(null);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.vf-media-warning')).toBeNull();
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe(freshUrl);
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

  it('renders html fields as trusted markup', () => {
    component.field = {
      id: 'html_1',
      fieldname: 'notice',
      fieldtype: 'Html',
      label: 'Notice'
    };
    component.value = '<div onclick="alert(1)">Hello<script>alert(2)</script><a href="javascript:alert(3)">Open</a></div>';

    fixture.detectChanges();

    const htmlContainer = fixture.nativeElement.querySelector('.editor-preview__content') as HTMLElement | null;
    const rendered = htmlContainer?.innerHTML ?? '';

    expect(rendered).toContain('Hello');
    expect(rendered).toContain('<script>alert(2)</script>');
    expect(rendered).toContain('onclick="alert(1)"');
    expect(rendered).toContain('href="javascript:alert(3)"');
  });
});
