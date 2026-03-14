import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { provideQuillConfig } from 'ngx-quill';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    // Set up custom typings for frm and app
    provideMonacoEditor({
      baseUrl: 'assets/monaco-editor/vs'
    }),
    provideQuillConfig({
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike', 'clean'],
          [{ color: [] }, { background: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
          [{ align: [] }, { indent: '-1' }, { indent: '+1' }]
        ]
      }
    })
  ]
};
