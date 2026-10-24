import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormEditorStoreService } from '../../admin/services/form-editor-store.service';
import { ChoiceFilterComponent } from '../../ui/components/choice-filter.component';
import { DateRangeComponent } from '../../ui/components/date-range.component';
import { DocumentComponent } from './document.component';
import { InvoicesComponent } from './invoices.component';

describe.each(['documents', 'invoices'] as const)('%s shared list views', kind => {
  let fixture: ComponentFixture<DocumentComponent> | ComponentFixture<InvoicesComponent>;

  beforeEach(async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: () => Promise.resolve('') }));
    await TestBed.configureTestingModule({
      imports: [DocumentComponent, InvoicesComponent],
      providers: [{ provide: FormEditorStoreService, useValue: { getTemplates: () => Promise.resolve([]) } }]
    }).compileComponents();
    fixture = kind === 'documents'
      ? TestBed.createComponent(DocumentComponent)
      : TestBed.createComponent(InvoicesComponent);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.dataSource.data.length).toBeGreaterThan(0));
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('renders labeled columns, retains the projected paginator and opens/closes row details', async () => {
    const component = fixture.componentInstance;
    expect(component.dataSource.paginator).toBe(component.paginator);
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('th[scope="col"]').length).toBe(component.displayedColumns.length);
    const row = host.querySelector<HTMLTableRowElement>('tbody tr');
    expect(row).not.toBeNull();
    row!.click();
    fixture.detectChanges();
    expect(component.selectedItem).not.toBeNull();
    expect(host.querySelector('.detail-ugyfel')?.textContent).toContain(component.selectedItem!.ugyfel);
    host.querySelector<HTMLButtonElement>('.detail-header button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.selectedItem).toBeNull();
    expect(host.querySelector('app-record-table')).not.toBeNull();
  });

  it('keeps customer selection and date removal connected to the owning filters', async () => {
    const component = fixture.componentInstance;
    fixture.nativeElement.querySelector('.ugyfel-btn').click();
    fixture.detectChanges();
    const choices = fixture.debugElement.query(By.directive(ChoiceFilterComponent)).componentInstance as ChoiceFilterComponent;
    choices.chosen.emit('Kovács János');
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => {
      expect(component.dataSource.data.length).toBeGreaterThan(0);
      expect(component.dataSource.data.every(item => item.ugyfel === 'Kovács János')).toBe(true);
    });

    fixture.nativeElement.querySelector('.date-btn').click();
    fixture.detectChanges();
    const range = fixture.debugElement.query(By.directive(DateRangeComponent)).componentInstance as DateRangeComponent;
    component.dateFromCtrl.setValue(new Date(2026, 0, 1));
    range.removed.emit('from');
    await fixture.whenStable();
    expect(component.dateFromCtrl.value).toBeNull();
  });

  it('retains mobile paging, pull gestures and listener cleanup through the shared frame', async () => {
    vi.stubGlobal('IntersectionObserver', class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    });
    vi.stubGlobal('innerWidth', 375);
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.isMobileView).toBe(true);
    expect(component.dataSource.paginator).toBeNull();
    expect(component.dataSource.data.length).toBeLessThanOrEqual(10);

    const container: HTMLElement = fixture.nativeElement.querySelector('.table-container');
    const touch = (type: string, clientY: number) => container.dispatchEvent(
      Object.assign(new Event(type, { cancelable: true }), { touches: [{ clientY }] })
    );
    touch('touchstart', 0);
    touch('touchmove', 32);
    expect(component.pullProgress).toBe(50);
    touch('touchend', 32);
    expect(component.pullActive).toBe(false);
    expect(component.pullRefreshing).toBe(false);

    touch('touchstart', 0);
    touch('touchmove', 100);
    touch('touchend', 100);
    expect(component.pullRefreshing).toBe(true);
    await vi.waitFor(() => expect(component.pullRefreshing).toBe(false));

    const removeListener = vi.spyOn(container, 'removeEventListener');
    fixture.destroy();
    expect(removeListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
  });
});

describe('invoice period detail', () => {
  it('keeps the period header and back action independent of invoice selection', async () => {
    await TestBed.configureTestingModule({ imports: [InvoicesComponent] }).compileComponents();
    const fixture = TestBed.createComponent(InvoicesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.openPeriodsPopup();
    component.selectPeriodRow(component.periods[0]);
    fixture.detectChanges();
    const header: HTMLElement = fixture.nativeElement.querySelector('.period-detail-view .detail-header');
    expect(header.querySelector('.detail-meta')?.textContent).toContain(component.periods[0].idoszakLabel);
    expect(component.selectedItem).toBeNull();
    header.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(component.selectedPeriodItem).toBeNull();
    fixture.destroy();
  });
});
