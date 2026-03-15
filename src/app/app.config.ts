import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { provideQuillConfig } from 'ngx-quill';
import QuillTableBetter from "quill-table-better";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAnimationsAsync(),
    // Set up custom typings for frm and app
    provideMonacoEditor({
      baseUrl: 'assets/monaco-editor/vs'
    }),
    provideQuillConfig({
      modules: {
        table: false, // disable default table module
        'table-better': {
          columnMinWidth: 100,
          language: 'en_US',
          menus: [
            'column',
            'row',
            'merge',
            'table',
            'cell',
            'wrap',
            'copy',
            'delete',
          ],
          toolbarTable: true,
        },
        keyboard: {
            bindings: QuillTableBetter.keyboardBindings,
        },
        toolbar: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike', 'clean'],
          [{ color: [] }, { background: [] }],
          ['blockquote', 'code-block', 'table-better'],
          ['link', 'image'],
          [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
          [{ align: [] }, { indent: '-1' }, { indent: '+1' }, { font: [] }]
        ]
      }
    })
  ]
};
