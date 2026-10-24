import { AsyncPipe, NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';

@Component({
  selector: '[appChoiceFilter]',
  imports: [AsyncPipe, NgFor, ReactiveFormsModule, MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field [class]="fieldClass" appearance="outline">
      <mat-chip-set [attr.aria-label]="selectionLabel" class="chip-list">
        <mat-chip *ngFor="let value of selected" removable (removed)="removed.emit(value)">
          {{ value }}
          <button matChipRemove [attr.aria-label]="removeLabel">✕</button>
        </mat-chip>
      </mat-chip-set>
      <input matInput [formControl]="control" [matAutocomplete]="optionsPanel"
        [placeholder]="placeholder" [attr.aria-label]="placeholder"
        #trigger="matAutocompleteTrigger" (focus)="autoOpen && trigger.openPanel()">
      <mat-autocomplete #optionsPanel="matAutocomplete" (optionSelected)="chosen.emit($event.option.value)">
        <mat-option *ngFor="let option of options | async" [value]="option">{{ option }}</mat-option>
      </mat-autocomplete>
    </mat-form-field>
  `
})
export class ChoiceFilterComponent {
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input({ required: true }) options!: Observable<string[]>;
  @Input() selected: string[] = [];
  @Input() fieldClass = '';
  @Input() placeholder = '';
  @Input() selectionLabel = '';
  @Input() removeLabel = '';
  @Input() autoOpen = false;
  @Output() removed = new EventEmitter<string>();
  @Output() chosen = new EventEmitter<string>();
}
