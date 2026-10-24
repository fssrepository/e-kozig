import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: '[appListControls]',
  imports: [NgIf, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="left-controls">
      <button mat-icon-button (click)="refresh.emit()" aria-label="Frissítés" [disabled]="loading">
        <mat-icon *ngIf="!loading">refresh</mat-icon>
        <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
      </button>
    </div>
    <div class="right-controls"><ng-content></ng-content></div>
  `
})
export class ListControlsComponent {
  @Input() loading = false;
  @Output() refresh = new EventEmitter<void>();
}
