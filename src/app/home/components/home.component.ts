import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { KezdolapMenuService, MenuNode, MenuSubmenu } from '../services/kezdolap-menu.service';
import { IssueSelectionService } from '../../shared/issue-selection.service';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  private readonly overlayGap = 0;
  private menuService = inject(KezdolapMenuService);
  private issueSelection = inject(IssueSelectionService);
  private cdr = inject(ChangeDetectorRef);
  private searchRowResizeObserver?: ResizeObserver;
  private searchWrapperResizeObserver?: ResizeObserver;

  @ViewChild('searchRow') private searchRowRef?: ElementRef<HTMLElement>;
  @ViewChild('searchWrapper') private searchWrapperRef?: ElementRef<HTMLElement>;

  searchOverlayTop = 52;
  searchOverlayHeight = 480;

  searchCtrl = new FormControl('');
  searchTerms: string[] = [];

  menus: MenuNode[] = this.menuService.getMenu();
  currentMenu: MenuNode | null = null;
  currentSubmenu: MenuSubmenu | null = null;

  showDetailedSearch = false;
  showPopup = false;
  popupTitle = '';

  selectedIssue = this.issueSelection.selectedIssue;
  selectedIssueLabel = this.issueSelection.selectedIssueLabel;

  isNavIssue(): boolean {
    return (this.selectedIssue() ?? '').toLowerCase() === 'nav';
  }

  ngAfterViewInit(): void {
    this.updateSearchOverlayTop();

    if (typeof ResizeObserver !== 'undefined' && this.searchRowRef?.nativeElement) {
      this.searchRowResizeObserver = new ResizeObserver(() => this.updateSearchOverlayTop());
      this.searchRowResizeObserver.observe(this.searchRowRef.nativeElement);
    }

    if (typeof ResizeObserver !== 'undefined' && this.searchWrapperRef?.nativeElement) {
      this.searchWrapperResizeObserver = new ResizeObserver(() => this.updateSearchOverlayTop());
      this.searchWrapperResizeObserver.observe(this.searchWrapperRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.searchRowResizeObserver?.disconnect();
    this.searchWrapperResizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleSearchMetricsUpdate();
  }

  addSearchTerm(): void {
    const value = (this.searchCtrl.value || '').trim();
    if (!value) {
      return;
    }

    if (!this.searchTerms.includes(value)) {
      this.searchTerms = [...this.searchTerms, value];
    }

    this.searchCtrl.setValue('');
    this.scheduleSearchMetricsUpdate();
    this.openDetailedPopup('További szűrők és tartalom');
    this.scheduleSearchMetricsUpdate();
  }

  removeSearchTerm(term: string): void {
    this.searchTerms = this.searchTerms.filter(t => t !== term);
    this.scheduleSearchMetricsUpdate();
  }

  toggleDetailedSearch(): void {
    this.showDetailedSearch = !this.showDetailedSearch;
    this.scheduleSearchMetricsUpdate();
    if (!this.showDetailedSearch) {
      this.resetMenuNavigation();
    }
  }

  resetMenuNavigation(): void {
    this.currentMenu = null;
    this.currentSubmenu = null;
  }

  selectMenu(menu: MenuNode): void {
    if (menu.submenus.length === 0 && menu.items.length === 0) {
      this.openDetailedPopup(this.getPopupTitle(menu.title));
      return;
    }

    if (menu.submenus.length === 0 && menu.items.length > 0) {
      this.currentMenu = menu;
      this.currentSubmenu = null;
      return;
    }

    if (menu.submenus.length > 0) {
      this.currentMenu = menu;
      this.currentSubmenu = null;
    }
  }

  selectSubmenu(submenu: MenuSubmenu): void {
    this.currentSubmenu = submenu;
  }

  selectItem(item: string): void {
    const pathParts = [this.currentMenu?.title, this.currentSubmenu?.title, item]
      .filter(Boolean)
      .join(' > ');
    this.openDetailedPopup(this.getPopupTitle(pathParts));
  }

  goBack(): void {
    if (this.currentSubmenu) {
      this.currentSubmenu = null;
      return;
    }

    if (this.currentMenu) {
      this.currentMenu = null;
    }
  }

  getHeaderTitle(): string {
    if (this.currentMenu && this.currentSubmenu) {
      return `${this.currentMenu.title} > ${this.currentSubmenu.title}`;
    }

    return this.currentMenu?.title || '';
  }

  shouldShowBack(): boolean {
    return !!this.currentMenu;
  }

  closePopup(): void {
    this.showPopup = false;
  }

  private openDetailedPopup(title: string): void {
    this.popupTitle = title;
    this.showPopup = true;
    this.showDetailedSearch = false;
    this.resetMenuNavigation();
    this.scheduleSearchMetricsUpdate();
  }

  private getPopupTitle(path: string): string {
    const cleaned = this.stripMenuItemSuffix(path);
    if (cleaned.toLowerCase().startsWith('részletes keresés')) {
      return 'További szűrők és tartalom';
    }

    return cleaned;
  }

  formatMenuLabel(label: string): string {
    return this.stripMenuItemSuffix(label);
  }

  private stripMenuItemSuffix(value: string): string {
    return value.replace(/\s+menu item$/i, '');
  }

  private scheduleSearchMetricsUpdate(): void {
    requestAnimationFrame(() => {
      this.updateSearchOverlayTop();
      requestAnimationFrame(() => this.updateSearchOverlayTop());
    });
  }

  private updateSearchOverlayTop(): void {
    const rowElement = this.searchRowRef?.nativeElement;
    const blockElement = rowElement?.parentElement;
    if (!rowElement || !blockElement) {
      return;
    }

    const contentAreaElement = this.searchRowRef?.nativeElement.closest('.content-area') as HTMLElement | null;
    const blockRect = blockElement.getBoundingClientRect();
    const measuredTop = Math.max(44, rowElement.offsetTop + rowElement.offsetHeight + this.overlayGap);
    const clippingRect = (contentAreaElement ?? blockElement).getBoundingClientRect();
    const measuredHeight = Math.max(220, Math.floor(clippingRect.bottom - (blockRect.top + measuredTop)));

    if (measuredTop === this.searchOverlayTop && measuredHeight === this.searchOverlayHeight) {
      return;
    }

    this.searchOverlayTop = measuredTop;
    this.searchOverlayHeight = measuredHeight;
    this.cdr.markForCheck();
  }
}
