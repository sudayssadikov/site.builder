import { describe, it, expect } from 'vitest';
import {
  createDefaultProject,
  createElement,
  findElementById,
  findParentAndIndex,
  cloneElementWithNewIds,
  validateProject,
  migrateProject,
} from '../../src/schema/projectSchema.js';

describe('Project Schema va Element fabrikasi', () => {
  it('Standart loyiha to‘g‘ri struktura bilan yaratiladi', () => {
    const proj = createDefaultProject('Test Loyiha');
    expect(proj.versiya).toBe(1);
    expect(proj.sozlamalar.nom).toBe('Test Loyiha');
    expect(proj.sozlamalar.tokenlar.ranglar.asosiy).toBe('#6366f1');
    expect(proj.sahifalar.length).toBe(1);
    expect(proj.sahifalar[0].ildiz.tur).toBe('page-root');
  });

  it('Yangi element to‘liq uslub va holatlar bilan yaratiladi', () => {
    const el = createElement({
      tur: 'button',
      nom: 'Tugma',
      props: { text: 'Bosing' },
      uslub: {
        asosiy: { backgroundColor: '#6366f1', color: '#ffffff' },
        planshet: { padding: '8px' },
        holatlar: { hover: { backgroundColor: '#4f46e5' } },
      },
    });

    expect(el.id).toMatch(/^button_/);
    expect(el.props.text).toBe('Bosing');
    expect(el.uslub.asosiy.backgroundColor).toBe('#6366f1');
    expect(el.uslub.planshet.padding).toBe('8px');
    expect(el.uslub.holatlar.hover.backgroundColor).toBe('#4f46e5');
  });

  it('Daraxt ichidan elementni ID bo‘yicha topish va ota-indeksni hisoblash', () => {
    const child1 = createElement({ tur: 'text', nom: 'Matn' });
    const child2 = createElement({ tur: 'button', nom: 'Tugma' });
    const section = createElement({
      tur: 'section',
      nom: 'Bo‘lim',
      bolalar: [child1, child2],
    });
    const root = createElement({
      tur: 'page-root',
      nom: 'Ildiz',
      bolalar: [section],
    });

    // Qidirish
    const found = findElementById(root, child2.id);
    expect(found).not.toBeNull();
    expect(found.id).toBe(child2.id);

    // Otani topish
    const pInfo = findParentAndIndex(root, child2.id);
    expect(pInfo).not.toBeNull();
    expect(pInfo.parent.id).toBe(section.id);
    expect(pInfo.index).toBe(1);
  });

  it('cloneElementWithNewIds barcha bolalar ID sini yangilaydi', () => {
    const child = createElement({ tur: 'text', nom: 'Matn' });
    const parent = createElement({
      tur: 'box',
      nom: 'Konteyner',
      bolalar: [child],
    });

    const cloned = cloneElementWithNewIds(parent);
    expect(cloned.id).not.toBe(parent.id);
    expect(cloned.bolalar[0].id).not.toBe(child.id);
    expect(cloned.bolalar[0].tur).toBe('text');
  });

  it('validateProject xatolarni aniqlaydi', () => {
    const valid = validateProject(createDefaultProject());
    expect(valid.valid).toBe(true);

    const invalid = validateProject({ versiya: 1, sahifalar: [] });
    expect(invalid.valid).toBe(false);
  });

  it('migrateProject eski yoki chala ma’lumotlarni to‘g‘rilaydi', () => {
    const raw = {
      versiya: 0,
      sahifalar: [
        {
          id: 'p1',
          nom: 'Sahifa 1',
          ildiz: {
            tur: 'box',
            nom: 'Bosh quti',
          },
        },
      ],
    };
    const migrated = migrateProject(raw);
    expect(migrated.versiya).toBe(1);
    expect(migrated.sozlamalar.tokenlar).toBeDefined();
    expect(migrated.sahifalar[0].ildiz.uslub.asosiy).toBeDefined();
    expect(migrated.sahifalar[0].ildiz.bolalar).toEqual([]);
  });
});
