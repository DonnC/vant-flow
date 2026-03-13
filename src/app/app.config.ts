import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    // Set up custom typings for frm and app
    provideMonacoEditor({
      baseUrl: 'assets/monaco-editor/vs'
    })
  ]
};
