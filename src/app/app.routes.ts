import { Routes } from '@angular/router';
import { LandingComponent } from './demo-pages/landing.component';
import { BuilderDemoComponent } from './demo-pages/builder-demo.component';
import { RendererDemoComponent } from './demo-pages/renderer-demo.component';
import { AdminDemoComponent } from './demo-pages/admin-demo.component';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'builder', component: BuilderDemoComponent },
    { path: 'renderer', component: RendererDemoComponent },
    { path: 'admin', component: AdminDemoComponent },
    { path: '**', redirectTo: '' }
];
