import { ListLoadingComponent } from '../../ui/components/list-loading.component';
import { RecordTableComponent } from '../../ui/components/record-table.component';
import { DetailHeaderComponent } from '../../ui/components/detail-header.component';
import { ListControlsComponent } from '../../ui/components/list-controls.component';
import { DateRangeComponent } from '../../ui/components/date-range.component';
import { ChoiceFilterComponent } from '../../ui/components/choice-filter.component';
import { ListViewport } from '../../ui/components/list-viewport/list-viewport';
import { smoothScroll, lockFiltersScroll, formatDate, formatShortDate, parseDateTime } from '../../ui/list-utils';
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, HostListener, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable, map, startWith } from 'rxjs';
import { InvoiceItem, InvoicePeriodItem } from '../models/invoice-item.interface';
import { InvoiceService } from '../services/invoice.service';
import { AlertService } from '../../shared/alert.service';

interface AfaCodeOption {
  code: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListLoadingComponent,
    ChoiceFilterComponent, DateRangeComponent, ListControlsComponent, DetailHeaderComponent, RecordTableComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './invoices.component.html'
})
export class InvoicesComponent extends ListViewport<InvoiceItem> implements OnInit, AfterViewInit, OnDestroy {
  private invoiceService = inject(InvoiceService);
  private alertService = inject(AlertService);

  private invoiceFiltersScrollLeft = 0;
  private periodFiltersScrollLeft = 0;
  private invoiceScrollLockInterval: any = null;
  private periodScrollLockInterval: any = null;

  private filterUpdateTimer: number | null = null;

  searchResults: InvoiceItem[] = [];

  ugyfelCtrl = new FormControl('');
  filteredUgyfels$!: Observable<string[]>;
  showUgyfelPanel = false;
  selectedUgyfels: string[] = [];

  statusCtrl = new FormControl('');
  filteredStatuses$!: Observable<string[]>;
  showStatusPanel = false;
  selectedStatuses: string[] = [];

  directionCtrl = new FormControl('');
  filteredDirections$!: Observable<string[]>;
  showDirectionPanel = false;
  selectedDirections: string[] = [];

  typeCtrl = new FormControl('');
  filteredTypes$!: Observable<string[]>;
  showTypePanel = false;
  selectedTypes: string[] = [];

  dateFromCtrl = new FormControl<Date | null>(null);
  dateToCtrl = new FormControl<Date | null>(null);
  showDatePanel = false;

  invoices: InvoiceItem[] = [];

  displayedColumns: string[] = ['name', 'bizonylat', 'type', 'status', 'datetime'];

  selectedItem: InvoiceItem | null = null;
  expandedItemIds: Set<string> = new Set();

  activePopup: 'create' | 'periods' | null = null;

  periodSearchCtrl = new FormControl('');
  periodSearchResults: InvoicePeriodItem[] = [];
  showPeriodSearchPanel = false;
  periodSearchTerms: string[] = [];

  periodUgyfelCtrl = new FormControl('');
  filteredPeriodUgyfels$!: Observable<string[]>;
  showPeriodUgyfelPanel = false;
  selectedPeriodUgyfels: string[] = [];

  periodStatusCtrl = new FormControl('');
  filteredPeriodStatuses$!: Observable<string[]>;
  showPeriodStatusPanel = false;
  selectedPeriodStatuses: string[] = [];

  periodDateFromCtrl = new FormControl<Date | null>(null);
  periodDateToCtrl = new FormControl<Date | null>(null);
  showPeriodDatePanel = false;

  periods: InvoicePeriodItem[] = [];
  periodDataSource = new MatTableDataSource<InvoicePeriodItem>([]);
  periodDisplayedColumns: string[] = ['statusIcon', 'ugyfel', 'idoszak'];

  selectedPeriodItem: InvoicePeriodItem | null = null;

  invoiceDateCtrl = new FormControl<Date | null>(null);
  fulfilmentDateCtrl = new FormControl<Date | null>(null);
  paymentDeadlineCtrl = new FormControl<Date | null>(null);
  paymentMethodCtrl = new FormControl('');

  afaCodeCtrl = new FormControl<AfaCodeOption | string>('');
  filteredAfaCodes$!: Observable<AfaCodeOption[]>;
  afaCodes: AfaCodeOption[] = [
    { code: '27%', name: 'Általános kulcs', description: 'Általános áfamérték' },
    { code: '18%', name: 'Kedvezményes kulcs', description: 'Meghatározott termékek, szolgáltatások' },
    { code: '5%', name: 'Kedvezményes kulcs', description: 'Kiemelt termékek, szolgáltatások' },
    { code: '0%', name: 'Nulla kulcs', description: 'Közösségen belüli, export jellegű tételek' },
    { code: 'AAM', name: 'Alanyi adómentes', description: 'Alanyi áfamentesség' },
    { code: 'TAM', name: 'Tárgyi adómentes', description: 'Tárgyi áfamentesség' },
    { code: 'FAD', name: 'Fordított adózás', description: 'Belföldi fordított adózás' },
    { code: 'EUK', name: 'EU közösségi', description: 'Közösségen belüli értékesítés' }
  ];

  vatOptions: Array<{ code: string; name: string; description: string; rate: number }> = [
    { code: '27%', name: 'Általános kulcs', description: 'Általános áfamérték', rate: 0.27 },
    { code: '18%', name: 'Kedvezményes kulcs', description: 'Meghatározott termékek, szolgáltatások', rate: 0.18 },
    { code: '5%', name: 'Kedvezményes kulcs', description: 'Kiemelt termékek, szolgáltatások', rate: 0.05 },
    { code: '0%', name: 'Nulla kulcs', description: 'Közösségen belüli, export jellegű tételek', rate: 0 }
  ];

  invoiceItems: Array<{
    name: string;
    unitPrice: number;
    vat: { code: string; name: string; description: string; rate: number } | null;
    qty: number;
    unit: string;
  }> = [
    { name: '', unitPrice: 0, vat: { code: '27%', name: 'Általános kulcs', description: 'Általános áfamérték', rate: 0.27 }, qty: 1, unit: 'db' }
  ];

  paymentMethods = ['Készpénz', 'Átutalás', 'Utánvét', 'Bankkártya', 'SZÉP kártya'];

  private periodPaginatorRef?: MatPaginator;
  @ViewChild('periodPaginator')
  set periodPaginator(paginator: MatPaginator | undefined) {
    if (!paginator) return;
    this.periodPaginatorRef = paginator;
    this.periodDataSource.paginator = paginator;
    this.cdr.markForCheck();
  }

  @ViewChild('invoiceFilters') invoiceFiltersRef!: ElementRef<HTMLElement>;
  @ViewChild('periodFilters') periodFiltersRef!: ElementRef<HTMLElement>;

  ngOnInit(): void {
    this.invoiceService.getInvoices().subscribe(items => {
      this.invoices = items;
      this.applyFilter();
      this.cdr.markForCheck();
    });

    this.invoiceService.getPeriods().subscribe(items => {
      this.periods = items;
      this.applyPeriodFilter();
      this.cdr.markForCheck();
    });

    this.searchCtrl.valueChanges.pipe(
      startWith(''),
      map(value => (value || '').toString().trim())
    ).subscribe(query => {
      if (query.length > 0) {
        this.searchResults = this.invoiceService.searchInvoices(query);
        this.showSearchPanel = this.searchResults.length > 0;
      } else {
        this.searchResults = [];
        this.showSearchPanel = false;
      }
      this.cdr.markForCheck();
    });

    this.filteredUgyfels$ = this.ugyfelCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterUgyfel(value || ''))
    );

    this.filteredStatuses$ = this.statusCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterStatus(value || ''))
    );

    this.filteredDirections$ = this.directionCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterDirection(value || ''))
    );

    this.filteredTypes$ = this.typeCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterType(value || ''))
    );

    this.periodSearchCtrl.valueChanges.pipe(
      startWith(''),
      map(value => (value || '').toString().trim())
    ).subscribe(query => {
      if (query.length > 0) {
        this.periodSearchResults = this.invoiceService.searchPeriods(query);
        this.showPeriodSearchPanel = this.periodSearchResults.length > 0;
      } else {
        this.periodSearchResults = [];
        this.showPeriodSearchPanel = false;
      }
      this.cdr.markForCheck();
    });

    this.filteredPeriodUgyfels$ = this.periodUgyfelCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterPeriodUgyfel(value || ''))
    );

    this.filteredPeriodStatuses$ = this.periodStatusCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterPeriodStatus(value || ''))
    );

    this.filteredAfaCodes$ = this.afaCodeCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterAfaCodes(value || ''))
    );

    this.setupResizeListener();
  }

  ngAfterViewInit(): void {
    this.updatePaginatorMode();
    this.setupMobileIntersectionObserver();
    this.setupPullToRefresh();
  }

  ngOnDestroy(): void {
    this.teardownResizeListener();
    this.teardownMobileIntersectionObserver();
    this.teardownPullToRefresh();
    if (this.filterUpdateTimer !== null) {
      window.clearTimeout(this.filterUpdateTimer);
      this.filterUpdateTimer = null;
    }
  }

  get dateLabel(): string {
    const from = this.dateFromCtrl.value;
    const to = this.dateToCtrl.value;
    if (!from && !to) return '';
    const fromText = from ? this.formatShortDate(from) : '...';
    const toText = to ? this.formatShortDate(to) : '...';
    return `${fromText} - ${toText}`;
  }

  get periodDateLabel(): string {
    const from = this.periodDateFromCtrl.value;
    const to = this.periodDateToCtrl.value;
    if (!from && !to) return '';
    const fromText = from ? this.formatShortDate(from) : '...';
    const toText = to ? this.formatShortDate(to) : '...';
    return `${fromText} - ${toText}`;
  }

  selectSearchResult(item: InvoiceItem) {
    this.searchCtrl.setValue('', { emitEvent: false });
    this.showSearchPanel = false;
    this.selectTableRow(item);
  }

  selectTableRow(item: InvoiceItem) {
    const sortedItems = [...item.items].sort((a, b) => {
      const da = this.parseDateTime(a.datetime);
      const db = this.parseDateTime(b.datetime);
      return db.getTime() - da.getTime();
    });
    this.selectedItem = { ...item, items: sortedItems };
    this.expandedItemIds = new Set();
  }

  closeDetailView() {
    this.selectedItem = null;
    this.expandedItemIds.clear();
  }

  toggleAccordion(itemId: string) {
    if (this.expandedItemIds.has(itemId)) {
      this.expandedItemIds.delete(itemId);
    } else {
      this.expandedItemIds.add(itemId);
    }
  }

  toggleUgyfelPanel() {
    if (this.showUgyfelPanel) {
      this.showUgyfelPanel = false;
      this.stopScrollLock('invoice');
      this.restoreFiltersScroll('invoice');
      this.cdr.markForCheck();
      return;
    }
    this.closeFilterPanels('ugyfel');
    this.scrollFiltersToButton('invoice', '.ugyfel-btn', '.ugyfel-panel', () => {
      this.showUgyfelPanel = true;
      setTimeout(() => this.positionPanelWithin(this.invoiceFiltersRef?.nativeElement, '.ugyfel-btn', '.ugyfel-panel'), 20);
    }, '.ugyfeld-search input');
    this.cdr.markForCheck();
  }

  toggleDatePanel() {
    if (this.showDatePanel) {
      this.showDatePanel = false;
      this.stopScrollLock('invoice');
      this.restoreFiltersScroll('invoice');
      this.cdr.markForCheck();
      return;
    }
    this.closeFilterPanels('date');
    this.scrollFiltersToButton('invoice', '.date-btn', '.date-panel', () => {
      this.showDatePanel = true;
      setTimeout(() => this.positionPanelWithin(this.invoiceFiltersRef?.nativeElement, '.date-btn', '.date-panel'), 20);
    });
    this.cdr.markForCheck();
  }

  toggleStatusPanel() {
    if (this.showStatusPanel) {
      this.showStatusPanel = false;
      this.stopScrollLock('invoice');
      this.restoreFiltersScroll('invoice');
      this.cdr.markForCheck();
      return;
    }
    this.closeFilterPanels('status');
    this.scrollFiltersToButton('invoice', '.status-btn', '.status-panel', () => {
      this.showStatusPanel = true;
      setTimeout(() => this.positionPanelWithin(this.invoiceFiltersRef?.nativeElement, '.status-btn', '.status-panel'), 20);
    }, '.status-search input');
    this.cdr.markForCheck();
  }

  toggleDirectionPanel() {
    if (this.showDirectionPanel) {
      this.showDirectionPanel = false;
      this.stopScrollLock('invoice');
      this.restoreFiltersScroll('invoice');
      this.cdr.markForCheck();
      return;
    }
    this.closeFilterPanels('direction');
    this.scrollFiltersToButton('invoice', '.direction-btn', '.direction-panel', () => {
      this.showDirectionPanel = true;
      setTimeout(() => this.positionPanelWithin(this.invoiceFiltersRef?.nativeElement, '.direction-btn', '.direction-panel'), 20);
    }, '.direction-search input');
    this.cdr.markForCheck();
  }

  toggleTypePanel() {
    if (this.showTypePanel) {
      this.showTypePanel = false;
      this.stopScrollLock('invoice');
      this.restoreFiltersScroll('invoice');
      this.cdr.markForCheck();
      return;
    }
    this.closeFilterPanels('type');
    this.scrollFiltersToButton('invoice', '.type-btn', '.type-panel', () => {
      this.showTypePanel = true;
      setTimeout(() => this.positionPanelWithin(this.invoiceFiltersRef?.nativeElement, '.type-btn', '.type-panel'), 20);
    }, '.type-search input');
    this.cdr.markForCheck();
  }

  selectUgyfel(value: string) {
    if (!this.selectedUgyfels.includes(value)) {
      this.selectedUgyfels.push(value);
      this.ugyfelCtrl.setValue('');
      this.applyFilter();
    }
  }

  removeUgyfel(value: string) {
    const i = this.selectedUgyfels.indexOf(value);
    if (i >= 0) {
      this.selectedUgyfels.splice(i, 1);
      this.applyFilter();
      this.ugyfelCtrl.setValue(this.ugyfelCtrl.value || '');
    }
  }

  selectStatus(value: string) {
    if (!this.selectedStatuses.includes(value)) {
      this.selectedStatuses.push(value);
      this.statusCtrl.setValue('');
      this.applyFilter();
    }
  }

  removeStatus(value: string) {
    const i = this.selectedStatuses.indexOf(value);
    if (i >= 0) {
      this.selectedStatuses.splice(i, 1);
      this.applyFilter();
      this.statusCtrl.setValue(this.statusCtrl.value || '');
    }
  }

  selectDirection(value: string) {
    if (!this.selectedDirections.includes(value)) {
      this.selectedDirections.push(value);
      this.directionCtrl.setValue('');
      this.applyFilter();
    }
  }

  removeDirection(value: string) {
    const i = this.selectedDirections.indexOf(value);
    if (i >= 0) {
      this.selectedDirections.splice(i, 1);
      this.applyFilter();
      this.directionCtrl.setValue(this.directionCtrl.value || '');
    }
  }

  selectType(value: string) {
    if (!this.selectedTypes.includes(value)) {
      this.selectedTypes.push(value);
      this.typeCtrl.setValue('');
      this.applyFilter();
    }
  }

  removeType(value: string) {
    const i = this.selectedTypes.indexOf(value);
    if (i >= 0) {
      this.selectedTypes.splice(i, 1);
      this.applyFilter();
      this.typeCtrl.setValue(this.typeCtrl.value || '');
    }
  }

  onDateChange() {
    this.applyFilter();
  }

  removeDate(kind: 'from' | 'to') {
    if (kind === 'from') {
      this.dateFromCtrl.setValue(null);
    } else {
      this.dateToCtrl.setValue(null);
    }
    this.applyFilter();
  }

  applyFilter() {
    this.loading = true;
    this.mobileLoadingMore = false;
    if (this.filterUpdateTimer !== null) {
      window.clearTimeout(this.filterUpdateTimer);
    }
    this.cdr.markForCheck();

    const update = () => {
      const sorted = [...this.invoices].sort((a, b) => {
        const da = this.parseDateTime(a.datetime);
        const db = this.parseDateTime(b.datetime);
        return db.getTime() - da.getTime();
      });

      let filtered = sorted;

      if (this.searchTerms.length > 0) {
        filtered = filtered.filter(item =>
          this.searchTerms.every(term => item.searchKey.includes(term.toLowerCase()))
        );
      }

      if (this.selectedUgyfels.length > 0) {
        filtered = filtered.filter(item => this.selectedUgyfels.includes(item.ugyfel));
      }

      if (this.selectedStatuses.length > 0) {
        filtered = filtered.filter(item => this.selectedStatuses.includes(item.status));
      }

      if (this.selectedDirections.length > 0) {
        filtered = filtered.filter(item => this.selectedDirections.includes(item.irany));
      }

      if (this.selectedTypes.length > 0) {
        filtered = filtered.filter(item => this.selectedTypes.includes(item.bizonylatTipus));
      }

      if (this.dateFromCtrl.value || this.dateToCtrl.value) {
        const from = this.dateFromCtrl.value ? this.dateFromCtrl.value.getTime() : -Infinity;
        const to = this.dateToCtrl.value ? this.dateToCtrl.value.getTime() : Infinity;
        filtered = filtered.filter(item => {
          const dt = this.parseDateTime(item.datetime).getTime();
          return dt >= from && dt <= to;
        });
      }

      this.lastFilteredItems = filtered;
      this.updateTableData(filtered);
      this.refreshMobileObserver();
      this.loading = false;
      this.filterUpdateTimer = null;
      this.cdr.markForCheck();
    };

    this.filterUpdateTimer = window.setTimeout(update, 300);
  }

  openCreatePopup() {
    this.activePopup = 'create';
  }

  openPeriodsPopup() {
    this.selectedPeriodItem = null;
    this.activePopup = 'periods';
  }

  closePopup() {
    this.activePopup = null;
    this.selectedPeriodItem = null;
  }

  filterPeriodBySearch() {
    const query = (this.periodSearchCtrl.value || '').trim();
    if (!query) return;
    if (!this.periodSearchTerms.includes(query)) {
      this.periodSearchTerms.push(query);
    }
    this.periodSearchCtrl.setValue('', { emitEvent: false });
    this.showPeriodSearchPanel = false;
    this.applyPeriodFilter();
  }

  removePeriodSearchTerm(term: string) {
    const i = this.periodSearchTerms.indexOf(term);
    if (i >= 0) {
      this.periodSearchTerms.splice(i, 1);
      this.applyPeriodFilter();
    }
  }

  selectPeriodSearchResult(item: InvoicePeriodItem) {
    this.periodSearchCtrl.setValue('', { emitEvent: false });
    this.showPeriodSearchPanel = false;
    this.periodSearchTerms = [];
    this.selectedPeriodItem = item;
    this.applyPeriodFilter();
  }

  selectPeriodRow(item: InvoicePeriodItem) {
    this.selectedPeriodItem = item;
  }

  closePeriodDetail() {
    this.selectedPeriodItem = null;
  }

  togglePeriodUgyfelPanel() {
    if (this.showPeriodUgyfelPanel) {
      this.showPeriodUgyfelPanel = false;
      this.stopScrollLock('period');
      this.restoreFiltersScroll('period');
      this.cdr.markForCheck();
      return;
    }
    this.closePeriodPanels('ugyfel');
    this.scrollFiltersToButton('period', '.ugyfel-btn', '.ugyfel-panel', () => {
      this.showPeriodUgyfelPanel = true;
      setTimeout(() => this.positionPanelWithin(this.periodFiltersRef?.nativeElement, '.ugyfel-btn', '.ugyfel-panel'), 20);
    }, '.ugyfeld-search input');
    this.cdr.markForCheck();
  }

  togglePeriodDatePanel() {
    if (this.showPeriodDatePanel) {
      this.showPeriodDatePanel = false;
      this.stopScrollLock('period');
      this.restoreFiltersScroll('period');
      this.cdr.markForCheck();
      return;
    }
    this.closePeriodPanels('date');
    this.scrollFiltersToButton('period', '.date-btn', '.date-panel', () => {
      this.showPeriodDatePanel = true;
      setTimeout(() => this.positionPanelWithin(this.periodFiltersRef?.nativeElement, '.date-btn', '.date-panel'), 20);
    });
    this.cdr.markForCheck();
  }

  togglePeriodStatusPanel() {
    if (this.showPeriodStatusPanel) {
      this.showPeriodStatusPanel = false;
      this.stopScrollLock('period');
      this.restoreFiltersScroll('period');
      this.cdr.markForCheck();
      return;
    }
    this.closePeriodPanels('status');
    this.scrollFiltersToButton('period', '.status-btn', '.status-panel', () => {
      this.showPeriodStatusPanel = true;
      setTimeout(() => this.positionPanelWithin(this.periodFiltersRef?.nativeElement, '.status-btn', '.status-panel'), 20);
    }, '.status-search input');
    this.cdr.markForCheck();
  }

  selectPeriodUgyfel(value: string) {
    if (!this.selectedPeriodUgyfels.includes(value)) {
      this.selectedPeriodUgyfels.push(value);
      this.periodUgyfelCtrl.setValue('');
      this.applyPeriodFilter();
    }
  }

  removePeriodUgyfel(value: string) {
    const i = this.selectedPeriodUgyfels.indexOf(value);
    if (i >= 0) {
      this.selectedPeriodUgyfels.splice(i, 1);
      this.applyPeriodFilter();
      this.periodUgyfelCtrl.setValue(this.periodUgyfelCtrl.value || '');
    }
  }

  selectPeriodStatus(value: string) {
    if (!this.selectedPeriodStatuses.includes(value)) {
      this.selectedPeriodStatuses.push(value);
      this.periodStatusCtrl.setValue('');
      this.applyPeriodFilter();
    }
  }

  removePeriodStatus(value: string) {
    const i = this.selectedPeriodStatuses.indexOf(value);
    if (i >= 0) {
      this.selectedPeriodStatuses.splice(i, 1);
      this.applyPeriodFilter();
      this.periodStatusCtrl.setValue(this.periodStatusCtrl.value || '');
    }
  }

  onPeriodDateChange() {
    this.applyPeriodFilter();
  }

  removePeriodDate(kind: 'from' | 'to') {
    if (kind === 'from') {
      this.periodDateFromCtrl.setValue(null);
    } else {
      this.periodDateToCtrl.setValue(null);
    }
    this.applyPeriodFilter();
  }

  applyPeriodFilter() {
    let filtered = [...this.periods];

    if (this.periodSearchTerms.length > 0) {
      filtered = filtered.filter(item =>
        this.periodSearchTerms.every(term => item.searchKey.includes(term.toLowerCase()))
      );
    }

    if (this.selectedPeriodUgyfels.length > 0) {
      filtered = filtered.filter(item => this.selectedPeriodUgyfels.includes(item.ugyfel));
    }

    if (this.selectedPeriodStatuses.length > 0) {
      filtered = filtered.filter(item => this.selectedPeriodStatuses.includes(item.status));
    }

    if (this.periodDateFromCtrl.value || this.periodDateToCtrl.value) {
      const from = this.periodDateFromCtrl.value ? this.periodDateFromCtrl.value.getTime() : -Infinity;
      const to = this.periodDateToCtrl.value ? this.periodDateToCtrl.value.getTime() : Infinity;
      filtered = filtered.filter(item => {
        const start = this.parseDate(item.periodFrom).getTime();
        const end = this.parseDate(item.periodTo).getTime();
        return end >= from && start <= to;
      });
    }

    filtered = filtered.sort((a, b) => {
      const da = this.parseDate(a.periodTo).getTime();
      const db = this.parseDate(b.periodTo).getTime();
      return db - da;
    });

    this.periodDataSource.data = filtered;
  }

  refresh() { this.refreshList(); }

  readonly formatDate = formatDate;

  readonly formatShortDate = formatShortDate;

  getStatusClass(status: string): string {
    switch (status) {
      case 'Felülbírálásra vár':
        return 'felulbiralasra-var';
      case 'Felülvizsgálva':
        return 'felulvizsgalva';
      case 'Ellenőrzésre vár':
        return 'ellenorzesre-var';
      default:
        return 'default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Felülbírálásra vár':
        return 'pending_actions';
      case 'Felülvizsgálva':
        return 'task_alt';
      case 'Ellenőrzésre vár':
        return 'fact_check';
      default:
        return 'description';
    }
  }

  getPeriodStatusIcon(status: string): string {
    const normalized = status.toLowerCase();
    return normalized === 'lezárt' || normalized === 'zart' ? 'lock' : 'lock_open';
  }

  getPeriodStatusClass(status: string): string {
    const normalized = status.toLowerCase();
    return normalized === 'lezárt' || normalized === 'zart' ? 'period-status-locked' : 'period-status-open';
  }

  onDownloadAttachment() {
    this.alertService.open('A számla letöltése ebben a prototípusban nem érhető el.');
  }

  private filterUgyfel(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.invoiceService.getUgyfelek()
      .filter(option => option.toLowerCase().includes(filterValue))
      .filter(option => !this.selectedUgyfels.includes(option));
  }

  private filterStatus(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.invoiceService.getStatuses()
      .filter(option => option.toLowerCase().includes(filterValue))
      .filter(option => !this.selectedStatuses.includes(option));
  }

  private filterDirection(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.invoiceService.getDirections()
      .filter(option => option.toLowerCase().includes(filterValue))
      .filter(option => !this.selectedDirections.includes(option));
  }

  private filterType(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.invoiceService.getBizonylatTipusok()
      .filter(option => option.toLowerCase().includes(filterValue))
      .filter(option => !this.selectedTypes.includes(option));
  }

  private filterPeriodUgyfel(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.invoiceService.getUgyfelek()
      .filter(option => option.toLowerCase().includes(filterValue))
      .filter(option => !this.selectedPeriodUgyfels.includes(option));
  }

  private filterPeriodStatus(value: string): string[] {
    const filterValue = value.toLowerCase();
    return ['Nyitott', 'Lezárt']
      .filter(option => option.toLowerCase().includes(filterValue))
      .filter(option => !this.selectedPeriodStatuses.includes(option));
  }

  refreshPeriod() {
    this.applyPeriodFilter();
  }

  private filterAfaCodes(value: string | AfaCodeOption): AfaCodeOption[] {
    const query = typeof value === 'string' ? value.toLowerCase() : value.code.toLowerCase();
    if (!query) return this.afaCodes;
    return this.afaCodes.filter(option =>
      `${option.code} ${option.name} ${option.description}`.toLowerCase().includes(query)
    );
  }

  displayAfaCode(option: AfaCodeOption | string | null): string {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return `${option.code} - ${option.name}`;
  }

  displayVatOption(option: { code: string; name: string; description: string; rate: number } | null): string {
    if (!option) return '';
    return option.code;
  }

  addInvoiceItem() {
    this.invoiceItems.push({ name: '', unitPrice: 0, vat: this.vatOptions[0], qty: 1, unit: 'db' });
  }

  removeInvoiceItem(index: number) {
    if (this.invoiceItems.length <= 1) return;
    this.invoiceItems.splice(index, 1);
  }

  getLineNet(item: { unitPrice: number; qty: number }): number {
    return (item.unitPrice || 0) * (item.qty || 0);
  }

  getNetTotal(): number {
    return this.invoiceItems.reduce((sum, item) => sum + this.getLineNet(item), 0);
  }

  getVatTotal(): number {
    return this.invoiceItems.reduce((sum, item) => sum + this.getLineNet(item) * (item.vat?.rate || 0), 0);
  }

  getGrossTotal(): number {
    return this.getNetTotal() + this.getVatTotal();
  }

  private closeFilterPanels(active: 'ugyfel' | 'date' | 'status' | 'direction' | 'type') {
    this.showUgyfelPanel = active === 'ugyfel' ? this.showUgyfelPanel : false;
    this.showDatePanel = active === 'date' ? this.showDatePanel : false;
    this.showStatusPanel = active === 'status' ? this.showStatusPanel : false;
    this.showDirectionPanel = active === 'direction' ? this.showDirectionPanel : false;
    this.showTypePanel = active === 'type' ? this.showTypePanel : false;
  }

  private closePeriodPanels(active: 'ugyfel' | 'date' | 'status') {
    this.showPeriodUgyfelPanel = active === 'ugyfel' ? this.showPeriodUgyfelPanel : false;
    this.showPeriodDatePanel = active === 'date' ? this.showPeriodDatePanel : false;
    this.showPeriodStatusPanel = active === 'status' ? this.showPeriodStatusPanel : false;
  }

  private readonly smoothScroll = smoothScroll;

  private readonly lockFiltersScroll = lockFiltersScroll;

  private startScrollLock(kind: 'invoice' | 'period', container: HTMLElement, target: number) {
    this.stopScrollLock(kind);
    const interval = setInterval(() => {
      if (container.scrollLeft !== target) {
        container.scrollLeft = target;
      }
    }, 16);
    if (kind === 'invoice') {
      this.invoiceScrollLockInterval = interval;
    } else {
      this.periodScrollLockInterval = interval;
    }
  }

  private stopScrollLock(kind: 'invoice' | 'period') {
    const interval = kind === 'invoice' ? this.invoiceScrollLockInterval : this.periodScrollLockInterval;
    if (interval) {
      clearInterval(interval);
    }
    if (kind === 'invoice') {
      this.invoiceScrollLockInterval = null;
    } else {
      this.periodScrollLockInterval = null;
    }
  }

  private restoreFiltersScroll(kind: 'invoice' | 'period') {
    const container = kind === 'invoice' ? this.invoiceFiltersRef?.nativeElement : this.periodFiltersRef?.nativeElement;
    if (!container) return;
    const target = kind === 'invoice' ? this.invoiceFiltersScrollLeft : this.periodFiltersScrollLeft;
    container.scrollLeft = target;
    requestAnimationFrame(() => (container.scrollLeft = target));
    setTimeout(() => (container.scrollLeft = target), 50);
    setTimeout(() => (container.scrollLeft = target), 150);
  }

  private scrollFiltersToButton(
    kind: 'invoice' | 'period',
    buttonSelector: string,
    panelSelector: string,
    openPanel: () => void,
    focusSelector?: string
  ) {
    const container = kind === 'invoice' ? this.invoiceFiltersRef?.nativeElement : this.periodFiltersRef?.nativeElement;
    if (!container || window.innerWidth > 768) {
      openPanel();
      if (focusSelector && container) {
        setTimeout(() => {
          const el = container.querySelector(focusSelector) as HTMLInputElement | null;
          el?.focus({ preventScroll: true });
        }, 50);
      }
      return;
    }

    const btn = container.querySelector(buttonSelector) as HTMLElement | null;
    if (!btn) {
      openPanel();
      return;
    }

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const targetScroll = container.scrollLeft + (btnRect.left - containerRect.left) - 20;

    if (kind === 'invoice') {
      this.invoiceFiltersScrollLeft = targetScroll;
    } else {
      this.periodFiltersScrollLeft = targetScroll;
    }

    this.smoothScroll(container, targetScroll, 240);

    setTimeout(() => {
      openPanel();
      this.cdr.detectChanges();
      this.lockFiltersScroll(container, targetScroll);
      this.startScrollLock(kind, container, targetScroll);
      if (focusSelector) {
        setTimeout(() => {
          const el = container.querySelector(focusSelector) as HTMLInputElement | null;
          el?.focus({ preventScroll: true });
        }, 50);
      }
      setTimeout(() => this.positionPanelWithin(container, buttonSelector, panelSelector), 10);
    }, 260);
  }

  private positionPanelWithin(container: HTMLElement | null | undefined, btnSelector: string, panelSelector: string) {
    if (!container) return;
    const btn = container.querySelector(btnSelector) as HTMLElement | null;
    const panel = container.querySelector(panelSelector) as HTMLElement | null;
    if (!btn || !panel) return;
    if (window.innerWidth > 768) return;

    const btnRect = btn.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.top = `${btnRect.bottom + 6}px`;
    panel.style.left = '16px';
    panel.style.right = '16px';
    panel.style.width = 'auto';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const isDatepickerClick = target.closest('.mat-datepicker-popup, .mat-datepicker-content, .mat-calendar');

    const invoiceFilters = this.invoiceFiltersRef?.nativeElement;
    if (invoiceFilters && !invoiceFilters.contains(target) && !isDatepickerClick) {
      this.showUgyfelPanel = false;
      this.showDatePanel = false;
      this.showStatusPanel = false;
      this.showDirectionPanel = false;
      this.showTypePanel = false;
      this.stopScrollLock('invoice');
      this.restoreFiltersScroll('invoice');
    }

    const periodFilters = this.periodFiltersRef?.nativeElement;
    if (periodFilters && !periodFilters.contains(target) && !isDatepickerClick) {
      this.showPeriodUgyfelPanel = false;
      this.showPeriodDatePanel = false;
      this.showPeriodStatusPanel = false;
      this.stopScrollLock('period');
      this.restoreFiltersScroll('period');
    }
  }

  private readonly parseDateTime = parseDateTime;

  private parseDate(s: string): Date {
    const [y, m, d] = s.split('-').map(n => Number(n));
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      return new Date(y, m - 1, d);
    }
    return new Date(s);
  }
}
