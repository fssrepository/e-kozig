import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { formatDate } from '../list-utils';

interface RecordListRow {
  name?: string;
  ugyfel: string;
  status?: string;
  datetime: string;
  unread?: boolean;
  formName?: string;
  bizonylatTipus?: string;
  bizonylatSzam?: string;
}

@Component({
  selector: 'app-record-table',
  imports: [NgIf, MatIconModule, MatTableModule],
  host: { style: 'display: contents' },
  template: `
    <table mat-table [dataSource]="dataSource" class="mat-elevation-z1">
      <ng-container matColumnDef="icon">
        <th mat-header-cell *matHeaderCellDef scope="col">Állapotjelző</th>
        <td mat-cell *matCellDef="let row">
          <mat-icon aria-hidden="true" [class]="'status-icon status-' + statusClass(row.status)">{{ statusIcon(row.status || '') }}</mat-icon>
        </td>
      </ng-container>
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef scope="col">Név</th>
        <td mat-cell *matCellDef="let row" class="col-name">
          <div class="name-primary">{{ kind === 'document' ? row.name : row.ugyfel }}</div>
          <div class="mobile-meta">
            <span class="mobile-form">{{ kind === 'document' ? row.formName : row.bizonylatTipus }}</span>
            <span class="mobile-status" *ngIf="kind === 'document'">{{ row.status }}</span>
          </div>
        </td>
      </ng-container>
      <ng-container matColumnDef="ugyszam">
        <th mat-header-cell *matHeaderCellDef scope="col">Ügyszám</th>
        <td mat-cell *matCellDef="let row" class="col-ugyszam">{{ documentNumber(row) }}</td>
      </ng-container>
      <ng-container matColumnDef="bizonylat">
        <th mat-header-cell *matHeaderCellDef scope="col">Bizonylatszám</th>
        <td mat-cell *matCellDef="let row" class="col-bizonylat">{{ row.bizonylatSzam }}</td>
      </ng-container>
      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef scope="col">Űrlap</th>
        <td mat-cell *matCellDef="let row" class="col-form">{{ row.formName }}</td>
      </ng-container>
      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef scope="col">Bizonylattípus</th>
        <td mat-cell *matCellDef="let row" class="col-form">{{ row.bizonylatTipus }}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef scope="col">Státusz</th>
        <td mat-cell *matCellDef="let row" class="col-status">{{ row.status }}</td>
      </ng-container>
      <ng-container matColumnDef="datetime">
        <th mat-header-cell *matHeaderCellDef scope="col">Dátum</th>
        <td mat-cell *matCellDef="let row" class="datetime-cell">{{ formatDate(row.datetime) }}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns" class="cdk-visually-hidden"></tr>
      <tr mat-row class="row-link" *matRowDef="let row; columns: columns"
        [class.unread]="row.unread" [class.read]="!row.unread" (click)="selected.emit(row)"></tr>
    </table>
  `
})
export class RecordTableComponent<T extends RecordListRow> {
  @Input({ required: true }) dataSource!: MatTableDataSource<T>;
  @Input({ required: true }) columns!: string[];
  @Input({ required: true }) kind!: 'document' | 'invoice';
  @Input({ required: true }) statusClass!: (status: string) => string;
  @Input({ required: true }) statusIcon!: (status: string) => string;
  @Input() documentNumber: (row: T) => string = () => '';
  @Output() selected = new EventEmitter<T>();
  readonly formatDate = formatDate;
}
