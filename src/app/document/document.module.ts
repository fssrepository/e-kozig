import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentComponent } from './components/document.component';

@NgModule({
  declarations: [DocumentComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: DocumentComponent }
    ])
  ]
})
export class DocumentModule {}
