import { Injectable } from '@angular/core';
import { DEFAULT_FORM_TEMPLATES, FormDocument, FormSectionDefinition, FormTemplate, SECTION_LIBRARY } from '../models/form-editor.model';

const DB_NAME = 'e-kozig-form-editor';
const DB_VERSION = 2;
const TEMPLATE_STORE = 'formTemplates';
const DOCUMENT_STORE = 'formDocuments';
const SECTION_STORE = 'sectionTemplates';

@Injectable({
  providedIn: 'root'
})
export class FormEditorStoreService {
  private dbPromise?: Promise<IDBDatabase>;

  async getTemplates(): Promise<FormTemplate[]> {
    const db = await this.openDb();
    await this.seedTemplates(db);
    return this.getAll<FormTemplate>(db, TEMPLATE_STORE).then(items =>
      items.sort((a, b) => a.name.localeCompare(b.name, 'hu'))
    );
  }

  async getSectionTemplates(): Promise<FormSectionDefinition[]> {
    const db = await this.openDb();
    await this.seedSectionTemplates(db);
    return this.getAll<FormSectionDefinition>(db, SECTION_STORE).then(items =>
      items.sort((a, b) => a.title.localeCompare(b.title, 'hu'))
    );
  }

  async saveTemplate(template: FormTemplate): Promise<void> {
    const db = await this.openDb();
    await this.put(db, TEMPLATE_STORE, this.compactTemplate(template));
  }

  async saveSectionTemplate(section: FormSectionDefinition): Promise<void> {
    const db = await this.openDb();
    await this.put(db, SECTION_STORE, section);
  }

  async deleteSectionTemplate(sectionId: string): Promise<void> {
    const db = await this.openDb();
    await this.delete(db, SECTION_STORE, sectionId);
  }

  async getDocuments(): Promise<FormDocument[]> {
    const db = await this.openDb();
    return this.getAll<FormDocument>(db, DOCUMENT_STORE).then(items =>
      items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    );
  }

  async saveDocument(document: FormDocument): Promise<void> {
    const db = await this.openDb();
    await this.put(db, DOCUMENT_STORE, document);
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
        if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
          db.createObjectStore(TEMPLATE_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(DOCUMENT_STORE)) {
          db.createObjectStore(DOCUMENT_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SECTION_STORE)) {
          db.createObjectStore(SECTION_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private async seedTemplates(db: IDBDatabase): Promise<void> {
    const count = await this.count(db, TEMPLATE_STORE);
    if (count > 0) {
      return;
    }

    await Promise.all(
      DEFAULT_FORM_TEMPLATES.map(template => this.put(db, TEMPLATE_STORE, this.compactTemplate(template)))
    );
  }

  private async seedSectionTemplates(db: IDBDatabase): Promise<void> {
    const count = await this.count(db, SECTION_STORE);
    if (count > 0) {
      return;
    }

    await Promise.all(
      SECTION_LIBRARY.map(section => this.put(db, SECTION_STORE, this.clone(section)))
    );
  }

  private count(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private getAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  private put<T>(db: IDBDatabase, storeName: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private delete(db: IDBDatabase, storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private compactTemplate(template: FormTemplate): FormTemplate {
    return { ...template, sections: [] };
  }
}
