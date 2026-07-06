import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormEditorComponent } from './components/form-editor/form-editor.component';

@NgModule({
  imports: [
    FormEditorComponent,
    RouterModule.forChild([
      { path: '', redirectTo: 'forms', pathMatch: 'full' },
      { path: 'forms', component: FormEditorComponent }
    ])
  ]
})
export class AdminModule {}
