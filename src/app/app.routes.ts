import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'documents', pathMatch: 'full' },
  { path: 'documents', loadChildren: () => import('./document/document.module').then(m => m.DocumentModule) }
];
