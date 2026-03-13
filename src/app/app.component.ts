import { Component } from '@angular/core';
import { BuilderContainerComponent } from './components/builder/builder-container.component';
import { ToastOutletComponent } from './components/builder/toast-outlet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BuilderContainerComponent, ToastOutletComponent],
  template: `
    <app-builder-container></app-builder-container>
    <app-toast-outlet></app-toast-outlet>
  `
})
export class AppComponent { }
