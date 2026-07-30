import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormSectionDefinition,
  FormTemplate,
  FormTemplatePage
} from '../../models/form-editor.model';
import { FormEditorStoreService } from '../../services/form-editor-store.service';
import { FormEditorComponent } from './form-editor.component';

function createTitleSection(pageId: string): FormSectionDefinition {
  return {
    id: `form-title-${pageId}`,
    title: 'Régi űrlapnév',
    navCode: 'REGI',
    description: 'Űrlap címsor',
    mandatory: false,
    layout: { col: 1, row: 1, colSpan: 6, rowSpan: 1 },
    fields: []
  };
}

function createPage(id: string, sections: FormSectionDefinition[] = []): FormTemplatePage {
  return {
    id,
    title: id === 'page-1' ? 'Első oldal' : 'Második oldal',
    mandatory: true,
    sections: [createTitleSection(id), ...sections]
  };
}

function createTemplate(sections: FormSectionDefinition[] = []): FormTemplate {
  return {
    id: 'test-template',
    name: 'Régi űrlapnév',
    navCode: 'REGI',
    description: '',
    mandatory: false,
    grid: { columns: 12, rows: 12 },
    pages: [
      createPage('page-1', sections),
      createPage('page-2')
    ],
    updatedAt: '2026-01-01T00:00:00.000Z',
    sections: []
  };
}

describe('FormEditorComponent', () => {
  let fixture: ComponentFixture<FormEditorComponent>;
  let component: FormEditorComponent;
  let store: {
    getTemplates: ReturnType<typeof vi.fn>;
    getSectionTemplates: ReturnType<typeof vi.fn>;
    saveTemplate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    store = {
      getTemplates: vi.fn().mockResolvedValue([]),
      getSectionTemplates: vi.fn().mockResolvedValue([]),
      saveTemplate: vi.fn().mockResolvedValue(undefined)
    };

    await TestBed.configureTestingModule({
      imports: [FormEditorComponent],
      providers: [
        { provide: FormEditorStoreService, useValue: store }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('keeps edited form-title metadata in every page and in the saved template', async () => {
    const template = createTemplate();
    component.activeTemplate = template;
    component.templates = [template];
    component.selectedTemplateId = template.id;
    component.builderEditing = true;
    component.selectedSectionSettingsId = 'form-title-page-1';
    component.sectionSettingsOpen = true;

    const editedTitle = template.pages[0].sections[0];
    editedTitle.title = 'Friss űrlapnév';
    editedTitle.navCode = 'FRISS';

    component.closeSectionSettings();

    expect(component.activeTemplate.name).toBe('Friss űrlapnév');
    expect(component.activeTemplate.navCode).toBe('FRISS');
    expect(
      component.activeTemplate.pages.map(page => page.sections[0].title)
    ).toEqual(['Friss űrlapnév', 'Friss űrlapnév']);
    expect(
      component.activeTemplate.pages.map(page => page.sections[0].navCode)
    ).toEqual(['FRISS', 'FRISS']);

    await component.saveTemplate();

    const savedTemplate = store.saveTemplate.mock.calls[0][0] as FormTemplate;
    expect(savedTemplate.name).toBe('Friss űrlapnév');
    expect(savedTemplate.navCode).toBe('FRISS');
    expect(savedTemplate.pages[0].sections[0].title).toBe('Friss űrlapnév');
  });

  it('locks editing while saving an isolated field snapshot', async () => {
    const template = createTemplate();
    component.activeTemplate = template;
    component.templates = [template];
    component.selectedTemplateId = template.id;
    component.builderEditing = true;
    component.addFieldToActiveForm('text', {}, 'Új mező');

    const addedField = component.activeTemplate.pages[0].sections
      .flatMap(section => section.fields)
      .find(field => field.label === 'Új mező');
    if (!addedField) {
      throw new Error('A tesztmező nem jött létre.');
    }

    let finishSave!: () => void;
    store.saveTemplate.mockImplementation(() => new Promise<void>(resolve => {
      finishSave = resolve;
    }));

    const save = component.handleStencilAction();
    await Promise.resolve();

    expect(component.saving).toBe(true);
    expect(component.builderEditing).toBe(false);
    expect(store.saveTemplate).toHaveBeenCalledTimes(1);

    const savedSnapshot = store.saveTemplate.mock.calls[0][0] as FormTemplate;
    expect(savedSnapshot).not.toBe(component.activeTemplate);
    expect(savedSnapshot.pages[0]).not.toBe(component.activeTemplate.pages[0]);
    component.addFieldToActiveForm('text', {}, 'Mentés közbeni mező');

    expect(
      component.activeTemplate.pages[0].sections
        .flatMap(section => section.fields)
        .some(field => field.label === 'Mentés közbeni mező')
    ).toBe(false);
    expect(
      savedSnapshot.pages[0].sections
        .flatMap(section => section.fields)
        .find(field => field.id === addedField.id)?.label
    ).toBe('Új mező');

    await component.handleStencilAction();
    expect(store.saveTemplate).toHaveBeenCalledTimes(1);

    finishSave();
    await save;
    fixture.detectChanges();

    expect(component.builderEditing).toBe(false);
    expect(
      fixture.nativeElement.querySelector('input[placeholder="Új mező"]')
    ).toBeTruthy();

    (component as unknown as { resetStencilSaveFeedback(): void })
      .resetStencilSaveFeedback();
  });

  it('restores edit mode when saving fails', async () => {
    const template = createTemplate();
    component.activeTemplate = template;
    component.templates = [template];
    component.selectedTemplateId = template.id;
    component.builderEditing = true;
    store.saveTemplate.mockRejectedValueOnce(new Error('Mentési hiba'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await component.saveTemplate();

    expect(component.builderEditing).toBe(true);
    expect(component.saving).toBe(false);
    expect(component.statusMessage).toBe('Az űrlapszerkezet mentése sikertelen.');

    consoleError.mockRestore();
  });
});
