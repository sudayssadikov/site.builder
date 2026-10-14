import { migrateProject, validateProject } from './schema/projectSchema.js';

const STORAGE_KEYS = {
  PROJECTS: 'site_builder_projects_v1',
  ACTIVE_ID: 'site_builder_active_project_id',
  PROJECT_PREFIX: 'site_builder_proj_',
};

const DB_NAME = 'SiteBuilderAssetsDB';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

/**
 * IndexedDB ni ochish (rasmlar va aktivlar uchun)
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return resolve(null); // Fallback
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Aktivni IndexedDB ga saqlash
 */
export async function saveAssetToDB(id, dataUrl, meta = {}) {
  try {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, dataUrl, meta, createdAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB saqlashda xato:', e);
    return false;
  }
}

/**
 * Aktivni IndexedDB dan olish
 */
export async function getAssetFromDB(id) {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB dan o‘qishda xato:', e);
    return null;
  }
}

/**
 * Barcha loyihalar ro'yxatini olish
 */
export function listProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Loyihalar ro‘yxatini olishda xato:', e);
    return [];
  }
}

/**
 * Loyihani saqlash (localStorage ga)
 */
export function saveProject(project) {
  try {
    const valid = validateProject(project);
    if (!valid.valid) {
      console.warn('Loyiha sxemasi qisman noto‘g‘ri:', valid.errors);
    }

    const id = project.id || 'default_proj';
    const key = `${STORAGE_KEYS.PROJECT_PREFIX}${id}`;
    const payload = JSON.stringify(project);

    localStorage.setItem(key, payload);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);

    // Ro'yxatni yangilash
    const list = listProjects();
    const existingIndex = list.findIndex((p) => p.id === id);
    const meta = {
      id,
      nom: project.sozlamalar?.nom || 'Nomsiz loyiha',
      updatedAt: Date.now(),
      pageCount: project.sahifalar?.length || 1,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = meta;
    } else {
      list.unshift(meta);
    }

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Loyihani saqlashda xato:', e);
    return false;
  }
}

/**
 * Loyihani yuklash
 */
export function loadProject(id) {
  try {
    const key = `${STORAGE_KEYS.PROJECT_PREFIX}${id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrateProject(parsed);
  } catch (e) {
    console.error('Loyihani yuklashda xato:', e);
    return null;
  }
}

/**
 * Oxirgi faol loyihani yuklash
 */
export function loadActiveProject() {
  try {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
    if (activeId) {
      const proj = loadProject(activeId);
      if (proj) return proj;
    }
    const list = listProjects();
    if (list.length > 0) {
      return loadProject(list[0].id);
    }
    return null;
  } catch (e) {
    console.error('Faol loyihani yuklashda xato:', e);
    return null;
  }
}

/**
 * Loyihani o'chirish
 */
export function deleteProject(id) {
  try {
    localStorage.removeItem(`${STORAGE_KEYS.PROJECT_PREFIX}${id}`);
    const list = listProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('Loyihani o‘chirishda xato:', e);
    return false;
  }
}

/**
 * JSON fayl sifatida eksport qilish
 */
export function exportProjectAsJSON(project) {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileName = `${(project.sozlamalar?.nom || 'sayt').toLowerCase().replace(/\s+/g, '_')}_export.json`;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * JSON qatordan loyihani import qilish
 */
export function importProjectFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const migrated = migrateProject(parsed);
    const valid = validateProject(migrated);
    if (!valid.valid) {
      throw new Error(`Sxema mos emas: ${valid.errors.join(', ')}`);
    }
    return migrated;
  } catch (e) {
    throw new Error(`JSON import xatosi: ${e.message}`);
  }
}
