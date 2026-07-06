import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DEFAULT_USER_PROFILE,
  FormEditorViewport,
  FormFieldDefinition,
  FormFieldLayout,
  FormFieldType,
  FormSectionDefinition,
  FormSectionLayout,
  FormTemplate,
  FormTemplatePage,
  SECTION_LIBRARY
} from '../../models/form-editor.model';
import { FormEditorStoreService } from '../../services/form-editor-store.service';

type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'se' | 'nw' | 'ne' | 'sw';
type FormElementType = 'page' | 'container';

interface ResizeState {
  sectionId: string;
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startColSpan: number;
  startRowSpan: number;
  columnWidth: number;
  rowHeight: number;
}

interface DragState {
  sectionId: string;
  startX: number;
  startY: number;
  startCol: number;
  startRow: number;
  columnWidth: number;
  rowHeight: number;
}

interface FieldResizeState {
  fieldId: string;
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startCol: number;
  startRow: number;
  startColSpan: number;
  startRowSpan: number;
  columnWidth: number;
  rowHeight: number;
}

interface FieldDragState {
  fieldId: string;
  startX: number;
  startY: number;
  startCol: number;
  startRow: number;
  columnWidth: number;
  rowHeight: number;
}

type EditorPanelMode = 'form' | 'template';

interface FieldPaletteItem {
  type: FormFieldType;
  label: string;
  icon: string;
}

interface FormElementPaletteItem {
  type: FormElementType;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-form-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss']
})
export class FormEditorComponent implements OnInit {
  private readonly store = inject(FormEditorStoreService);
  private readonly fieldDragType = 'application/x-e-kozig-field-type';
  private readonly sectionDragType = 'application/x-e-kozig-section-id';
  private readonly formElementDragType = 'application/x-e-kozig-form-element';
  private readonly formFieldDragType = 'application/x-e-kozig-form-field';
  private readonly pageDragType = 'application/x-e-kozig-page-index';

  @ViewChild('formCanvas') formCanvas?: ElementRef<HTMLElement>;

  sectionLibrary: FormSectionDefinition[] = SECTION_LIBRARY.map(section => this.clone(section));
  readonly fieldPalette: FieldPaletteItem[] = [
    { type: 'header', label: 'Címsor', icon: 'title' },
    { type: 'text', label: 'Szöveg', icon: 'short_text' },
    { type: 'textarea', label: 'Hosszú szöveg', icon: 'notes' },
    { type: 'select', label: 'Választólista', icon: 'arrow_drop_down_circle' },
    { type: 'checkbox', label: 'Checkbox', icon: 'check_box' },
    { type: 'date', label: 'Dátum', icon: 'event' },
    { type: 'number', label: 'Szám', icon: 'pin' },
    { type: 'email', label: 'E-mail', icon: 'alternate_email' },
    { type: 'tel', label: 'Telefon', icon: 'phone' }
  ];
  readonly formElementPalette: FormElementPaletteItem[] = [
    { type: 'page', label: 'Oldal / tab', description: 'Új űrlapoldal a varázslóban', icon: 'tab' },
    { type: 'container', label: 'Konténer', description: 'Feliratos mezőcsoport a vásznon', icon: 'crop_square' }
  ];
  readonly currentUser = DEFAULT_USER_PROFILE;

  templates: FormTemplate[] = [];
  activeTemplate: FormTemplate | null = null;
  activeSectionTemplate: FormSectionDefinition | null = null;
  selectedTemplateId = '';
  selectedSectionId = SECTION_LIBRARY[0]?.id ?? '';
  selectedLibrarySectionId = SECTION_LIBRARY[0]?.id ?? '';
  panelMode: EditorPanelMode = 'form';
  activePageIndex = 0;
  viewport: FormEditorViewport = 'desktop';
  builderEditing = false;
  fieldValues: Record<string, string | boolean | number | null> = {};
  fieldOptionDrafts: Record<string, string> = {};
  customFieldSectionId = '';
  customFieldLabel = '';
  customFieldType: FormFieldType = 'text';
  customFieldOptions = 'Igen\nNem';
  microBlockName = 'Új blokk';
  microBlockCode = 'CUSTOM';
  microBlockMandatory = false;
  microBlockFields: FormFieldDefinition[] = [];
  microFieldLabel = '';
  microFieldType: FormFieldType = 'text';
  microFieldRequired = false;
  microFieldOptions = 'Igen\nNem';
  selectedTemplateFieldId: string | null = null;
  selectedTemplateFieldIds: string[] = [];
  sectionFilter = '';
  selectionTemplateName = '';
  newWizardDialogOpen = false;
  newWizardName = '';
  pageSettingsOpen = false;
  selectedPageSettingsIndex: number | null = null;
  sectionSettingsOpen = false;
  selectedSectionSettingsId: string | null = null;
  formFieldSettingsOpen = false;
  selectedFormFieldContext: { sectionId: string; fieldId: string } | null = null;
  fieldSettingsOpen = false;
  previewTemplate: FormTemplate | null = null;
  previewPageIndex = 0;
  previewFieldValues: Record<string, string | boolean | number | null> = {};
  loading = true;
  saving = false;
  statusMessage = '';

  private resizeState: ResizeState | null = null;
  private dragState: DragState | null = null;
  private fieldResizeState: FieldResizeState | null = null;
  private fieldDragState: FieldDragState | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadEditorData();
  }

  get hasActiveTemplate(): boolean {
    return !!this.activeTemplate;
  }

  get activePage(): FormTemplatePage | null {
    return this.activeTemplate?.pages[this.activePageIndex] ?? null;
  }

  get selectedPageForSettings(): FormTemplatePage | null {
    if (this.selectedPageSettingsIndex === null) {
      return null;
    }
    return this.activeTemplate?.pages[this.selectedPageSettingsIndex] ?? null;
  }

  get selectedSectionForSettings(): FormSectionDefinition | null {
    if (!this.selectedSectionSettingsId) {
      return null;
    }
    return this.activeSections.find(section => section.id === this.selectedSectionSettingsId) ?? null;
  }

  get selectedFormFieldSection(): FormSectionDefinition | null {
    const context = this.selectedFormFieldContext;
    if (!context) {
      return null;
    }
    return this.activeSections.find(section => section.id === context.sectionId) ?? null;
  }

  get selectedFormField(): FormFieldDefinition | null {
    const context = this.selectedFormFieldContext;
    const section = this.selectedFormFieldSection;
    if (!context || !section) {
      return null;
    }
    return section.fields.find(field => field.id === context.fieldId) ?? null;
  }

  get activeSections(): FormSectionDefinition[] {
    return this.activePage?.sections ?? [];
  }

  get activeSectionTemplateFields(): FormFieldDefinition[] {
    return this.activeSectionTemplate?.fields ?? [];
  }

  get selectedTemplateField(): FormFieldDefinition | null {
    const fieldId = this.selectedTemplateFieldId ?? this.selectedTemplateFieldIds.at(-1);
    if (!fieldId) {
      return null;
    }
    return this.activeSectionTemplateFields.find(field => field.id === fieldId) ?? null;
  }

  get selectedTemplateFields(): FormFieldDefinition[] {
    const selected = new Set(this.selectedTemplateFieldIds);
    return this.activeSectionTemplateFields.filter(field => selected.has(field.id));
  }

  get hasMultiTemplateSelection(): boolean {
    return this.selectedTemplateFieldIds.length > 1;
  }

  get filteredSectionLibrary(): FormSectionDefinition[] {
    const filter = this.sectionFilter.trim().toLocaleLowerCase('hu');
    if (!filter) {
      return this.sectionLibrary;
    }
    return this.sectionLibrary.filter(section =>
      section.title.toLocaleLowerCase('hu').includes(filter)
      || (section.navCode ?? '').toLocaleLowerCase('hu').includes(filter)
      || (section.description ?? '').toLocaleLowerCase('hu').includes(filter)
    );
  }

  get previewPages(): FormTemplatePage[] {
    return this.previewTemplate?.pages ?? [];
  }

  get previewSections(): FormSectionDefinition[] {
    return this.previewPages[this.previewPageIndex]?.sections ?? [];
  }

  get gridColumns(): number {
    return this.activeTemplate?.grid?.columns ?? 12;
  }

  get gridRows(): number {
    return this.activeTemplate?.grid?.rows ?? 6;
  }

  get gridStyle(): Record<string, string> {
    return {
      'grid-template-columns': `repeat(${this.gridColumns}, minmax(0, 1fr))`,
      'grid-template-rows': `repeat(${this.gridRows}, 132px)`
    };
  }

  async loadEditorData(): Promise<void> {
    this.loading = true;
    this.statusMessage = '';
    try {
      const [templates, sectionTemplates] = await Promise.all([
        this.store.getTemplates(),
        this.store.getSectionTemplates()
      ]);
      this.templates = templates.map(template => this.normalizeTemplate(template));
      this.sectionLibrary = sectionTemplates.map(section => this.normalizeSectionTemplate(section));
      const firstTemplate = this.templates[0];
      if (firstTemplate) {
        this.selectTemplate(firstTemplate.id);
      }
      const firstSection = this.sectionLibrary[0];
      if (firstSection) {
        this.selectedLibrarySectionId = firstSection.id;
        this.selectSectionTemplate(firstSection.id, false);
      }
    } catch (error) {
      this.statusMessage = 'A helyi űrlaptár nem érhető el.';
      console.error(error);
    } finally {
      this.loading = false;
    }
  }

  selectTemplate(templateId: string): void {
    const template = this.templates.find(item => item.id === templateId);
    if (!template) {
      return;
    }

    this.activeTemplate = this.normalizeTemplate(template);
    this.selectedTemplateId = template.id;
    this.panelMode = 'form';
    this.activePageIndex = 0;
    this.builderEditing = false;
    this.fieldValues = {};
    this.initializeFieldValues();
    this.customFieldSectionId = this.activeSections[0]?.id ?? '';
    this.statusMessage = '';
  }

  selectSectionTemplate(sectionId: string, activatePanel = true): void {
    const section = this.sectionLibrary.find(item => item.id === sectionId);
    if (!section) {
      return;
    }

    this.activeSectionTemplate = this.normalizeSectionTemplate(section);
    this.selectedSectionId = section.id;
    this.selectedTemplateFieldId = this.activeSectionTemplate.fields[0]?.id ?? null;
    this.selectedTemplateFieldIds = this.selectedTemplateFieldId ? [this.selectedTemplateFieldId] : [];
    this.selectionTemplateName = '';
    this.fieldSettingsOpen = false;
    this.refreshFieldOptionDrafts();
    if (activatePanel) {
      this.panelMode = 'template';
      this.statusMessage = '';
    }
  }

  showFormPanel(): void {
    this.panelMode = 'form';
  }

  showTemplatePanel(): void {
    this.panelMode = 'template';
    if (!this.activeSectionTemplate && this.sectionLibrary[0]) {
      this.selectSectionTemplate(this.sectionLibrary[0].id, false);
    }
  }

  setViewport(viewport: FormEditorViewport): void {
    this.viewport = viewport;
  }

  openOnyaPreview(template: FormTemplate | null = this.activeTemplate): void {
    if (!template) {
      return;
    }
    this.previewTemplate = this.normalizeTemplate(template);
    this.previewPageIndex = 0;
    this.previewFieldValues = {};
    this.previewTemplate.pages
      .flatMap(page => page.sections)
      .flatMap(section => section.fields)
      .forEach(field => {
        if (field.id in this.fieldValues) {
          this.previewFieldValues[field.id] = this.fieldValues[field.id];
          return;
        }
        if (field.autofillKey) {
          this.previewFieldValues[field.id] = this.currentUser[field.autofillKey];
          return;
        }
        this.previewFieldValues[field.id] = field.type === 'checkbox' ? false : '';
      });
  }

  closeOnyaPreview(): void {
    this.previewTemplate = null;
    this.previewPageIndex = 0;
    this.previewFieldValues = {};
  }

  setPreviewPage(index: number): void {
    if (index < 0 || index >= this.previewPages.length) {
      return;
    }
    this.previewPageIndex = index;
  }

  toggleBuilderEditing(): void {
    this.builderEditing = !this.builderEditing;
  }

  async handleStencilAction(): Promise<void> {
    if (this.panelMode === 'template') {
      await this.saveSectionTemplate();
      return;
    }

    if (this.builderEditing) {
      await this.saveTemplate();
      return;
    }

    this.panelMode = 'form';
    this.builderEditing = true;
  }

  async handlePrimaryEditAction(): Promise<void> {
    if (this.panelMode === 'template') {
      await this.saveSectionTemplate();
      return;
    }

    if (!this.builderEditing) {
      this.builderEditing = true;
      return;
    }

    await this.saveTemplate();
  }

  openNewWizardDialog(): void {
    this.newWizardName = '';
    this.newWizardDialogOpen = true;
  }

  closeNewWizardDialog(): void {
    this.newWizardDialogOpen = false;
    this.newWizardName = '';
  }

  async confirmCreateWizard(): Promise<void> {
    const name = this.newWizardName.trim();
    if (!name) {
      this.statusMessage = 'Űrlapnév szükséges.';
      return;
    }

    await this.createWizard(name);
    this.closeNewWizardDialog();
  }

  setActivePage(index: number): void {
    if (!this.activeTemplate || index < 0 || index >= this.activeTemplate.pages.length) {
      return;
    }
    this.activePageIndex = index;
    this.customFieldSectionId = this.activeSections[0]?.id ?? '';
  }

  openPageSettings(index: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.activeTemplate || index < 0 || index >= this.activeTemplate.pages.length) {
      return;
    }

    this.selectedPageSettingsIndex = index;
    this.pageSettingsOpen = true;
  }

  closePageSettings(): void {
    this.pageSettingsOpen = false;
    this.selectedPageSettingsIndex = null;
  }

  openSectionSettings(section: FormSectionDefinition, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.builderEditing) {
      return;
    }
    this.selectedSectionSettingsId = section.id;
    this.sectionSettingsOpen = true;
  }

  closeSectionSettings(): void {
    const section = this.selectedSectionForSettings;
    if (section) {
      section.layout.colSpan = this.clamp(Number(section.layout.colSpan) || 4, 2, this.gridColumns);
      section.layout.rowSpan = this.clamp(Number(section.layout.rowSpan) || 2, 1, this.gridRows);
      section.layout.col = this.clamp(Number(section.layout.col) || 1, 1, Math.max(1, this.gridColumns - section.layout.colSpan + 1));
      section.layout.row = this.clamp(Number(section.layout.row) || 1, 1, Math.max(1, this.gridRows - section.layout.rowSpan + 1));
    }
    this.sectionSettingsOpen = false;
    this.selectedSectionSettingsId = null;
    this.syncTemplateSections();
  }

  openFormFieldSettings(section: FormSectionDefinition, field: FormFieldDefinition, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.builderEditing) {
      return;
    }
    this.selectedFormFieldContext = { sectionId: section.id, fieldId: field.id };
    this.formFieldSettingsOpen = true;
    this.fieldOptionDrafts[field.id] = field.options?.map(option => option.label).join('\n') ?? '';
  }

  closeFormFieldSettings(): void {
    this.formFieldSettingsOpen = false;
    this.selectedFormFieldContext = null;
    this.syncTemplateSections();
  }

  addPage(): void {
    if (!this.activeTemplate || !this.builderEditing) {
      return;
    }
    const page: FormTemplatePage = {
      id: this.createId('form-page'),
      title: `Oldal ${this.activeTemplate.pages.length + 1}`,
      mandatory: false,
      sections: []
    };
    this.activeTemplate.pages = [...this.activeTemplate.pages, page];
    this.setActivePage(this.activeTemplate.pages.length - 1);
    this.syncTemplateSections();
  }

  addFormElement(type: FormElementType): void {
    if (type === 'page') {
      this.addPage();
      return;
    }
    this.addContainerToActiveForm();
  }

  removeActivePage(): void {
    if (!this.activeTemplate || !this.builderEditing || this.activeTemplate.pages.length <= 1) {
      return;
    }
    const removed = this.activeTemplate.pages[this.activePageIndex];
    removed?.sections.flatMap(section => section.fields).forEach(field => delete this.fieldValues[field.id]);
    this.activeTemplate.pages = this.activeTemplate.pages.filter((_, index) => index !== this.activePageIndex);
    this.activePageIndex = Math.max(0, this.activePageIndex - 1);
    this.customFieldSectionId = this.activeSections[0]?.id ?? '';
    this.syncTemplateSections();
  }

  removePage(index: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.activeTemplate || !this.builderEditing || this.activeTemplate.pages.length <= 1) {
      return;
    }

    const removed = this.activeTemplate.pages[index];
    removed?.sections.flatMap(section => section.fields).forEach(field => delete this.fieldValues[field.id]);
    this.activeTemplate.pages = this.activeTemplate.pages.filter((_, pageIndex) => pageIndex !== index);
    if (this.activePageIndex >= this.activeTemplate.pages.length) {
      this.activePageIndex = this.activeTemplate.pages.length - 1;
    } else if (index < this.activePageIndex) {
      this.activePageIndex -= 1;
    }
    this.customFieldSectionId = this.activeSections[0]?.id ?? '';
    this.syncTemplateSections();
  }

  removeSelectedPage(): void {
    if (this.selectedPageSettingsIndex === null) {
      return;
    }
    const index = this.selectedPageSettingsIndex;
    this.closePageSettings();
    this.removePage(index);
  }

  onPageTabDragStart(event: DragEvent, index: number): void {
    if (!this.builderEditing) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    event.dataTransfer?.setData(this.pageDragType, String(index));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onPageTabDragOver(event: DragEvent): void {
    if (!this.builderEditing || !this.hasDragData(event, this.pageDragType)) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onPageTabDrop(event: DragEvent, targetIndex: number): void {
    if (!this.activeTemplate || !this.builderEditing) {
      return;
    }

    const sourceIndex = Number(this.getDragData(event, this.pageDragType));
    if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= this.activeTemplate.pages.length) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const insertAfter = event.clientX > rect.left + rect.width / 2;
    this.movePage(sourceIndex, targetIndex + (insertAfter ? 1 : 0));
  }

  async createWizard(name = 'Új űrlap'): Promise<void> {
    const navCode = this.slugify(name).toUpperCase().slice(0, 12) || 'UJURLAP';
    const template: FormTemplate = {
      id: this.createId('form-template'),
      name,
      navCode,
      description: 'Összeállított NAV űrlap',
      mandatory: false,
      grid: { columns: 12, rows: 6 },
      pages: [
        {
          id: this.createId('form-page'),
          title: 'Oldal 1',
          mandatory: true,
          sections: []
        }
      ],
      updatedAt: new Date().toISOString(),
      sections: []
    };

    this.saving = true;
    try {
      await this.store.saveTemplate(template);
      this.templates = (await this.store.getTemplates()).map(item => this.normalizeTemplate(item));
      this.selectTemplate(template.id);
      this.panelMode = 'form';
      this.builderEditing = true;
      this.statusMessage = 'Új űrlap létrehozva.';
    } catch (error) {
      this.statusMessage = 'Az új űrlap mentése sikertelen.';
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  createSectionTemplate(): void {
    const section: FormSectionDefinition = {
      id: this.createId('section-template'),
      title: 'Új sablon',
      navCode: 'CUSTOM',
      description: 'Egyedi űrlapblokk',
      mandatory: false,
      layout: { col: 1, row: 1, colSpan: 4, rowSpan: 2 },
      fields: []
    };

    this.sectionLibrary = [section, ...this.sectionLibrary];
    this.selectSectionTemplate(section.id);
    this.selectedLibrarySectionId = section.id;
    this.microFieldLabel = '';
    this.microFieldType = 'text';
    this.microFieldRequired = false;
    this.statusMessage = 'Új sablon nyitva. Adj hozzá mezőket, majd mentsd.';
  }

  async duplicateWizard(): Promise<void> {
    if (!this.activeTemplate) {
      return;
    }

    const template: FormTemplate = {
      ...this.clone(this.activeTemplate),
      id: this.createId('form-template'),
      name: `${this.activeTemplate.name} másolat`,
      navCode: this.activeTemplate.navCode || 'CUSTOM',
      updatedAt: new Date().toISOString()
    };
    template.sections = template.pages.flatMap(page => page.sections);

    this.saving = true;
    try {
      await this.store.saveTemplate(template);
      this.templates = (await this.store.getTemplates()).map(item => this.normalizeTemplate(item));
      this.selectTemplate(template.id);
      this.statusMessage = 'Űrlap másolat létrehozva.';
    } catch (error) {
      this.statusMessage = 'Az új sablon mentése sikertelen.';
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  addSelectedSection(): void {
    this.addSectionFromLibrary(this.selectedLibrarySectionId);
  }

  addSection(sectionId: string): void {
    this.selectedLibrarySectionId = sectionId;
    this.addSectionFromLibrary(sectionId);
  }

  onFormElementDragStart(event: DragEvent, type: FormElementType): void {
    if (!this.builderEditing) {
      event.preventDefault();
      return;
    }

    event.dataTransfer?.setData(this.formElementDragType, type);
    event.dataTransfer?.setData('text/plain', type);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onSectionPaletteDragStart(event: DragEvent, sectionId: string): void {
    if (this.panelMode === 'form' && !this.builderEditing) {
      event.preventDefault();
      return;
    }

    event.dataTransfer?.setData(this.sectionDragType, sectionId);
    event.dataTransfer?.setData('text/plain', sectionId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onFormFieldDragStart(event: DragEvent, section: FormSectionDefinition, field: FormFieldDefinition): void {
    if (!this.builderEditing) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    event.dataTransfer?.setData(this.formFieldDragType, `${section.id}:${field.id}`);
    event.dataTransfer?.setData('text/plain', field.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onPageCarouselDragOver(event: DragEvent): void {
    if (!this.builderEditing || this.getDragData(event, this.formElementDragType) !== 'page') {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onPageCarouselDrop(event: DragEvent): void {
    if (!this.builderEditing || this.getDragData(event, this.formElementDragType) !== 'page') {
      return;
    }

    event.preventDefault();
    this.addPage();
  }

  onFormCanvasDragOver(event: DragEvent): void {
    const formElement = this.getDragData(event, this.formElementDragType) as FormElementType;
    if (
      !this.builderEditing
      || (
        !this.hasDragData(event, this.sectionDragType)
        && !this.hasDragData(event, this.fieldDragType)
        && !this.formElementPalette.some(item => item.type === formElement)
      )
    ) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onFormCanvasDrop(event: DragEvent): void {
    if (!this.builderEditing) {
      return;
    }

    const formElement = this.getDragData(event, this.formElementDragType);
    if (formElement === 'page') {
      event.preventDefault();
      this.addPage();
      return;
    }

    if (formElement === 'container') {
      event.preventDefault();
      this.addContainerToActiveForm(this.getFormContainerDropLayout(event));
      return;
    }

    const fieldType = this.getDragData(event, this.fieldDragType) as FormFieldType;
    if (this.fieldPalette.some(item => item.type === fieldType)) {
      event.preventDefault();
      this.addFieldToActiveForm(fieldType, this.getFormFieldDropLayout(event, fieldType));
      return;
    }

    const sectionId = this.getDragData(event, this.sectionDragType);
    if (!sectionId) {
      return;
    }

    const source = this.sectionLibrary.find(section => section.id === sectionId);
    if (!source) {
      return;
    }

    event.preventDefault();
    this.selectedLibrarySectionId = sectionId;
    this.addSectionFromLibrary(sectionId, this.getFormDropLayout(event, source));
  }

  onContainerDragOver(event: DragEvent): void {
    if (
      !this.builderEditing
      || (
        !this.hasDragData(event, this.fieldDragType)
        && !this.hasDragData(event, this.sectionDragType)
        && !this.hasDragData(event, this.formFieldDragType)
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.hasDragData(event, this.formFieldDragType) ? 'move' : 'copy';
    }
  }

  onContainerDrop(event: DragEvent, section: FormSectionDefinition): void {
    if (!this.builderEditing) {
      return;
    }

    const formFieldPayload = this.getDragData(event, this.formFieldDragType);
    if (formFieldPayload) {
      event.preventDefault();
      event.stopPropagation();
      this.moveFormFieldToContainer(formFieldPayload, section);
      return;
    }

    const fieldType = this.getDragData(event, this.fieldDragType) as FormFieldType;
    if (this.fieldPalette.some(item => item.type === fieldType)) {
      event.preventDefault();
      event.stopPropagation();
      this.addFieldToSection(section, fieldType);
      return;
    }

    const sectionId = this.getDragData(event, this.sectionDragType);
    if (sectionId) {
      event.preventDefault();
      event.stopPropagation();
      this.addSectionFieldsToContainer(section, sectionId);
    }
  }

  getSablonSizeLabel(section: FormSectionDefinition): string {
    const layout = section.layout ?? { col: 1, row: 1, colSpan: 4, rowSpan: 1 };
    return `${layout.colSpan}/12 · ${layout.rowSpan} sor`;
  }

  getSablonPreviewWidth(section: FormSectionDefinition): number {
    return (this.clamp(section.layout?.colSpan ?? 4, 1, 12) / 12) * 100;
  }

  getSablonPreviewHeight(section: FormSectionDefinition): number {
    return 12 + this.clamp(section.layout?.rowSpan ?? 1, 1, 4) * 12;
  }

  duplicateSection(section: FormSectionDefinition): void {
    if (!this.activePage || !this.builderEditing) {
      return;
    }

    const duplicate = this.cloneSectionForInsert(section);
    duplicate.title = `${section.title} másolat`;
    duplicate.layout = {
      ...section.layout,
      row: section.layout.row + section.layout.rowSpan,
      col: section.layout.col
    };
    this.ensureGridContains(duplicate.layout.row + duplicate.layout.rowSpan - 1, duplicate.layout.col + duplicate.layout.colSpan - 1);
    this.activePage.sections = [...this.activePage.sections, duplicate];
    duplicate.fields.forEach(field => {
      const sourceField = section.fields.find(item => item.label === field.label);
      this.fieldValues[field.id] = sourceField ? this.fieldValues[sourceField.id] ?? '' : '';
    });
    this.syncTemplateSections();
  }

  removeSection(sectionId: string): void {
    if (!this.activePage || !this.builderEditing) {
      return;
    }
    const section = this.activePage.sections.find(item => item.id === sectionId);
    this.activePage.sections = this.activePage.sections.filter(item => item.id !== sectionId);
    section?.fields.forEach(field => delete this.fieldValues[field.id]);
    this.customFieldSectionId = this.activeSections[0]?.id ?? '';
    this.syncTemplateSections();
  }

  removeSelectedSection(): void {
    const sectionId = this.selectedSectionSettingsId;
    if (!sectionId) {
      return;
    }
    this.closeSectionSettings();
    this.removeSection(sectionId);
  }

  duplicateSelectedSection(): void {
    const section = this.selectedSectionForSettings;
    if (!section) {
      return;
    }
    this.duplicateSection(section);
    this.closeSectionSettings();
  }

  addContainerToActiveForm(placement: Partial<FormSectionLayout> = {}): void {
    if (!this.activeTemplate || !this.activePage || !this.builderEditing) {
      return;
    }

    const suffix = this.createShortId();
    const colSpan = this.clamp(placement.colSpan ?? 4, 2, this.gridColumns);
    const rowSpan = this.clamp(placement.rowSpan ?? 2, 1, this.gridRows);
    const section: FormSectionDefinition = {
      id: `kontener-${suffix}`,
      title: 'Konténer',
      navCode: 'CONTAINER',
      description: 'Üres űrlap konténer',
      mandatory: false,
      layout: {
        col: this.clamp(placement.col ?? 1, 1, Math.max(1, this.gridColumns - colSpan + 1)),
        row: this.clamp(placement.row ?? this.getNextRow(), 1, 16),
        colSpan,
        rowSpan
      },
      fields: []
    };

    this.ensureGridContains(section.layout.row + section.layout.rowSpan - 1, section.layout.col + section.layout.colSpan - 1);
    this.activePage.sections = [...this.activePage.sections, section];
    this.customFieldSectionId = section.id;
    this.syncTemplateSections();
    this.statusMessage = 'Konténer hozzáadva az űrlaphoz.';
  }

  addCustomField(): void {
    if (!this.activeTemplate || !this.builderEditing) {
      return;
    }

    const label = this.customFieldLabel.trim();
    if (!label) {
      this.statusMessage = 'Mezőnév szükséges.';
      return;
    }

    const section = this.activeSections.find(item => item.id === this.customFieldSectionId)
      ?? this.activeSections[0];
    if (!section) {
      this.statusMessage = 'Előbb adjon hozzá egy blokkot.';
      return;
    }

    const field: FormFieldDefinition = {
      id: `${this.slugify(label)}-${this.createShortId()}`,
      label,
      type: this.customFieldType,
      required: false,
      layout: this.getDefaultFieldLayout(this.customFieldType),
      options: this.customFieldType === 'select' ? this.parseCustomOptions() : undefined
    };

    section.fields = [...section.fields, field];
    this.initializeFieldValue(field);
    this.customFieldLabel = '';
    this.statusMessage = 'Mező hozzáadva.';
    this.syncTemplateSections();
  }

  addFieldToActiveForm(type: FormFieldType, placement: Partial<FormSectionLayout> = {}): void {
    if (!this.activeTemplate || !this.activePage || !this.builderEditing) {
      return;
    }

    const label = this.getDefaultFieldLabel(type);
    const suffix = this.createShortId();
    const fieldLayout = this.getDefaultFieldLayout(type);
    const colSpan = this.clamp(placement.colSpan ?? fieldLayout.colSpan, 2, this.gridColumns);
    const rowSpan = this.clamp(placement.rowSpan ?? (type === 'header' ? 1 : 1), 1, this.gridRows);
    const section: FormSectionDefinition = {
      id: `${this.slugify(label)}-elem-${suffix}`,
      title: label,
      navCode: type === 'header' ? 'CIMSOR' : 'ELEM',
      description: 'Vászon elem',
      mandatory: false,
      layout: {
        col: this.clamp(placement.col ?? 1, 1, Math.max(1, this.gridColumns - colSpan + 1)),
        row: this.clamp(placement.row ?? this.getNextRow(), 1, 16),
        colSpan,
        rowSpan
      },
      fields: [
        {
          id: `${this.slugify(label)}-${suffix}`,
          label,
          type,
          required: false,
          layout: {
            col: 1,
            row: 1,
            colSpan: 12,
            rowSpan: this.getMaxFieldRowSpan(type) > 1 ? Math.min(rowSpan, this.getMaxFieldRowSpan(type)) : 1
          },
          options: type === 'select' ? this.parseOptions(this.microFieldOptions) : undefined
        }
      ]
    };

    this.ensureGridContains(section.layout.row + section.layout.rowSpan - 1, section.layout.col + section.layout.colSpan - 1);
    this.activePage.sections = [...this.activePage.sections, section];
    section.fields.forEach(field => this.initializeFieldValue(field));
    this.customFieldSectionId = section.id;
    this.syncTemplateSections();
    this.statusMessage = 'Elem hozzáadva az űrlaphoz.';
  }

  addFieldToSection(section: FormSectionDefinition, type: FormFieldType): void {
    if (!this.builderEditing) {
      return;
    }

    const label = this.getDefaultFieldLabel(type);
    const suffix = this.createShortId();
    const fieldLayout = this.getDefaultFieldLayout(type);
    const occupied = new Set<string>();
    section.fields.forEach(field => this.markFieldCells(occupied, this.normalizeFieldLayout(field)));
    const slot = this.findAvailableFieldSlot(occupied, fieldLayout.colSpan, fieldLayout.rowSpan);
    const field: FormFieldDefinition = {
      id: `${this.slugify(label)}-${suffix}`,
      label,
      type,
      required: false,
      layout: {
        ...fieldLayout,
        col: slot.col,
        row: slot.row
      },
      options: type === 'select' ? this.parseOptions(this.microFieldOptions) : undefined
    };

    section.fields = [...section.fields, field];
    this.initializeFieldValue(field);
    this.syncTemplateSections();
    this.statusMessage = 'Elem hozzáadva a konténerhez.';
  }

  addSectionFieldsToContainer(target: FormSectionDefinition, sourceSectionId: string): void {
    const source = this.sectionLibrary.find(section => section.id === sourceSectionId);
    if (!source || !this.builderEditing) {
      return;
    }

    const suffix = this.createShortId();
    const fields = source.fields.map(field => {
      const cloned = this.clone(field);
      delete cloned.layout;
      return {
        ...cloned,
        id: `${cloned.id}-${suffix}`
      };
    });

    target.fields = this.normalizeFields([...target.fields, ...fields]);
    fields.forEach(field => this.initializeFieldValue(field));
    this.syncTemplateSections();
    this.statusMessage = 'Sablon elemei hozzáadva a konténerhez.';
  }

  moveFormFieldToContainer(payload: string, target: FormSectionDefinition): void {
    const [sourceSectionId, fieldId] = payload.split(':');
    const source = this.activeSections.find(section => section.id === sourceSectionId);
    if (!source || !fieldId || !this.builderEditing) {
      return;
    }

    const field = source.fields.find(item => item.id === fieldId);
    if (!field) {
      return;
    }

    source.fields = source.fields.filter(item => item.id !== fieldId);
    const moved = this.clone(field);
    if (source.id !== target.id) {
      delete moved.layout;
    }
    target.fields = this.normalizeFields([...target.fields, moved]);
    this.syncTemplateSections();
    this.statusMessage = 'Elem áthelyezve.';
  }

  addMicroField(): void {
    this.addFieldToActiveSectionTemplate();
  }

  addFieldToActiveSectionTemplate(type = this.microFieldType, placement: Partial<FormFieldLayout> = {}): void {
    if (!this.activeSectionTemplate) {
      this.createSectionTemplate();
    }

    const label = this.microFieldLabel.trim();
    const fieldLabel = label || this.getDefaultFieldLabel(type);

    const field: FormFieldDefinition = {
      id: `${this.slugify(fieldLabel)}-${this.createShortId()}`,
      label: fieldLabel,
      type,
      required: type === 'header' ? false : this.microFieldRequired,
      layout: {
        ...this.getDefaultFieldLayout(type),
        ...placement
      },
      options: type === 'select' ? this.parseOptions(this.microFieldOptions) : undefined
    };

    if (!this.activeSectionTemplate) {
      return;
    }

    this.activeSectionTemplate.fields = [...this.activeSectionTemplate.fields, field];
    this.settleTemplateField(field.id);
    this.selectedTemplateFieldId = field.id;
    this.selectedTemplateFieldIds = [field.id];
    this.selectionTemplateName = '';
    this.fieldSettingsOpen = false;
    this.fieldOptionDrafts[field.id] = field.options?.map(option => option.label).join('\n') ?? '';
    this.upsertActiveSectionTemplate();
    this.microFieldLabel = '';
    this.microFieldRequired = false;
    this.statusMessage = 'Mező hozzáadva a sablonhoz.';
  }

  removeMicroField(fieldId: string): void {
    this.removeTemplateField(fieldId);
  }

  async createMicroTemplate(): Promise<void> {
    await this.saveSectionTemplate();
  }

  async saveSectionTemplate(): Promise<void> {
    if (!this.activeSectionTemplate) {
      return;
    }

    const title = this.activeSectionTemplate.title.trim();
    if (!title) {
      this.statusMessage = 'Sablonnév szükséges.';
      return;
    }

    if (!this.activeSectionTemplate.fields.length) {
      this.activeSectionTemplate.fields = [
        {
          id: `mezo-${this.createShortId()}`,
          label: 'Mező',
          type: 'text',
          required: false,
          layout: this.getDefaultFieldLayout('text')
        }
      ];
    }

    const section = this.normalizeSectionTemplate({
      ...this.activeSectionTemplate,
      title,
      navCode: this.activeSectionTemplate.navCode?.trim() || 'CUSTOM'
    });

    this.saving = true;
    try {
      await this.store.saveSectionTemplate(section);
      const savedSections = (await this.store.getSectionTemplates()).map(item => this.normalizeSectionTemplate(item));
      this.sectionLibrary = savedSections;
      this.selectSectionTemplate(section.id);
      this.selectedLibrarySectionId = section.id;
      this.statusMessage = 'Sablon mentve.';
    } catch (error) {
      this.statusMessage = 'A sablon mentése sikertelen.';
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  createLegacyMicroTemplate(): void {
    const title = this.microBlockName.trim();
    if (!title) {
      this.statusMessage = 'Blokknév szükséges.';
      return;
    }

    const fallbackField: FormFieldDefinition = {
      id: `mezo-${this.createShortId()}`,
      label: 'Mező',
      type: 'text',
      required: false,
      layout: this.getDefaultFieldLayout('text')
    };
    const section: FormSectionDefinition = {
      id: `${this.slugify(title)}-${this.createShortId()}`,
      title,
      navCode: this.microBlockCode.trim() || 'CUSTOM',
      mandatory: this.microBlockMandatory,
      layout: { col: 1, row: 1, colSpan: 4, rowSpan: 2 },
      fields: this.microBlockFields.length ? this.clone(this.microBlockFields) : [fallbackField]
    };

    this.sectionLibrary = [section, ...this.sectionLibrary];
    this.selectedSectionId = section.id;
    this.microBlockName = 'Új blokk';
    this.microBlockCode = 'CUSTOM';
    this.microBlockMandatory = false;
    this.microBlockFields = [];
    this.statusMessage = 'Blokksablon létrehozva.';
  }

  removeTemplateField(fieldId: string): void {
    if (!this.activeSectionTemplate) {
      return;
    }

    this.activeSectionTemplate.fields = this.activeSectionTemplate.fields.filter(field => field.id !== fieldId);
    this.selectedTemplateFieldIds = this.selectedTemplateFieldIds.filter(id => id !== fieldId);
    if (this.selectedTemplateFieldId === fieldId || !this.selectedTemplateFieldIds.length) {
      this.selectedTemplateFieldId = this.selectedTemplateFieldIds.at(-1) ?? null;
      this.fieldSettingsOpen = false;
    }
    delete this.fieldOptionDrafts[fieldId];
    this.upsertActiveSectionTemplate();
  }

  selectTemplateField(field: FormFieldDefinition, event?: Event): void {
    event?.stopPropagation();
    const mouseEvent = event as MouseEvent | undefined;
    if (mouseEvent?.ctrlKey || mouseEvent?.metaKey) {
      this.fieldSettingsOpen = false;
      this.selectedTemplateFieldIds = this.selectedTemplateFieldIds.includes(field.id)
        ? this.selectedTemplateFieldIds.filter(id => id !== field.id)
        : [...this.selectedTemplateFieldIds, field.id];
      this.selectedTemplateFieldId = this.selectedTemplateFieldIds.at(-1) ?? null;
      if (this.hasMultiTemplateSelection && !this.selectionTemplateName.trim()) {
        this.selectionTemplateName = `${this.activeSectionTemplate?.title || 'Sablon'} részlet`;
      }
      return;
    }

    this.selectedTemplateFieldId = field.id;
    this.selectedTemplateFieldIds = [field.id];
  }

  openTemplateFieldSettings(field: FormFieldDefinition, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.selectedTemplateFieldId = field.id;
    this.selectedTemplateFieldIds = [field.id];
    this.fieldSettingsOpen = true;
  }

  closeTemplateFieldSettings(): void {
    this.fieldSettingsOpen = false;
  }

  isTemplateFieldSelected(field: FormFieldDefinition): boolean {
    return this.selectedTemplateFieldIds.includes(field.id);
  }

  clearTemplateFieldSelection(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.selectedTemplateFieldId = null;
    this.selectedTemplateFieldIds = [];
    this.selectionTemplateName = '';
    this.fieldSettingsOpen = false;
  }

  async saveSelectedFieldsAsSablon(event?: Event): Promise<void> {
    event?.preventDefault();
    event?.stopPropagation();
    const selectedFields = this.selectedTemplateFields;
    if (!selectedFields.length) {
      return;
    }

    const title = this.selectionTemplateName.trim() || 'Új sablon';
    const suffix = this.createShortId();
    const fieldsWithLayout = selectedFields.map(field => ({
      field,
      layout: this.normalizeFieldLayout(field)
    }));
    const minCol = Math.min(...fieldsWithLayout.map(item => item.layout.col ?? 1));
    const minRow = Math.min(...fieldsWithLayout.map(item => item.layout.row ?? 1));
    const maxCol = Math.max(...fieldsWithLayout.map(item => (item.layout.col ?? 1) + item.layout.colSpan - 1));
    const maxRow = Math.max(...fieldsWithLayout.map(item => (item.layout.row ?? 1) + item.layout.rowSpan - 1));

    const section = this.normalizeSectionTemplate({
      id: `${this.slugify(title)}-${suffix}`,
      title,
      navCode: this.slugify(title).toUpperCase().slice(0, 16) || 'CUSTOM',
      description: 'Kijelölt mezőkből mentett sablon',
      mandatory: false,
      layout: {
        col: 1,
        row: 1,
        colSpan: this.clamp(maxCol - minCol + 1, 2, 12),
        rowSpan: this.clamp(maxRow - minRow + 1, 1, 16)
      },
      fields: fieldsWithLayout.map(({ field, layout }) => ({
        ...this.clone(field),
        id: `${field.id}-${suffix}`,
        layout: {
          col: (layout.col ?? 1) - minCol + 1,
          row: (layout.row ?? 1) - minRow + 1,
          colSpan: layout.colSpan,
          rowSpan: layout.rowSpan
        }
      }))
    });

    this.saving = true;
    try {
      await this.store.saveSectionTemplate(section);
      this.sectionLibrary = (await this.store.getSectionTemplates()).map(item => this.normalizeSectionTemplate(item));
      this.selectedLibrarySectionId = section.id;
      this.clearTemplateFieldSelection();
      this.statusMessage = 'Kijelölt mezőkből sablon mentve.';
    } catch (error) {
      this.statusMessage = 'A kijelölt mezők sablonként mentése sikertelen.';
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  async deleteSectionTemplate(sectionId: string, event?: Event): Promise<void> {
    event?.preventDefault();
    event?.stopPropagation();
    if (!this.sectionLibrary.some(section => section.id === sectionId)) {
      return;
    }

    this.saving = true;
    try {
      await this.store.deleteSectionTemplate(sectionId);
      this.sectionLibrary = (await this.store.getSectionTemplates()).map(item => this.normalizeSectionTemplate(item));
      if (this.selectedLibrarySectionId === sectionId) {
        this.selectedLibrarySectionId = this.sectionLibrary[0]?.id ?? '';
      }
      if (this.selectedSectionId === sectionId) {
        const nextSection = this.sectionLibrary[0];
        if (nextSection) {
          this.selectSectionTemplate(nextSection.id, this.panelMode === 'template');
        } else {
          this.activeSectionTemplate = null;
          this.selectedSectionId = '';
          this.clearTemplateFieldSelection();
        }
      }
      this.statusMessage = 'Sablon törölve.';
    } catch (error) {
      this.statusMessage = 'A sablon törlése sikertelen.';
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  moveTemplateField(fieldId: string, direction: -1 | 1): void {
    if (!this.activeSectionTemplate) {
      return;
    }

    const index = this.activeSectionTemplate.fields.findIndex(field => field.id === fieldId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= this.activeSectionTemplate.fields.length) {
      return;
    }

    const fields = [...this.activeSectionTemplate.fields];
    const [field] = fields.splice(index, 1);
    fields.splice(nextIndex, 0, field);
    this.activeSectionTemplate.fields = fields;
    this.upsertActiveSectionTemplate();
  }

  updateTemplateFieldType(field: FormFieldDefinition): void {
    const currentLayout = this.normalizeFieldLayout(field);
    field.layout = {
      ...this.getDefaultFieldLayout(field.type),
      col: currentLayout.col,
      row: currentLayout.row
    };
    if (field.type === 'header') {
      field.required = false;
      field.options = undefined;
      delete this.fieldOptionDrafts[field.id];
    } else if (field.type === 'select') {
      field.options = field.options?.length ? field.options : this.parseOptions(this.microFieldOptions);
      this.fieldOptionDrafts[field.id] = field.options.map(option => option.label).join('\n');
    } else {
      field.options = undefined;
      delete this.fieldOptionDrafts[field.id];
    }
    this.settleTemplateField(field.id);
    this.upsertActiveSectionTemplate();
  }

  getFieldOptionsText(field: FormFieldDefinition): string {
    return this.fieldOptionDrafts[field.id] ?? field.options?.map(option => option.label).join('\n') ?? '';
  }

  setFieldOptions(field: FormFieldDefinition, value: string): void {
    this.fieldOptionDrafts[field.id] = value;
    field.options = this.parseOptions(value);
    this.upsertActiveSectionTemplate();
  }

  getFieldGridColumn(field: FormFieldDefinition): string {
    const layout = this.normalizeFieldLayout(field);
    return layout.col ? `${layout.col} / span ${layout.colSpan}` : `span ${layout.colSpan}`;
  }

  getFieldGridRow(field: FormFieldDefinition): string {
    const layout = this.normalizeFieldLayout(field);
    return layout.row ? `${layout.row} / span ${layout.rowSpan}` : `span ${layout.rowSpan}`;
  }

  resizeTemplateField(field: FormFieldDefinition, colDelta: number, rowDelta = 0): void {
    const layout = this.normalizeFieldLayout(field);
    const maxRowSpan = this.getMaxFieldRowSpan(field.type);
    field.layout = {
      col: layout.col,
      row: layout.row,
      colSpan: this.clamp(layout.colSpan + colDelta, 2, Math.max(2, 12 - (layout.col ?? 1) + 1)),
      rowSpan: this.clamp(layout.rowSpan + rowDelta, 1, maxRowSpan)
    };
    this.settleTemplateField(field.id);
    this.upsertActiveSectionTemplate();
  }

  startTemplateFieldDrag(event: PointerEvent, field: FormFieldDefinition): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.template-field-grip') || target.closest('.field-resize-handle')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const surface = target.closest('.template-builder-surface') as HTMLElement | null;
    const surfaceRect = surface?.getBoundingClientRect();
    const layout = this.normalizeFieldLayout(field);
    this.resizeState = null;
    this.dragState = null;
    this.fieldResizeState = null;
    this.fieldDragState = {
      fieldId: field.id,
      startX: event.clientX,
      startY: event.clientY,
      startCol: layout.col ?? 1,
      startRow: layout.row ?? 1,
      columnWidth: (surfaceRect?.width ?? 960) / 12,
      rowHeight: 40
    };
  }

  startTemplateFieldResize(event: PointerEvent, field: FormFieldDefinition, direction: ResizeDirection): void {
    event.preventDefault();
    event.stopPropagation();

    const surface = (event.currentTarget as HTMLElement).closest('.template-builder-surface') as HTMLElement | null;
    const surfaceWidth = surface?.getBoundingClientRect().width ?? 960;
    const layout = this.normalizeFieldLayout(field);
    this.resizeState = null;
    this.dragState = null;
    this.fieldDragState = null;
    this.selectedTemplateFieldId = field.id;
    this.selectedTemplateFieldIds = [field.id];
    this.fieldResizeState = {
      fieldId: field.id,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startCol: layout.col ?? 1,
      startRow: layout.row ?? 1,
      startColSpan: layout.colSpan,
      startRowSpan: layout.rowSpan,
      columnWidth: surfaceWidth / 12,
      rowHeight: 40
    };
  }

  onPaletteDragStart(event: DragEvent, type: FormFieldType): void {
    if (this.panelMode === 'form' && !this.builderEditing) {
      event.preventDefault();
      return;
    }

    event.dataTransfer?.setData(this.fieldDragType, type);
    event.dataTransfer?.setData('text/plain', type);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onTemplateSurfaceDragOver(event: DragEvent): void {
    const hasField = this.hasDragData(event, this.fieldDragType);
    const hasSection = this.hasDragData(event, this.sectionDragType);
    if (!hasField && !hasSection) {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onTemplateSurfaceDrop(event: DragEvent): void {
    event.preventDefault();
    const sectionId = this.getDragData(event, this.sectionDragType);
    if (sectionId) {
      const source = this.sectionLibrary.find(section => section.id === sectionId);
      if (source) {
        this.addSectionFieldsToActiveSectionTemplate(sectionId, this.getTemplateSectionDropLayout(event, source));
      }
      return;
    }

    const type = (event.dataTransfer?.getData(this.fieldDragType) || event.dataTransfer?.getData('text/plain')) as FormFieldType;
    if (!this.fieldPalette.some(item => item.type === type)) {
      return;
    }
    this.addFieldToActiveSectionTemplate(type, this.getTemplateDropLayout(event, type));
  }

  private getTemplateDropLayout(event: DragEvent, type: FormFieldType): Partial<FormFieldLayout> {
    const surface = ((event.currentTarget as HTMLElement).closest('.template-builder-surface') as HTMLElement | null)
      ?? (event.currentTarget as HTMLElement);
    const rect = surface.getBoundingClientRect();
    const fallback = this.getDefaultFieldLayout(type);
    const colSpan = fallback.colSpan;
    const columnWidth = rect.width / 12;
    const x = this.clamp(event.clientX - rect.left, 0, rect.width);
    const y = Math.max(0, event.clientY - rect.top + surface.scrollTop);
    return {
      ...fallback,
      col: this.clamp(Math.floor(x / columnWidth) + 1, 1, Math.max(1, 12 - colSpan + 1)),
      row: this.clamp(Math.floor(y / 40) + 1, 1, 40)
    };
  }

  private getTemplateSectionDropLayout(event: DragEvent, section: FormSectionDefinition): Partial<FormFieldLayout> {
    const surface = ((event.currentTarget as HTMLElement).closest('.template-builder-surface') as HTMLElement | null)
      ?? (event.currentTarget as HTMLElement);
    const rect = surface.getBoundingClientRect();
    const width = this.clamp(section.layout?.colSpan ?? 6, 2, 12);
    const columnWidth = rect.width / 12;
    const x = this.clamp(event.clientX - rect.left, 0, rect.width);
    const y = Math.max(0, event.clientY - rect.top + surface.scrollTop);
    return {
      col: this.clamp(Math.floor(x / columnWidth) + 1, 1, Math.max(1, 12 - width + 1)),
      row: this.clamp(Math.floor(y / 40) + 1, 1, 40)
    };
  }

  private addSectionFieldsToActiveSectionTemplate(sectionId: string, placement: Partial<FormFieldLayout> = {}): void {
    const source = this.sectionLibrary.find(section => section.id === sectionId);
    if (!source || !this.activeSectionTemplate) {
      return;
    }

    const suffix = this.createShortId();
    const fieldsWithLayout = this.normalizeFields(source.fields).map(field => ({
      field,
      layout: this.normalizeFieldLayout(field)
    }));
    if (!fieldsWithLayout.length) {
      return;
    }

    const minCol = Math.min(...fieldsWithLayout.map(item => item.layout.col ?? 1));
    const minRow = Math.min(...fieldsWithLayout.map(item => item.layout.row ?? 1));
    const maxCol = Math.max(...fieldsWithLayout.map(item => (item.layout.col ?? 1) + item.layout.colSpan - 1));
    const groupWidth = this.clamp(maxCol - minCol + 1, 2, 12);
    const baseCol = this.clamp(placement.col ?? 1, 1, Math.max(1, 12 - groupWidth + 1));
    const baseRow = this.clamp(placement.row ?? 1, 1, 40);

    const newFields = fieldsWithLayout.map(({ field, layout }) => ({
      ...this.clone(field),
      id: `${field.id}-${suffix}`,
      layout: {
        col: baseCol + (layout.col ?? 1) - minCol,
        row: baseRow + (layout.row ?? 1) - minRow,
        colSpan: layout.colSpan,
        rowSpan: layout.rowSpan
      }
    }));

    this.activeSectionTemplate.fields = [...this.activeSectionTemplate.fields, ...newFields];
    this.selectedTemplateFieldIds = newFields.map(field => field.id);
    this.selectedTemplateFieldId = this.selectedTemplateFieldIds.at(-1) ?? null;
    if (newFields.length > 1 && !this.selectionTemplateName.trim()) {
      this.selectionTemplateName = source.title;
    }
    newFields.forEach(field => {
      this.fieldOptionDrafts[field.id] = field.options?.map(option => option.label).join('\n') ?? '';
    });
    this.upsertActiveSectionTemplate();
    this.statusMessage = 'Sablon elemei hozzáadva a vászonhoz.';
  }

  removeField(section: FormSectionDefinition, fieldId: string): void {
    if (!this.builderEditing) {
      return;
    }
    section.fields = section.fields.filter(field => field.id !== fieldId);
    delete this.fieldValues[fieldId];
    this.syncTemplateSections();
  }

  removeSelectedFormField(): void {
    const context = this.selectedFormFieldContext;
    const section = this.selectedFormFieldSection;
    if (!context || !section) {
      return;
    }
    this.removeField(section, context.fieldId);
    this.closeFormFieldSettings();
  }

  updateFormFieldType(field: FormFieldDefinition): void {
    const currentLayout = this.normalizeFieldLayout(field);
    field.layout = {
      ...this.getDefaultFieldLayout(field.type),
      col: currentLayout.col,
      row: currentLayout.row
    };
    if (field.type === 'header') {
      field.required = false;
      field.options = undefined;
      delete this.fieldOptionDrafts[field.id];
    } else if (field.type === 'select') {
      field.options = field.options?.length ? field.options : this.parseOptions(this.microFieldOptions);
      this.fieldOptionDrafts[field.id] = field.options.map(option => option.label).join('\n');
    } else {
      field.options = undefined;
      delete this.fieldOptionDrafts[field.id];
    }
    this.initializeFieldValue(field);
    this.syncTemplateSections();
  }

  setFormFieldOptions(field: FormFieldDefinition, value: string): void {
    this.fieldOptionDrafts[field.id] = value;
    field.options = this.parseOptions(value);
    this.syncTemplateSections();
  }

  resizeFormField(field: FormFieldDefinition, colDelta: number, rowDelta = 0): void {
    const layout = this.normalizeFieldLayout(field);
    const maxRowSpan = this.getMaxFieldRowSpan(field.type);
    field.layout = {
      col: layout.col,
      row: layout.row,
      colSpan: this.clamp(layout.colSpan + colDelta, 2, Math.max(2, 12 - (layout.col ?? 1) + 1)),
      rowSpan: this.clamp(layout.rowSpan + rowDelta, 1, maxRowSpan)
    };
    this.syncTemplateSections();
  }

  addGridColumn(): void {
    if (!this.activeTemplate || !this.builderEditing) {
      return;
    }
    this.activeTemplate.grid.columns = this.clamp(this.gridColumns + 1, 4, 16);
  }

  removeGridColumn(): void {
    if (!this.activeTemplate || !this.builderEditing) {
      return;
    }
    const nextColumns = this.clamp(this.gridColumns - 1, 4, 16);
    this.activeTemplate.grid.columns = nextColumns;
    this.activeTemplate.pages.flatMap(page => page.sections).forEach(section => {
      section.layout.col = this.clamp(section.layout.col, 1, Math.max(1, nextColumns - section.layout.colSpan + 1));
      section.layout.colSpan = this.clamp(section.layout.colSpan, 2, nextColumns - section.layout.col + 1);
    });
  }

  addGridRow(): void {
    if (!this.activeTemplate || !this.builderEditing) {
      return;
    }
    this.activeTemplate.grid.rows = this.clamp(this.gridRows + 1, 3, 16);
  }

  removeGridRow(): void {
    if (!this.activeTemplate || !this.builderEditing) {
      return;
    }
    const nextRows = this.clamp(this.gridRows - 1, 3, 16);
    this.activeTemplate.grid.rows = nextRows;
    this.activeTemplate.pages.flatMap(page => page.sections).forEach(section => {
      section.layout.row = this.clamp(section.layout.row, 1, Math.max(1, nextRows - section.layout.rowSpan + 1));
      section.layout.rowSpan = this.clamp(section.layout.rowSpan, 1, nextRows - section.layout.row + 1);
    });
  }

  autofillUserData(): void {
    if (!this.activeTemplate) {
      return;
    }

    this.activeTemplate.pages
      .flatMap(page => page.sections)
      .flatMap(section => section.fields)
      .forEach(field => {
        if (!field.autofillKey) {
          return;
        }
        this.fieldValues[field.id] = this.currentUser[field.autofillKey];
      });
    this.statusMessage = 'A bejelentkezett felhasználó adatai kitöltve.';
  }

  async saveTemplate(): Promise<void> {
    if (!this.activeTemplate) {
      return;
    }

    this.saving = true;
    this.statusMessage = '';
    try {
      this.syncTemplateSections();
      const template = {
        ...this.activeTemplate,
        updatedAt: new Date().toISOString()
      };
      await this.store.saveTemplate(template);
      this.activeTemplate = this.normalizeTemplate(template);
      this.templates = this.templates
        .map(item => (item.id === template.id ? this.clone(this.activeTemplate as FormTemplate) : item))
        .sort((a, b) => a.name.localeCompare(b.name, 'hu'));
      this.builderEditing = false;
      this.statusMessage = 'Űrlapszerkezet mentve.';
    } catch (error) {
      this.statusMessage = 'Az űrlapszerkezet mentése sikertelen.';
      console.error(error);
    } finally {
      this.saving = false;
    }
  }

  startDrag(event: PointerEvent, section: FormSectionDefinition): void {
    if (this.viewport === 'mobile' || !this.builderEditing) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!target.closest('.container-grip')) {
      return;
    }

    event.preventDefault();
    const canvas = this.formCanvas?.nativeElement;
    const canvasWidth = canvas?.getBoundingClientRect().width ?? 960;
    this.resizeState = null;
    this.dragState = {
      sectionId: section.id,
      startX: event.clientX,
      startY: event.clientY,
      startCol: section.layout.col,
      startRow: section.layout.row,
      columnWidth: canvasWidth / this.gridColumns,
      rowHeight: 132
    };
  }

  startResize(event: PointerEvent, section: FormSectionDefinition, direction: ResizeDirection): void {
    if (this.viewport === 'mobile' || !this.builderEditing) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const canvas = this.formCanvas?.nativeElement;
    const canvasWidth = canvas?.getBoundingClientRect().width ?? 960;
    this.dragState = null;
    this.resizeState = {
      sectionId: section.id,
      direction,
      startX: event.clientX,
      startY: event.clientY,
      startColSpan: section.layout.colSpan,
      startRowSpan: section.layout.rowSpan,
      columnWidth: canvasWidth / this.gridColumns,
      rowHeight: 132
    };
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (this.fieldDragState || this.fieldResizeState || this.resizeState || this.dragState) {
      return;
    }
    if (this.panelMode !== 'template' || !this.selectedTemplateFieldIds.length) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      this.clearTemplateFieldSelection();
      return;
    }
    if (target.closest('.template-field-element, .field-settings-panel, .selection-template-overlay')) {
      return;
    }

    this.clearTemplateFieldSelection();
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.fieldDragState && this.activeSectionTemplate) {
      const field = this.activeSectionTemplate.fields.find(item => item.id === this.fieldDragState?.fieldId);
      if (!field) {
        return;
      }

      const layout = this.normalizeFieldLayout(field);
      const colDelta = Math.round((event.clientX - this.fieldDragState.startX) / this.fieldDragState.columnWidth);
      const rowDelta = Math.round((event.clientY - this.fieldDragState.startY) / this.fieldDragState.rowHeight);
      field.layout = {
        ...layout,
        col: this.clamp(this.fieldDragState.startCol + colDelta, 1, Math.max(1, 12 - layout.colSpan + 1)),
        row: this.clamp(this.fieldDragState.startRow + rowDelta, 1, 40)
      };
      return;
    }

    if (this.fieldResizeState && this.activeSectionTemplate) {
      const field = this.activeSectionTemplate.fields.find(item => item.id === this.fieldResizeState?.fieldId);
      if (!field) {
        return;
      }

      const direction = this.fieldResizeState.direction;
      const rawColDelta = Math.round((event.clientX - this.fieldResizeState.startX) / this.fieldResizeState.columnWidth);
      const rawRowDelta = Math.round((event.clientY - this.fieldResizeState.startY) / this.fieldResizeState.rowHeight);
      const maxRowSpan = this.getMaxFieldRowSpan(field.type);
      let col = this.fieldResizeState.startCol;
      let row = this.fieldResizeState.startRow;
      let colSpan = this.fieldResizeState.startColSpan;
      let rowSpan = this.fieldResizeState.startRowSpan;

      if (direction.includes('e')) {
        colSpan = this.clamp(
          this.fieldResizeState.startColSpan + rawColDelta,
          2,
          Math.max(2, 12 - this.fieldResizeState.startCol + 1)
        );
      }
      if (direction.includes('w')) {
        const maxCol = this.fieldResizeState.startCol + this.fieldResizeState.startColSpan - 2;
        col = this.clamp(this.fieldResizeState.startCol + rawColDelta, 1, Math.max(1, maxCol));
        colSpan = this.fieldResizeState.startCol + this.fieldResizeState.startColSpan - col;
      }
      if (direction.includes('s')) {
        rowSpan = this.clamp(this.fieldResizeState.startRowSpan + rawRowDelta, 1, maxRowSpan);
      }
      if (direction.includes('n')) {
        const maxRow = this.fieldResizeState.startRow + this.fieldResizeState.startRowSpan - 1;
        row = this.clamp(this.fieldResizeState.startRow + rawRowDelta, 1, Math.max(1, maxRow));
        rowSpan = this.clamp(this.fieldResizeState.startRow + this.fieldResizeState.startRowSpan - row, 1, maxRowSpan);
      }

      field.layout = {
        col,
        row,
        colSpan,
        rowSpan
      };
      return;
    }

    if (this.dragState && this.activeTemplate) {
      const section = this.activeSections.find(item => item.id === this.dragState?.sectionId);
      if (!section) {
        return;
      }
      const colDelta = Math.round((event.clientX - this.dragState.startX) / this.dragState.columnWidth);
      const rowDelta = Math.round((event.clientY - this.dragState.startY) / this.dragState.rowHeight);
      section.layout.col = this.clamp(
        this.dragState.startCol + colDelta,
        1,
        Math.max(1, this.gridColumns - section.layout.colSpan + 1)
      );
      section.layout.row = this.clamp(
        this.dragState.startRow + rowDelta,
        1,
        Math.max(1, this.gridRows - section.layout.rowSpan + 1)
      );
      this.syncTemplateSections();
      return;
    }

    if (!this.resizeState || !this.activeTemplate) {
      return;
    }

    const section = this.activeSections.find(item => item.id === this.resizeState?.sectionId);
    if (!section || !this.resizeState) {
      return;
    }

    const colDelta = this.resizeState.direction.includes('e')
      ? Math.round((event.clientX - this.resizeState.startX) / this.resizeState.columnWidth)
      : 0;
    const rowDelta = this.resizeState.direction.includes('s')
      ? Math.round((event.clientY - this.resizeState.startY) / this.resizeState.rowHeight)
      : 0;

    section.layout.colSpan = this.clamp(
      this.resizeState.startColSpan + colDelta,
      3,
      this.gridColumns - section.layout.col + 1
    );
    section.layout.rowSpan = this.clamp(
      this.resizeState.startRowSpan + rowDelta,
      1,
      this.gridRows - section.layout.row + 1
    );
    this.syncTemplateSections();
  }

  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  stopPointerAction(): void {
    if (this.fieldDragState) {
      this.settleTemplateField(this.fieldDragState.fieldId);
      this.upsertActiveSectionTemplate();
    }
    if (this.fieldResizeState) {
      this.settleTemplateField(this.fieldResizeState.fieldId);
      this.upsertActiveSectionTemplate();
    }
    this.fieldDragState = null;
    this.fieldResizeState = null;
    this.resizeState = null;
    this.dragState = null;
  }

  getGridColumn(section: FormSectionDefinition): string {
    return `${section.layout.col} / span ${section.layout.colSpan}`;
  }

  getGridRow(section: FormSectionDefinition): string {
    return `${section.layout.row} / span ${section.layout.rowSpan}`;
  }

  getSectionColumnText(section: FormSectionDefinition): string {
    return `${section.layout.col}-${section.layout.col + section.layout.colSpan - 1}`;
  }

  getSectionRowText(section: FormSectionDefinition): string {
    return `${section.layout.row}-${section.layout.row + section.layout.rowSpan - 1}`;
  }

  getInputType(field: FormFieldDefinition): string {
    if (field.type === 'email' || field.type === 'tel' || field.type === 'number' || field.type === 'date') {
      return field.type;
    }
    return 'text';
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}. ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private normalizeTemplate(template: FormTemplate): FormTemplate {
    const normalized = this.clone(template);
    normalized.grid = normalized.grid ?? { columns: 12, rows: 6 };
    normalized.mandatory = normalized.mandatory ?? false;
    if (!normalized.pages?.length) {
      normalized.pages = [
        {
          id: 'page-main',
          title: 'Oldal 1',
          mandatory: true,
          sections: normalized.sections ?? []
        }
      ];
    }
    normalized.pages.forEach(page => {
      page.mandatory = page.mandatory ?? false;
      page.sections.forEach(section => {
        section.mandatory = section.mandatory ?? false;
        section.fields = this.normalizeFields(section.fields);
      });
    });
    normalized.sections = normalized.pages.flatMap(page => page.sections);
    return normalized;
  }

  private normalizeSectionTemplate(section: FormSectionDefinition): FormSectionDefinition {
    const normalized = this.clone(section);
    normalized.navCode = normalized.navCode || 'CUSTOM';
    normalized.description = normalized.description || '';
    normalized.mandatory = normalized.mandatory ?? false;
    normalized.layout = normalized.layout ?? { col: 1, row: 1, colSpan: 4, rowSpan: 2 };
    normalized.fields = this.normalizeFields(normalized.fields ?? []);
    return normalized;
  }

  private normalizeFields(fields: FormFieldDefinition[]): FormFieldDefinition[] {
    const occupied = new Set<string>();
    return fields.map(field => {
      const normalized = this.clone(field);
      normalized.required = normalized.required ?? false;
      normalized.options = normalized.type === 'select' ? normalized.options ?? [] : undefined;
      normalized.layout = this.normalizeFieldLayout(normalized);
      if (!field.layout?.col || !field.layout?.row) {
        const slot = this.findAvailableFieldSlot(occupied, normalized.layout.colSpan, normalized.layout.rowSpan);
        normalized.layout = {
          ...normalized.layout,
          col: slot.col,
          row: slot.row
        };
      }
      this.markFieldCells(occupied, normalized.layout);
      return normalized;
    });
  }

  private normalizeFieldLayout(field: FormFieldDefinition): FormFieldLayout {
    const fallback = this.getDefaultFieldLayout(field.type);
    const colSpan = this.clamp(field.layout?.colSpan ?? fallback.colSpan, 2, 12);
    const maxRowSpan = this.getMaxFieldRowSpan(field.type);
    return {
      col: field.layout?.col ? this.clamp(field.layout.col, 1, Math.max(1, 12 - colSpan + 1)) : undefined,
      row: field.layout?.row ? this.clamp(field.layout.row, 1, 40) : undefined,
      colSpan,
      rowSpan: this.clamp(field.layout?.rowSpan ?? fallback.rowSpan, 1, maxRowSpan)
    };
  }

  private findAvailableFieldSlot(occupied: Set<string>, colSpan: number, rowSpan: number): { col: number; row: number } {
    for (let row = 1; row <= 40; row += 1) {
      for (let col = 1; col <= 12 - colSpan + 1; col += 1) {
        const layout = { col, row, colSpan, rowSpan };
        if (!this.fieldCellsOccupied(occupied, layout)) {
          return { col, row };
        }
      }
    }
    return { col: 1, row: 1 };
  }

  private fieldCellsOccupied(occupied: Set<string>, layout: Required<FormFieldLayout>): boolean {
    for (let row = layout.row; row < layout.row + layout.rowSpan; row += 1) {
      for (let col = layout.col; col < layout.col + layout.colSpan; col += 1) {
        if (occupied.has(`${row}:${col}`)) {
          return true;
        }
      }
    }
    return false;
  }

  private markFieldCells(occupied: Set<string>, layout: FormFieldLayout): void {
    if (!layout.col || !layout.row) {
      return;
    }
    for (let row = layout.row; row < layout.row + layout.rowSpan; row += 1) {
      for (let col = layout.col; col < layout.col + layout.colSpan; col += 1) {
        occupied.add(`${row}:${col}`);
      }
    }
  }

  private settleTemplateField(fieldId: string): void {
    if (!this.activeSectionTemplate) {
      return;
    }
    const field = this.activeSectionTemplate.fields.find(item => item.id === fieldId);
    if (!field) {
      return;
    }

    const occupied = new Set<string>();
    for (const item of this.activeSectionTemplate.fields) {
      if (item.id === fieldId) {
        continue;
      }
      const layout = this.normalizeFieldLayout(item);
      if (layout.col && layout.row) {
        this.markFieldCells(occupied, layout);
      }
    }

    const layout = this.normalizeFieldLayout(field);
    const nextLayout: Required<FormFieldLayout> = {
      col: layout.col ?? 1,
      row: layout.row ?? 1,
      colSpan: layout.colSpan,
      rowSpan: layout.rowSpan
    };
    let guard = 0;
    while (this.fieldCellsOccupied(occupied, nextLayout) && guard < 40) {
      nextLayout.row += 1;
      guard += 1;
    }
    field.layout = nextLayout;
  }

  private refreshFieldOptionDrafts(): void {
    this.fieldOptionDrafts = {};
    this.activeSectionTemplate?.fields.forEach(field => {
      if (field.type === 'select') {
        this.fieldOptionDrafts[field.id] = field.options?.map(option => option.label).join('\n') ?? '';
      }
    });
  }

  private upsertActiveSectionTemplate(): void {
    if (!this.activeSectionTemplate) {
      return;
    }

    const section = this.normalizeSectionTemplate(this.activeSectionTemplate);
    this.activeSectionTemplate = section;
    this.sectionLibrary = [
      section,
      ...this.sectionLibrary.filter(item => item.id !== section.id)
    ].sort((a, b) => a.title.localeCompare(b.title, 'hu'));
    this.selectedSectionId = section.id;
  }

  private syncTemplateSections(): void {
    if (!this.activeTemplate) {
      return;
    }
    this.activeTemplate.sections = this.activeTemplate.pages.flatMap(page => page.sections);
  }

  private initializeFieldValues(): void {
    this.activeTemplate?.pages
      .flatMap(page => page.sections)
      .flatMap(section => section.fields)
      .forEach(field => this.initializeFieldValue(field));
  }

  private initializeFieldValue(field: FormFieldDefinition): void {
    if (field.id in this.fieldValues) {
      return;
    }
    this.fieldValues[field.id] = field.type === 'checkbox' ? false : '';
  }

  private addSectionFromLibrary(sectionId: string, placement: Partial<FormSectionLayout> = {}): void {
    const source = this.sectionLibrary.find(section => section.id === sectionId);
    if (!source || !this.activeTemplate || !this.activePage || !this.builderEditing) {
      return;
    }

    const section = this.cloneSectionForInsert(source);
    const colSpan = this.clamp(section.layout.colSpan, 2, this.gridColumns);
    const rowSpan = this.clamp(section.layout.rowSpan, 1, this.gridRows);
    section.layout = {
      col: this.clamp(placement.col ?? 1, 1, Math.max(1, this.gridColumns - colSpan + 1)),
      row: this.clamp(placement.row ?? this.getNextRow(), 1, 16),
      colSpan,
      rowSpan
    };

    this.ensureGridContains(section.layout.row + section.layout.rowSpan - 1, section.layout.col + section.layout.colSpan - 1);
    this.activePage.sections = [...this.activePage.sections, section];
    section.fields.forEach(field => this.initializeFieldValue(field));
    this.customFieldSectionId = section.id;
    this.syncTemplateSections();
  }

  private cloneSectionForInsert(section: FormSectionDefinition): FormSectionDefinition {
    const suffix = this.createShortId();
    const cloned = this.clone(section);
    return {
      ...cloned,
      id: `${cloned.id}-${suffix}`,
      fields: cloned.fields.map(field => ({
        ...field,
        id: `${field.id}-${suffix}`
      }))
    };
  }

  private getNextRow(): number {
    const sections = this.activeSections;
    if (sections.length === 0) {
      return 1;
    }
    return Math.max(...sections.map(section => section.layout.row + section.layout.rowSpan), 1);
  }

  private getFormDropLayout(event: DragEvent, section: FormSectionDefinition): Partial<FormSectionLayout> {
    const canvas = this.formCanvas?.nativeElement ?? (event.currentTarget as HTMLElement);
    const rect = canvas.getBoundingClientRect();
    const layout = section.layout ?? { col: 1, row: 1, colSpan: 4, rowSpan: 1 };
    const colSpan = this.clamp(layout.colSpan, 2, this.gridColumns);
    const rowSpan = this.clamp(layout.rowSpan, 1, this.gridRows);
    const columnWidth = rect.width / this.gridColumns;
    const x = this.clamp(event.clientX - rect.left, 0, rect.width);
    const y = Math.max(0, event.clientY - rect.top + canvas.scrollTop);

    return {
      col: this.clamp(Math.floor(x / columnWidth) + 1, 1, Math.max(1, this.gridColumns - colSpan + 1)),
      row: this.clamp(Math.floor(y / 132) + 1, 1, Math.max(1, 16 - rowSpan + 1)),
      colSpan,
      rowSpan
    };
  }

  private getFormFieldDropLayout(event: DragEvent, type: FormFieldType): Partial<FormSectionLayout> {
    const canvas = this.formCanvas?.nativeElement ?? (event.currentTarget as HTMLElement);
    const rect = canvas.getBoundingClientRect();
    const fieldLayout = this.getDefaultFieldLayout(type);
    const colSpan = this.clamp(fieldLayout.colSpan, 2, this.gridColumns);
    const rowSpan = type === 'header' ? 1 : 1;
    const columnWidth = rect.width / this.gridColumns;
    const x = this.clamp(event.clientX - rect.left, 0, rect.width);
    const y = Math.max(0, event.clientY - rect.top + canvas.scrollTop);

    return {
      col: this.clamp(Math.floor(x / columnWidth) + 1, 1, Math.max(1, this.gridColumns - colSpan + 1)),
      row: this.clamp(Math.floor(y / 132) + 1, 1, Math.max(1, 16 - rowSpan + 1)),
      colSpan,
      rowSpan
    };
  }

  private getFormContainerDropLayout(event: DragEvent): Partial<FormSectionLayout> {
    return this.getFormDropLayout(event, {
      id: 'container-drop',
      title: 'Konténer',
      navCode: 'CONTAINER',
      mandatory: false,
      layout: { col: 1, row: 1, colSpan: 4, rowSpan: 2 },
      fields: []
    });
  }

  private movePage(sourceIndex: number, requestedTargetIndex: number): void {
    if (!this.activeTemplate || sourceIndex === requestedTargetIndex) {
      return;
    }

    const pages = [...this.activeTemplate.pages];
    const activePageId = this.activePage?.id;
    const [page] = pages.splice(sourceIndex, 1);
    let targetIndex = requestedTargetIndex;
    if (sourceIndex < targetIndex) {
      targetIndex -= 1;
    }
    pages.splice(this.clamp(targetIndex, 0, pages.length), 0, page);
    this.activeTemplate.pages = pages;
    const nextActiveIndex = pages.findIndex(item => item.id === activePageId);
    this.activePageIndex = nextActiveIndex >= 0 ? nextActiveIndex : 0;
    this.syncTemplateSections();
  }

  private ensureGridContains(row: number, column: number): void {
    if (!this.activeTemplate) {
      return;
    }
    this.activeTemplate.grid.rows = this.clamp(Math.max(this.gridRows, row), 3, 16);
    this.activeTemplate.grid.columns = this.clamp(Math.max(this.gridColumns, column), 4, 16);
  }

  private createDocumentTitle(): string {
    const familyName = this.readValue('familyName');
    const givenName = this.readValue('givenName');
    const name = [familyName, givenName].filter(Boolean).join(' ') || this.currentUser.fullName;
    const code = this.activeTemplate?.navCode || 'Űrlap';
    return `${name} - ${code}`;
  }

  private readValue(fieldId: string): string {
    const value = this.fieldValues[fieldId];
    return typeof value === 'string' ? value.trim() : '';
  }

  private parseCustomOptions() {
    return this.parseOptions(this.customFieldOptions);
  }

  private parseOptions(value: string) {
    return value
      .split(/\r?\n|,/)
      .map(option => option.trim())
      .filter(Boolean)
      .map(option => ({ label: option, value: this.slugify(option) }));
  }

  private getDefaultFieldLayout(type: FormFieldType): FormFieldLayout {
    if (type === 'header') {
      return { colSpan: 12, rowSpan: 1 };
    }
    if (type === 'textarea') {
      return { colSpan: 12, rowSpan: 2 };
    }
    if (type === 'checkbox') {
      return { colSpan: 4, rowSpan: 1 };
    }
    if (type === 'date' || type === 'number' || type === 'tel') {
      return { colSpan: 4, rowSpan: 1 };
    }
    return { colSpan: 6, rowSpan: 1 };
  }

  private getMaxFieldRowSpan(type: FormFieldType): number {
    if (type === 'header') {
      return 3;
    }
    return type === 'textarea' ? 4 : 1;
  }

  private getDefaultFieldLabel(type: FormFieldType): string {
    const item = this.fieldPalette.find(paletteItem => paletteItem.type === type);
    return item?.label ?? 'Mező';
  }

  private hasDragData(event: DragEvent, type: string): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes(type);
  }

  private getDragData(event: DragEvent, type: string): string {
    return event.dataTransfer?.getData(type) ?? '';
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'mezo';
  }

  private createId(prefix: string): string {
    const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    return `${prefix}-${random}`;
  }

  private createShortId(): string {
    return this.createId('section').replace(/[^a-z0-9]/gi, '').slice(-8).toLowerCase();
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
