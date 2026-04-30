import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { LibraryComponent, Draft, UploadedFile, AdminSettings } from './types';
import { DEFAULT_ADMIN_SETTINGS } from './types';

interface BriefCollectorDB extends DBSchema {
  library: {
    key: string;
    value: LibraryComponent;
    indexes: { 'by-name': string; 'by-created': number };
  };
  drafts: {
    key: string;
    value: Draft;
    indexes: { 'by-updated': number };
  };
  files: {
    key: string;
    value: UploadedFile;
    indexes: { 'by-category': string };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
  adminSettings: {
    key: string;
    value: { key: string; data: AdminSettings };
  };
}

let dbInstance: IDBPDatabase<BriefCollectorDB> | null = null;

async function getDB(): Promise<IDBPDatabase<BriefCollectorDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BriefCollectorDB>('brief-collector', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const libraryStore = db.createObjectStore('library', { keyPath: 'id' });
        libraryStore.createIndex('by-name', 'name');
        libraryStore.createIndex('by-created', 'createdAt');

        const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' });
        draftsStore.createIndex('by-updated', 'updatedAt');

        const filesStore = db.createObjectStore('files', { keyPath: 'id' });
        filesStore.createIndex('by-category', 'category');

        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (oldVersion < 2) {
        db.createObjectStore('adminSettings', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Library operations
export async function getAllComponents(): Promise<LibraryComponent[]> {
  const db = await getDB();
  return db.getAll('library');
}

export async function getComponent(id: string): Promise<LibraryComponent | undefined> {
  const db = await getDB();
  return db.get('library', id);
}

export async function saveComponent(component: LibraryComponent): Promise<void> {
  const db = await getDB();
  await db.put('library', component);
}

export async function deleteComponent(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('library', id);
}

export async function deleteComponents(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('library', 'readwrite');
  await Promise.all(ids.map(id => tx.store.delete(id)));
  await tx.done;
}

// Draft operations
export async function getAllDrafts(): Promise<Draft[]> {
  const db = await getDB();
  const drafts = await db.getAll('drafts');
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  const db = await getDB();
  return db.get('drafts', id);
}

export async function saveDraft(draft: Draft): Promise<void> {
  const db = await getDB();
  await db.put('drafts', draft);
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('drafts', id);
}

// File operations
export async function saveFile(file: UploadedFile): Promise<void> {
  const db = await getDB();
  await db.put('files', file);
}

export async function getFile(id: string): Promise<UploadedFile | undefined> {
  const db = await getDB();
  return db.get('files', id);
}

export async function deleteFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('files', id);
}

export async function getFilesByCategory(category: string): Promise<UploadedFile[]> {
  const db = await getDB();
  return db.getAllFromIndex('files', 'by-category', category);
}

// Meta operations
export async function getMeta(key: string): Promise<string | undefined> {
  const db = await getDB();
  const result = await db.get('meta', key);
  return result?.value;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.put('meta', { key, value });
}

// Admin settings operations
export async function getAdminSettings(): Promise<AdminSettings> {
  const db = await getDB();
  const result = await db.get('adminSettings', 'settings');
  return result?.data || { ...DEFAULT_ADMIN_SETTINGS };
}

export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  const db = await getDB();
  await db.put('adminSettings', { key: 'settings', data: settings });
}
