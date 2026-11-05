import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { VfPromptModal } from './prompt-modal.component';
import { VfFormContext } from '../services/form-context';

describe('Prompt media integration', () => {
  it('passes the owning form context to media uploads in a table-row prompt', async () => {
    await TestBed.configureTestingModule({ imports: [VfPromptModal], providers: [provideHttpClient()] }).compileComponents();
    const fixture = TestBed.createComponent(VfPromptModal);
    const frm = {} as VfFormContext;
    const handler = jasmine.createSpy('mediaHandler').and.resolveTo({ name: 'photo.png', fileId: 'stored' });
    fixture.componentInstance.frm = frm;
    fixture.componentInstance.mediaHandler = handler;
    fixture.componentInstance.fields = [{ id: 'upload', fieldname: 'upload', label: 'Upload', fieldtype: 'Attach' }];
    fixture.detectChanges();
    await fixture.componentInstance.fieldComponents.first.onCameraSelected({ target: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] } });
    expect(handler.calls.mostRecent().args[1].frm).toBe(frm);
    expect(fixture.componentInstance.values['upload'].fileId).toBe('stored');
    fixture.destroy();
  });
});
