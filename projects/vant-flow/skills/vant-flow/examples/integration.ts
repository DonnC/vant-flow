import { Component } from '@angular/core';
import { DocumentDefinition, VfRenderer, VfRendererButtonEvent, VfRuntimeMetadata } from 'vant-flow';

@Component({
  selector: 'app-vant-example',
  standalone: true,
  imports: [VfRenderer],
  template: `<vf-renderer [document]="schema" [metadata]="metadata" (formAction)="handleAction($event)" />`
})
export class VantExample {
  // Bootstrap the host app with provideVfFlow(); the host owns persistence.
  readonly metadata: VfRuntimeMetadata = { document_type: 'Request', document_name: 'new' };
  readonly schema: DocumentDefinition = {
    name: 'Request',
    sections: [{ id: 'main', label: 'Details', columns: [{ id: 'details', fields: [
      { id: 'subject', fieldname: 'subject', label: 'Subject', fieldtype: 'Data', mandatory: true },
      { id: 'status', fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Open\nDone', default: 'Open' }
    ] }] }],
    client_script: "frm.on('status', (value, frm) => { frm.set_intro('Status: ' + value, 'blue'); });"
  };
  lastAction?: VfRendererButtonEvent;
  handleAction(event: VfRendererButtonEvent): void {
    this.lastAction = event;
  }
}
