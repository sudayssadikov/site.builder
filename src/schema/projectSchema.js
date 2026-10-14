import { generateId } from '../utils/id.js';

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Yangi element yaratish uchun fabrika funksiyasi
 */
export function createElement({
  tur = 'box',
  nom = 'Konteyner',
  props = {},
  uslub = {},
  harakatlar = [],
  animatsiya = null,
  bolalar = [],
  id = null,
} = {}) {
  return {
    id: id || generateId(tur),
    tur,
    nom,
    props: {
      tag: 'div',
      text: '',
      ...props,
    },
    uslub: {
      asosiy: {
        ...(uslub.asosiy || {}),
      },
      planshet: {
        ...(uslub.planshet || {}),
      },
      mobil: {
        ...(uslub.mobil || {}),
      },
      holatlar: {
        hover: { ...(uslub.holatlar?.hover || {}) },
        active: { ...(uslub.holatlar?.active || {}) },
        focus: { ...(uslub.holatlar?.focus || {}) },
      },
    },
    harakatlar: Array.isArray(harakatlar) ? [...harakatlar] : [],
    animatsiya: animatsiya ? { ...animatsiya } : null,
    bolalar: Array.isArray(bolalar) ? bolalar.map((b) => (b.id ? b : createElement(b))) : [],
  };
}

/**
 * Standart sahifa yaratish
 */
export function createPage({
  id = null,
  nom = 'Bosh sahifa',
  slug = 'index',
  meta = {},
  ildiz = null,
} = {}) {
  const pageId = id || generateId('page');
  const rootElement =
    ildiz ||
    createElement({
      tur: 'page-root',
      nom: 'Sahifa Ildizi',
      props: { tag: 'div' },
      uslub: {
        asosiy: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: 'Inter, sans-serif',
          margin: '0',
          padding: '0',
          boxSizing: 'border-box',
          position: 'relative',
        },
      },
      bolalar: [],
    });

  return {
    id: pageId,
    nom,
    slug,
    meta: {
      title: meta.title || nom,
      description: meta.description || `${nom} sahifasi`,
      keywords: meta.keywords || '',
      ...meta,
    },
    ildiz: rootElement,
  };
}

/**
 * Standart yangi loyiha yaratish
 */
export function createDefaultProject(nom = 'Mening Yangi Saytim') {
  return {
    versiya: CURRENT_SCHEMA_VERSION,
    sozlamalar: {
      nom,
      favicon: '',
      tokenlar: {
        ranglar: {
          asosiy: '#6366f1',
          ikkilamchi: '#ec4899',
          fon: '#ffffff',
          matn: '#0f172a',
          chegara: '#e2e8f0',
          urgu: '#10b981',
          xato: '#ef4444',
          qorongifon: '#0b0f19',
        },
        shriftlar: {
          asosiy: 'Inter, sans-serif',
          sarlavha: 'Outfit, sans-serif',
          monospaced: 'Fira Code, monospace',
        },
        oraliqlar: {
          kichik: '8px',
          orta: '16px',
          katta: '32px',
          katta2x: '64px',
        },
      },
    },
    sahifalar: [createPage()],
    aktivlar: [],
  };
}

/**
 * Daraxt ichidan ID bo'yicha elementni qidirish
 */
export function findElementById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  if (Array.isArray(node.bolalar)) {
    for (const child of node.bolalar) {
      const found = findElementById(child, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Daraxt ichidan berilgan elementning otasini va indeksini topish
 */
export function findParentAndIndex(root, childId) {
  if (!root || !root.bolalar) return null;

  for (let i = 0; i < root.bolalar.length; i++) {
    if (root.bolalar[i].id === childId) {
      return { parent: root, index: i };
    }
    const found = findParentAndIndex(root.bolalar[i], childId);
    if (found) return found;
  }
  return null;
}

/**
 * Elementni chuqur nusxalash (barcha bolalar uchun yangi ID lar bilan)
 */
export function cloneElementWithNewIds(element) {
  const newElement = JSON.parse(JSON.stringify(element));
  function reassignIds(el) {
    el.id = generateId(el.tur);
    if (Array.isArray(el.bolalar)) {
      el.bolalar.forEach(reassignIds);
    }
  }
  reassignIds(newElement);
  return newElement;
}

/**
 * Sxemani tekshirish va xatolarni aniqlash
 */
export function validateProject(project) {
  const errors = [];
  if (!project || typeof project !== 'object') {
    errors.push("Loyiha ob'ekt bo'lishi kerak");
    return { valid: false, errors };
  }
  if (typeof project.versiya !== 'number') {
    errors.push('Sxema versiyasi ko‘rsatilmagan');
  }
  if (!Array.isArray(project.sahifalar) || project.sahifalar.length === 0) {
    errors.push('Kamida bitta sahifa bo‘lishi kerak');
  } else {
    project.sahifalar.forEach((page, idx) => {
      if (!page.id) errors.push(`${idx}-sahifaning ID si yo‘q`);
      if (!page.ildiz) errors.push(`${idx}-sahifaning ildiz elementi yo‘q`);
    });
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Sxema migratsiyasi (kelajakdagi versiyalar uchun)
 */
export function migrateProject(rawProject) {
  if (!rawProject || typeof rawProject !== 'object') {
    return createDefaultProject();
  }

  let project = JSON.parse(JSON.stringify(rawProject));

  // Versiya 0 dan 1 ga migratsiya
  if (!project.versiya || project.versiya < 1) {
    project.versiya = 1;
    if (!project.sozlamalar) project.sozlamalar = {};
    if (!project.sozlamalar.tokenlar) {
      project.sozlamalar.tokenlar = createDefaultProject().sozlamalar.tokenlar;
    }
    if (!project.aktivlar) project.aktivlar = [];
  }

  // Har bir elementda kerakli tuzilma mavjudligini ta'minlash
  function sanitizeElement(el) {
    if (!el.id) el.id = generateId(el.tur || 'el');
    if (!el.tur) el.tur = 'box';
    if (!el.props) el.props = {};
    if (!el.uslub) el.uslub = {};
    if (!el.uslub.asosiy) el.uslub.asosiy = {};
    if (!el.uslub.planshet) el.uslub.planshet = {};
    if (!el.uslub.mobil) el.uslub.mobil = {};
    if (!el.uslub.holatlar) el.uslub.holatlar = { hover: {}, active: {}, focus: {} };
    if (!Array.isArray(el.harakatlar)) el.harakatlar = [];
    if (!Array.isArray(el.bolalar)) el.bolalar = [];
    el.bolalar.forEach(sanitizeElement);
  }

  if (Array.isArray(project.sahifalar)) {
    project.sahifalar.forEach((p) => {
      if (p.ildiz) sanitizeElement(p.ildiz);
    });
  }

  return project;
}
