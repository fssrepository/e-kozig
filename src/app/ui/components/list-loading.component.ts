import { NgIf } from '@angular/common';
import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: '[appListLoading]',
  imports: [NgIf, MatProgressSpinnerModule],
  template: `
    <div class="page-loading-overlay" *ngIf="loading">
      <mat-progress-spinner diameter="48" mode="indeterminate"></mat-progress-spinner>
    </div>
    <div class="pull-indicator" *ngIf="mobile && (active || refreshing)">
      <mat-progress-spinner [mode]="refreshing ? 'indeterminate' : 'determinate'"
        [value]="progress" diameter="20"></mat-progress-spinner>
    </div>
    <div class="table-container" #container>
      <div class="table-overlay" *ngIf="loading">
        <mat-progress-spinner diameter="48" mode="indeterminate"></mat-progress-spinner>
      </div>
      <ng-content></ng-content>
      <div class="mobile-load-indicator" *ngIf="loadingMore">
        <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
      </div>
      <div #sentinel class="table-sentinel" aria-hidden="true"></div>
    </div>
  `
})
export class ListLoadingComponent {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;
  @ViewChild('sentinel', { static: true }) sentinel!: ElementRef<HTMLElement>;
  @Input() loading = false;
  @Input() loadingMore = false;
  @Input() mobile = false;
  @Input() active = false;
  @Input() refreshing = false;
  @Input() progress = 0;
}
