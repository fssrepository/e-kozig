import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: '[appDetailHeader]',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button mat-icon-button (click)="closed.emit()" aria-label="Vissza"><mat-icon>arrow_back</mat-icon></button>
    <div class="detail-header-info">
      <div class="detail-header-text">
        <div class="detail-ugyfel">{{ title }}</div>
        <div class="detail-meta">{{ subtitle }}</div>
      </div>
    </div>
    <span class="status-icon-button detail-header-status detail-status-badge" [class]="statusClass">
      <span class="status-label">{{ status }}</span><mat-icon>{{ statusIcon }}</mat-icon>
    </span>
  `
})
export class DetailHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() status = '';
  @Input() statusClass = '';
  @Input() statusIcon = '';
  @Output() closed = new EventEmitter<void>();
}
