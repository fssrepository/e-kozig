import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { NyomtatvanyEntry, NyomtatvanyGroup } from '../../document/models/form-entry.interface';

@Component({
  selector: 'app-form-entry-list',
  imports: [CommonModule, MatExpansionModule],
  host: { style: 'display: contents' },
  templateUrl: './form-entry-list.component.html'
})
export class FormEntryListComponent {
  @Input() groups: NyomtatvanyGroup[] = [];
  @Output() selected = new EventEmitter<NyomtatvanyEntry>();
}
