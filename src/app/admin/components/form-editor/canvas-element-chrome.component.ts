import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-canvas-element-chrome',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <span class="canvas-element-chrome" [class.two-line]="!!subLabel" [class.has-badge]="badge !== null && badge !== undefined" [class.editing]="editing">
      <button
        *ngIf="editing"
        type="button"
        class="canvas-element-action canvas-element-grip"
        (pointerdown)="handleDrag($event)"
        (click)="ignoreActionClick($event)"
        matTooltip="Elem mozgatása"
        aria-label="Elem mozgatása"
      >
        <mat-icon>drag_indicator</mat-icon>
      </button>

      <span class="canvas-element-badge" *ngIf="badge">{{ badge }}</span>

      <span class="canvas-element-label">
        <strong>{{ label }}</strong>
        <small *ngIf="subLabel">{{ subLabel }}</small>
      </span>

      <button
        *ngIf="editing"
        type="button"
        class="canvas-element-action canvas-element-menu"
        (click)="handleMenu($event)"
        matTooltip="Elem beállításai"
        aria-label="Elem beállításai"
      >
        <mat-icon>more_horiz</mat-icon>
      </button>
    </span>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
    }

    .canvas-element-chrome {
      width: 100%;
      height: 100%;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: var(--editor-action-gap, 0.5rem);
      box-sizing: border-box;
    }

    .canvas-element-chrome.two-line {
      align-items: flex-start;
      padding-top: 0.25rem;
    }

    .canvas-element-action {
      width: var(--editor-action-size, 24px);
      height: var(--editor-action-size, 24px);
      flex: 0 0 var(--editor-action-size, 24px);
      border: 1px solid #c8d6e3;
      background: #fff;
      color: #5c6f82;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      box-shadow: 0 1px 3px rgba(15, 47, 74, 0.14);
    }

    .canvas-element-grip {
      border-radius: 5px;
      cursor: move;
    }

    .canvas-element-menu {
      border-radius: 50%;
      cursor: pointer;
    }

    .canvas-element-action mat-icon {
      width: 17px;
      height: 17px;
      font-size: 17px;
    }

    .canvas-element-badge {
      width: var(--editor-action-size, 24px);
      height: var(--editor-action-size, 24px);
      flex: 0 0 var(--editor-action-size, 24px);
      border-radius: 50%;
      background: #0067b1;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }

    .canvas-element-label {
      min-width: 0;
      flex: 1 1 auto;
      display: grid;
      gap: 0.1rem;
    }

    .canvas-element-chrome.has-badge:not(.editing) .canvas-element-label {
      flex: 0 1 auto;
    }

    .canvas-element-label strong,
    .canvas-element-label small {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .canvas-element-label strong {
      color: #1f2933;
      font-size: inherit;
      font-weight: 800;
    }

    .canvas-element-label small {
      color: #5c6f82;
      font-size: 12px;
      font-weight: 800;
    }
  `]
})
export class CanvasElementChromeComponent {
  @Input() label = '';
  @Input() subLabel = '';
  @Input() badge: string | number | null = null;
  @Input() editing = false;

  @Output() dragPointerDown = new EventEmitter<PointerEvent>();
  @Output() menuClick = new EventEmitter<MouseEvent>();

  handleDrag(event: PointerEvent): void {
    this.dragPointerDown.emit(event);
  }

  handleMenu(event: MouseEvent): void {
    this.menuClick.emit(event);
  }

  ignoreActionClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
}
