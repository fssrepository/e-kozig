import { Component, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, startWith, map } from 'rxjs';

interface DocumentItem {
  icon: string;
  ugyfel: string;
  description: string;
  datetime: string;
  unread?: boolean;
}

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  styleUrls: ['../../../_styles/_document.scss'],
  templateUrl: './document.component.html',

})
export class DocumentComponent implements OnInit, AfterViewInit {
  searchCtrl = new FormControl('');
  options: string[] = ['Acme', 'Globex', 'Wayne Enterprises', 'Umbrella Corp', 'Initech'];
  filteredOptions$!: Observable<string[]>;

  // Ugyfél dropdown controls
  ugyfelCtrl = new FormControl('');
  filteredUgyfels$!: Observable<string[]>;
  showUgyfelPanel = false;

  // selected filter chips (üg yfels)
  chips: string[] = [];
  selectedFilters: string[] = [];

  documents: DocumentItem[] = [
    { icon: 'description', ugyfel: 'Acme', description: 'Contract agreement', datetime: '2026-02-01 10:00', unread: true },
    { icon: 'insert_drive_file', ugyfel: 'Globex', description: 'Invoice #1234', datetime: '2026-01-22 14:30', unread: false },
    { icon: 'description', ugyfel: 'Wayne Enterprises', description: 'NDA document', datetime: '2025-12-10 09:15', unread: false },
    { icon: 'insert_drive_file', ugyfel: 'Acme', description: 'Purchase order', datetime: '2026-02-02 11:05', unread: true },
    { icon: 'description', ugyfel: 'Initech', description: 'Support ticket', datetime: '2026-02-01 16:20', unread: false },
    { icon: 'description', ugyfel: 'Umbrella Corp', description: 'Safety report', datetime: '2025-11-03 08:30', unread: false },
    { icon: 'insert_drive_file', ugyfel: 'Stark Industries', description: 'Tech spec', datetime: '2026-01-05 12:00', unread: true },
    { icon: 'description', ugyfel: 'Wayne Enterprises', description: 'Board minutes', datetime: '2026-01-30 09:45', unread: false },
    { icon: 'insert_drive_file', ugyfel: 'Acme', description: 'Invoice #4321', datetime: '2026-02-02 09:20', unread: true },
    { icon: 'description', ugyfel: 'Globex', description: 'Contract addendum', datetime: '2026-01-15 15:00', unread: false },
    { icon: 'insert_drive_file', ugyfel: 'Initech', description: 'Audit log', datetime: '2026-01-28 11:10', unread: false },
    { icon: 'description', ugyfel: 'Wayne Enterprises', description: 'Legal memo', datetime: '2024-06-20 10:00', unread: false }
  ];

  dataSource = new MatTableDataSource<DocumentItem>(this.documents);
  displayedColumns: string[] = ['icon', 'ugyfel', 'description', 'datetime'];

  loading = false;

  @ViewChild('paginator') paginator!: MatPaginator;

  ngOnInit(): void {
    this.filteredOptions$ = this.searchCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );

    // setup ügyfél autocomplete filtered stream (exclude already selected)
    this.filteredUgyfels$ = this.ugyfelCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterUgyfel(value || ''))
    );

    // ensure initial sort (date desc) and set data for the table
    this.sortDocuments();
    this.dataSource.data = this.documents;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterUgyfel(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options
      .filter(option => option.toLowerCase().includes(filterValue))
      .filter(option => !this.selectedFilters.includes(option));
  }

  addChip(value: string) {
    if (!value) return;
    if (!this.chips.includes(value)) {
      this.chips.push(value);
    }
    if (!this.selectedFilters.includes(value)) {
      this.selectedFilters.push(value);
    }
    this.searchCtrl.setValue('');
    this.applyFilter();
  }

  selectUgyfel(value: string) {
    // select from the dropdown's autocomplete
    if (!value) return;
    if (!this.selectedFilters.includes(value)) {
      this.selectedFilters.push(value);
    }
    // keep the panel open for multiple selection; clear input
    this.ugyfelCtrl.setValue('');
    this.applyFilter();
  }

  toggleUgyfelPanel() {
    this.showUgyfelPanel = !this.showUgyfelPanel;
    if (this.showUgyfelPanel) {
      // focus the input after a tick
      setTimeout(() => {
        const el = document.querySelector('.ugyfeld-search input') as HTMLInputElement | null;
        el?.focus();
      }, 120);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const wrapper = document.querySelector('.ugyfel-wrapper');
    if (!wrapper) return;
    if (this.showUgyfelPanel && !wrapper.contains(target)) {
      this.showUgyfelPanel = false;
    }
  }

  remove(chip: string) {
    if (chip === 'Ügyfél') return;
    const i = this.chips.indexOf(chip);
    if (i >= 0) this.chips.splice(i, 1);
    const j = this.selectedFilters.indexOf(chip);
    if (j >= 0) this.selectedFilters.splice(j, 1);
    this.applyFilter();
  }

  applyFilter() {
    // Simulate a short loading delay and refresh the table view
    this.loading = true;

    const update = () => {
      const sorted = this.documents.slice().sort((a, b) => {
        const da = this.parseDateTime(a.datetime);
        const db = this.parseDateTime(b.datetime);
        return db.getTime() - da.getTime();
      });

      if (this.selectedFilters.length === 0) {
        this.dataSource.data = sorted;
      } else {
        this.dataSource.data = sorted.filter(d => this.selectedFilters.includes(d.ugyfel));
      }
      if (this.paginator) this.paginator.firstPage();
      this.loading = false;
    };

    // Debounce / simulate server delay
    setTimeout(update, 400);
  }

  refresh() {
    // Simulate reloading table content without mutating item timestamps
    this.loading = true;
    setTimeout(() => {
      // Reapply sort & filters to refresh the table view
      this.sortDocuments();
      this.applyFilter();
      this.loading = false;
    }, 500);
  }

  private sortDocuments() {
    this.documents.sort((a, b) => {
      const da = this.parseDateTime(a.datetime);
      const db = this.parseDateTime(b.datetime);
      return db.getTime() - da.getTime();
    });
  }

  formatDate(s: string): string {
    if (!s) return '';
    const d = this.parseDateTime(s);
    if (isNaN(d.getTime())) return s;
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) {
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    const sameYear = d.getFullYear() === now.getFullYear();
    if (sameYear) {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${String(d.getDate()).padStart(2,'0')} ${monthNames[d.getMonth()]}`;
    }
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  private parseDateTime(s: string): Date {
    // expected format: YYYY-MM-DD HH:mm or variants
    const parts = s.trim().split(' ');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      const [y, m, d] = datePart.split('-').map(n => Number(n));
      const [hh, mm] = timePart.split(':').map(n => Number(n));
      if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
        return new Date(y, m-1, d, hh || 0, mm || 0);
      }
    }
    const dt = new Date(s);
    return dt;
  }
}

