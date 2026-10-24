import { ChangeDetectorRef, Directive, ElementRef, NgZone, ViewChild, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ListLoadingComponent } from '../list-loading.component';

/** Shared viewport behavior for the document and invoice lists. */
@Directive()
export abstract class ListViewport<T> {
  protected cdr = inject(ChangeDetectorRef);

  protected zone = inject(NgZone);

  protected intersectionObserver: IntersectionObserver | null = null;

  protected mobilePageSize = 10;

  protected mobileVisibleCount = 10;

  protected mobileFilteredItems: T[] = [];

  protected lastFilteredItems: T[] = [];

  protected resizeHandler?: () => void;

  protected pullStartY = 0;

  protected pullDistanceInternal = 0;

  protected pullEligible = false;

  protected pullTouchMoveHandler?: (event: TouchEvent) => void;

  protected pullTouchStartHandler?: (event: TouchEvent) => void;

  protected pullTouchEndHandler?: () => void;

  protected readonly pullThreshold = 64;

  protected readonly pullMax = 120;

  protected readonly pullStartThreshold = 8;

  isMobileView = window.innerWidth <= 768;

  mobileLoadingMore = false;

  pullActive = false;

  pullRefreshing = false;

  searchCtrl = new FormControl('');

  showSearchPanel = false;

  searchTerms: string[] = [];

  dataSource = new MatTableDataSource<T>([]);

  loading = false;

  @ViewChild('paginator') paginator!: MatPaginator;

  @ViewChild(ListLoadingComponent) private listLoading?: ListLoadingComponent;

  protected get tableScrollSentinel(): ElementRef<HTMLElement> | undefined {
    return this.listLoading?.sentinel;
  }

  protected get tableContainer(): ElementRef<HTMLElement> | undefined {
    return this.listLoading?.container;
  }

  protected readonly mobileLoadDelay: number = 800;
  protected readonly checkVisibleSentinel: boolean = false;

  abstract applyFilter(): void;
  abstract refresh(): void;

  filterBySearch() {
    const query = (this.searchCtrl.value || '').trim();
    if (!query) return;

    // Add as search chip if not already present
    if (!this.searchTerms.includes(query)) {
      this.searchTerms.push(query);
    }

    // Clear input and close search panel
    this.searchCtrl.setValue('', { emitEvent: false });
    this.showSearchPanel = false;

    // Apply filter with all search terms
    this.applyFilter();
  }

  removeSearchTerm(term: string) {
    const i = this.searchTerms.indexOf(term);
    if (i >= 0) {
      this.searchTerms.splice(i, 1);
      this.applyFilter();
    }
  }

  protected setupResizeListener() {
    this.teardownResizeListener();
    this.resizeHandler = () => this.updateViewMode(window.innerWidth);
    window.addEventListener('resize', this.resizeHandler, { passive: true });
  }

  protected teardownResizeListener() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.resizeHandler = undefined;
  }

  protected updateViewMode(width: number) {
    const nextIsMobile = width <= 768;
    if (nextIsMobile === this.isMobileView) return;

    this.isMobileView = nextIsMobile;
    this.updatePaginatorMode();
    if (this.lastFilteredItems.length > 0) {
      this.updateTableData(this.lastFilteredItems);
    }
    this.refreshMobileObserver();
    if (!this.isMobileView) {
      this.resetPullState();
    }
    this.cdr.markForCheck();
  }

  get pullDistance(): number {
    return this.pullRefreshing ? this.pullThreshold : this.pullDistanceInternal;
  }

  get pullProgress(): number {
    if (this.pullRefreshing) return 100;
    return Math.min(100, Math.round((this.pullDistanceInternal / this.pullThreshold) * 100));
  }

  protected setupPullToRefresh() {
    if (!this.tableContainer) return;
    this.teardownPullToRefresh();

    const container = this.tableContainer.nativeElement;
    this.pullTouchStartHandler = (event: TouchEvent) => {
      if (!this.isMobileView || this.loading || this.mobileLoadingMore || this.pullRefreshing) return;
      this.pullEligible = container.scrollTop === 0;
      this.pullStartY = event.touches[0]?.clientY ?? 0;
      this.pullDistanceInternal = 0;
      this.cdr.markForCheck();
    };

    this.pullTouchMoveHandler = (event: TouchEvent) => {
      if (!this.pullEligible || this.pullRefreshing) return;
      if (container.scrollTop > 0) {
        this.resetPullState();
        return;
      }
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - this.pullStartY;
      if (delta <= 0) {
        if (this.pullActive) {
          this.resetPullState();
        }
        return;
      }

      if (!this.pullActive && delta < this.pullStartThreshold) {
        return;
      }

      this.pullActive = true;
      this.pullDistanceInternal = Math.min(this.pullMax, delta);
      if (this.pullDistanceInternal > 0) {
        event.preventDefault();
      }
      this.cdr.markForCheck();
    };

    this.pullTouchEndHandler = () => {
      if (!this.pullActive) {
        this.pullEligible = false;
        return;
      }
      if (this.pullDistanceInternal >= this.pullThreshold) {
        this.pullRefreshing = true;
        this.cdr.markForCheck();
        this.refresh();
      } else {
        this.resetPullState();
      }
      this.pullEligible = false;
      this.cdr.markForCheck();
    };

    container.addEventListener('touchstart', this.pullTouchStartHandler, { passive: true });
    container.addEventListener('touchmove', this.pullTouchMoveHandler, { passive: false });
    container.addEventListener('touchend', this.pullTouchEndHandler, { passive: true });
    container.addEventListener('touchcancel', this.pullTouchEndHandler, { passive: true });
  }

  protected teardownPullToRefresh() {
    if (!this.tableContainer) return;
    const container = this.tableContainer.nativeElement;
    if (this.pullTouchStartHandler) {
      container.removeEventListener('touchstart', this.pullTouchStartHandler);
    }
    if (this.pullTouchMoveHandler) {
      container.removeEventListener('touchmove', this.pullTouchMoveHandler);
    }
    if (this.pullTouchEndHandler) {
      container.removeEventListener('touchend', this.pullTouchEndHandler);
      container.removeEventListener('touchcancel', this.pullTouchEndHandler);
    }
    this.pullTouchStartHandler = undefined;
    this.pullTouchMoveHandler = undefined;
    this.pullTouchEndHandler = undefined;
  }

  protected resetPullState() {
    this.pullActive = false;
    this.pullDistanceInternal = 0;
    this.pullEligible = false;
  }

  protected updateTableData(filtered: T[]) {
    if (this.isMobileView) {
      this.mobileFilteredItems = filtered;
      this.mobileVisibleCount = Math.min(this.mobilePageSize, filtered.length);
      this.dataSource.data = filtered.slice(0, this.mobileVisibleCount);
    } else {
      this.dataSource.data = filtered;
      if (this.paginator) this.paginator.firstPage();
    }
  }

  protected refreshMobileObserver() {
    if (!this.isMobileView || !this.tableScrollSentinel || !this.tableContainer) return;
    if (!this.intersectionObserver) {
      this.setupMobileIntersectionObserver();
      return;
    }

    const sentinel = this.tableScrollSentinel.nativeElement;
    this.intersectionObserver.unobserve(sentinel);
    this.intersectionObserver.observe(sentinel);

    if (!this.checkVisibleSentinel) return;
    const root = this.tableContainer.nativeElement;
    const sentinelRect = sentinel.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const isVisible = sentinelRect.top <= rootRect.bottom && sentinelRect.bottom >= rootRect.top;
    if (isVisible) {
      this.loadMoreMobileItems();
    }
  }

  protected updatePaginatorMode() {
    if (this.isMobileView) {
      this.dataSource.paginator = null;
    } else if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  protected setupMobileIntersectionObserver() {
    if (!this.isMobileView || !this.tableScrollSentinel || !this.tableContainer) return;
    this.teardownMobileIntersectionObserver();

    const root = this.tableContainer.nativeElement;
    this.intersectionObserver = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          this.loadMoreMobileItems();
        }
      },
      { root, rootMargin: '0px 0px 200px 0px', threshold: 0.01 }
    );

    this.intersectionObserver.observe(this.tableScrollSentinel.nativeElement);
  }

  protected teardownMobileIntersectionObserver() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }

  protected loadMoreMobileItems() {

    if (!this.isMobileView || this.loading || this.mobileLoadingMore) return;

    if (this.mobileVisibleCount >= this.mobileFilteredItems.length) return;


    this.zone.run(() => {
      this.mobileLoadingMore = true;
      this.cdr.markForCheck();
    });


    const nextCount = Math.min(this.mobileVisibleCount + this.mobilePageSize, this.mobileFilteredItems.length);

    setTimeout(() => {

      this.zone.run(() => {
        this.mobileVisibleCount = nextCount;
        this.dataSource.data = this.mobileFilteredItems.slice(0, this.mobileVisibleCount);
        this.mobileLoadingMore = false;
        this.refreshMobileObserver();
        this.cdr.markForCheck();
      });
    }, this.mobileLoadDelay);
  }

  protected refreshList(beforeFilter?: () => void): void {
    this.loading = true;
    setTimeout(() => {
      beforeFilter?.();
      this.applyFilter();
      this.loading = false;
      this.pullRefreshing = false;
      this.resetPullState();
      this.cdr.markForCheck();
    }, 500);
  }

}
