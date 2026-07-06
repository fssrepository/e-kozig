import { Injectable } from '@angular/core';
import { DEFAULT_FORM_TEMPLATES, FormDocument, FormSectionDefinition, FormTemplate, SECTION_LIBRARY } from '../models/form-editor.model';

const DB_NAME = 'e-kozig-form-editor';
const DB_VERSION = 3;
const TABLE_STORE = 'formEditorTables';
const TEMPLATE_TABLE = 'formTemplates';
const DOCUMENT_TABLE = 'formDocuments';
const SECTION_TABLE = 'sectionTemplates';

interface EntityTable<T extends { id: string }> {
  ids: string[];
  byId: Record<string, T>;
}

@Injectable({
  providedIn: 'root'
})
export class FormEditorStoreService {
  private dbPromise?: Promise<IDBDatabase>;
  private tablesReadyPromise?: Promise<void>;

  async getTemplates(): Promise<FormTemplate[]> {
    const db = await this.openReadyDb();
    return this.tableItems(await this.readTable<FormTemplate>(db, TEMPLATE_TABLE))
      .sort((a, b) => a.name.localeCompare(b.name, 'hu'));
  }

  async getSectionTemplates(): Promise<FormSectionDefinition[]> {
    const db = await this.openReadyDb();
    return this.tableItems(await this.readTable<FormSectionDefinition>(db, SECTION_TABLE))
      .sort((a, b) => a.title.localeCompare(b.title, 'hu'));
  }

  async saveTemplate(template: FormTemplate): Promise<void> {
    const db = await this.openReadyDb();
    const table = await this.readTable<FormTemplate>(db, TEMPLATE_TABLE);
    await this.writeTable(db, TEMPLATE_TABLE, this.upsertTableItem(table, this.compactTemplate(template)));
  }

  async saveSectionTemplate(section: FormSectionDefinition): Promise<void> {
    const db = await this.openReadyDb();
    const table = await this.readTable<FormSectionDefinition>(db, SECTION_TABLE);
    await this.writeTable(db, SECTION_TABLE, this.upsertTableItem(table, this.compactSection(section)));
  }

  async deleteSectionTemplate(sectionId: string): Promise<void> {
    const db = await this.openReadyDb();
    const table = await this.readTable<FormSectionDefinition>(db, SECTION_TABLE);
    await this.writeTable(db, SECTION_TABLE, this.removeTableItem(table, sectionId));
  }

  async getDocuments(): Promise<FormDocument[]> {
    const db = await this.openReadyDb();
    return this.tableItems(await this.readTable<FormDocument>(db, DOCUMENT_TABLE))
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  async saveDocument(document: FormDocument): Promise<void> {
    const db = await this.openReadyDb();
    const table = await this.readTable<FormDocument>(db, DOCUMENT_TABLE);
    await this.writeTable(db, DOCUMENT_TABLE, this.upsertTableItem(table, document));
  }

  private async openReadyDb(): Promise<IDBDatabase> {
    const db = await this.openDb();
    if (!this.tablesReadyPromise) {
      this.tablesReadyPromise = this.initializeTables(db)
        .catch(error => {
          this.tablesReadyPromise = undefined;
          throw error;
        });
    }
    await this.tablesReadyPromise;
    return db;
  }

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not available in this browser.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TABLE_STORE)) {
          db.createObjectStore(TABLE_STORE);
        }
      };

      const fail = (error: unknown) => {
        this.dbPromise = undefined;
        reject(error instanceof Error ? error : new Error('IndexedDB open failed.'));
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(new Error('IndexedDB open was blocked.'));
    });

    return this.dbPromise;
  }

  private async initializeTables(db: IDBDatabase): Promise<void> {
    await Promise.all([
      this.ensureTable(
        db,
        TEMPLATE_TABLE,
        DEFAULT_FORM_TEMPLATES.map(template => this.compactTemplate(template))
      ),
      this.ensureTable(
        db,
        SECTION_TABLE,
        SECTION_LIBRARY.map(section => this.compactSection(section))
      ),
      this.ensureTable<FormDocument>(db, DOCUMENT_TABLE, [])
    ]);
  }

  private async ensureTable<T extends { id: string }>(
    db: IDBDatabase,
    tableName: string,
    seedItems: T[]
  ): Promise<void> {
    const existing = await this.readTableOrNull<T>(db, tableName);
    if (existing && existing.ids.length > 0) {
      return;
    }

    const legacyItems = db.objectStoreNames.contains(tableName)
      ? await this.getLegacyItems<T>(db, tableName)
      : [];
    const items = legacyItems.length > 0 ? legacyItems : seedItems;
    if (items.length === 0 && existing) {
      return;
    }
    await this.writeTable(db, tableName, this.createTable(items));
  }

  private getLegacyItems<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  private readTable<T extends { id: string }>(db: IDBDatabase, tableName: string): Promise<EntityTable<T>> {
    return this.readTableOrNull<T>(db, tableName).then(table => table ?? this.createTable<T>([]));
  }

  private readTableOrNull<T extends { id: string }>(
    db: IDBDatabase,
    tableName: string
  ): Promise<EntityTable<T> | null> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TABLE_STORE, 'readonly');
      const store = transaction.objectStore(TABLE_STORE);
      const request = store.get(tableName);
      request.onsuccess = () => resolve(this.normalizeTable<T>(request.result));
      request.onerror = () => reject(request.error);
    });
  }

  private writeTable<T extends { id: string }>(
    db: IDBDatabase,
    tableName: string,
    table: EntityTable<T>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TABLE_STORE, 'readwrite');
      const store = transaction.objectStore(TABLE_STORE);
      store.put(table, tableName);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  private createTable<T extends { id: string }>(items: T[]): EntityTable<T> {
    return items.reduce<EntityTable<T>>((table, item) => this.upsertTableItem(table, item), {
      ids: [],
      byId: {}
    });
  }

  private normalizeTable<T extends { id: string }>(value: unknown): EntityTable<T> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const table = value as Partial<EntityTable<T>>;
    const byId = table.byId && typeof table.byId === 'object'
      ? table.byId as Record<string, T>
      : {};
    const ids = Array.isArray(table.ids)
      ? table.ids.filter(id => typeof id === 'string' && byId[id])
      : Object.keys(byId);
    return {
      ids,
      byId
    };
  }

  private tableItems<T extends { id: string }>(table: EntityTable<T>): T[] {
    return table.ids.map(id => table.byId[id]).filter(Boolean);
  }

  private upsertTableItem<T extends { id: string }>(table: EntityTable<T>, item: T): EntityTable<T> {
    return {
      ids: table.ids.includes(item.id) ? table.ids : [...table.ids, item.id],
      byId: {
        ...table.byId,
        [item.id]: item
      }
    };
  }

  private removeTableItem<T extends { id: string }>(table: EntityTable<T>, id: string): EntityTable<T> {
    const { [id]: _removed, ...byId } = table.byId;
    return {
      ids: table.ids.filter(itemId => itemId !== id),
      byId
    };
  }

  private compactTemplate(template: FormTemplate): FormTemplate {
    return {
      id: template.id,
      name: template.name,
      navCode: template.navCode,
      description: template.description,
      mandatory: template.mandatory,
      grid: {
        columns: template.grid?.columns ?? 12,
        rows: template.grid?.rows ?? 12
      },
      pages: (template.pages ?? []).map(page => this.compactPage(page)),
      updatedAt: template.updatedAt,
      sections: []
    };
  }

  private compactPage(page: FormTemplate['pages'][number]): FormTemplate['pages'][number] {
    const next: FormTemplate['pages'][number] = {
      id: page.id,
      title: page.title,
      mandatory: page.mandatory,
      sections: (page.sections ?? []).map(section => this.compactSection(section))
    };
    if (page.layout) {
      next.layout = this.compactSectionLayout(page.layout);
    }
    return next;
  }

  private compactSection(section: FormSectionDefinition): FormSectionDefinition {
    const next: FormSectionDefinition = {
      id: section.id,
      title: section.title,
      layout: this.compactSectionLayout(section.layout),
      fields: (section.fields ?? []).map(field => this.compactField(field))
    };
    if (section.navCode !== undefined) {
      next.navCode = section.navCode;
    }
    if (section.description !== undefined) {
      next.description = section.description;
    }
    if (section.mandatory !== undefined) {
      next.mandatory = section.mandatory;
    }
    if (section.grouped !== undefined) {
      next.grouped = section.grouped;
    }
    return next;
  }

  private compactField(field: FormSectionDefinition['fields'][number]): FormSectionDefinition['fields'][number] {
    const next: FormSectionDefinition['fields'][number] = {
      id: field.id,
      label: field.label,
      type: field.type
    };
    if (field.placeholder !== undefined) {
      next.placeholder = field.placeholder;
    }
    if (field.subtitle !== undefined) {
      next.subtitle = field.subtitle;
    }
    if (field.headerVariant !== undefined) {
      next.headerVariant = field.headerVariant;
    }
    if (field.headerBackground !== undefined) {
      next.headerBackground = field.headerBackground;
    }
    if (field.headerLine !== undefined) {
      next.headerLine = field.headerLine;
    }
    if (field.required !== undefined) {
      next.required = field.required;
    }
    if (field.autofillKey !== undefined) {
      next.autofillKey = field.autofillKey;
    }
    if (field.options !== undefined) {
      next.options = field.options.map(option => ({
        label: option.label,
        value: option.value
      }));
    }
    if (field.layout !== undefined) {
      next.layout = {
        col: field.layout.col,
        row: field.layout.row,
        colSpan: field.layout.colSpan,
        rowSpan: field.layout.rowSpan
      };
    }
    return next;
  }

  private compactSectionLayout(layout: FormSectionDefinition['layout']): FormSectionDefinition['layout'] {
    return {
      col: layout.col,
      row: layout.row,
      colSpan: layout.colSpan,
      rowSpan: layout.rowSpan
    };
  }
}
