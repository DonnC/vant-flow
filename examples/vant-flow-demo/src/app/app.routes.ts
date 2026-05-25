import { Routes } from '@angular/router';
import { LandingComponent } from './demo-pages/landing.component';
import { AdminFormListComponent } from './demo-pages/admin/form-list.component';
import { AdminDemoComponent } from './demo-pages/admin-demo.component';
import { BuilderDemoComponent } from './demo-pages/builder-demo.component';
import { RendererDemoComponent } from './demo-pages/renderer-demo.component';
import { UserPortalComponent } from './demo-pages/user/user-portal.component';
import { FormRunnerComponent } from './demo-pages/user/form-runner.component';
import { SubmissionDetailComponent } from './demo-pages/user/submission-detail.component';

export const routes: Routes = [
    { path: '', component: LandingComponent },

    // Admin Flow
    { path: 'admin', component: AdminFormListComponent },
    { path: 'admin/builder/:id', component: AdminDemoComponent },
    { path: 'demo/builder-host-controls', component: BuilderDemoComponent },
    { path: 'demo/renderer-host-controls', component: RendererDemoComponent },

    // User Flow
    { path: 'user', component: UserPortalComponent },
    { path: 'user/fill/:id', component: FormRunnerComponent },
    { path: 'user/submission/:id', component: SubmissionDetailComponent },

    { path: '**', redirectTo: '' }
];
