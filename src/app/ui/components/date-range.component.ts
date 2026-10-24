import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { formatShortDate } from '../list-utils';

@Component({
  selector: '[appDateRange]',
  imports: [NgIf, ReactiveFormsModule, MatChipsModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="date-chips" *ngIf="from.value || to.value">
      <mat-chip-set aria-label="Kiválasztott dátumok" class="chip-list">
        <mat-chip *ngIf="from.value" removable (removed)="removed.emit('from')">
          Ettől: {{ formatShortDate(from.value) }}
          <button matChipRemove aria-label="Kezdő dátum eltávolítása">✕</button>
        </mat-chip>
        <mat-chip *ngIf="to.value" removable (removed)="removed.emit('to')">
          Eddig: {{ formatShortDate(to.value) }}
          <button matChipRemove aria-label="Záró dátum eltávolítása">✕</button>
        </mat-chip>
      </mat-chip-set>
    </div>
    <div class="date-inputs">
      <mat-form-field appearance="outline">
        <input matInput [matDatepicker]="fromPicker" placeholder="Ettől" aria-label="Kezdő dátum"
          [formControl]="from" (dateChange)="changed.emit()">
        <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
        <mat-datepicker #fromPicker xPosition="start" yPosition="below"></mat-datepicker>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <input matInput [matDatepicker]="toPicker" placeholder="Eddig" aria-label="Záró dátum"
          [formControl]="to" (dateChange)="changed.emit()">
        <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
        <mat-datepicker #toPicker xPosition="start" yPosition="below"></mat-datepicker>
      </mat-form-field>
    </div>
  `
})
export class DateRangeComponent {
  @Input({ required: true }) from!: FormControl<Date | null>;
  @Input({ required: true }) to!: FormControl<Date | null>;
  @Output() changed = new EventEmitter<void>();
  @Output() removed = new EventEmitter<'from' | 'to'>();
  readonly formatShortDate = formatShortDate;
}
