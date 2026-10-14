import { describe, it, expect } from 'vitest';
import {
  createPage,
  createElement,
  validateProject,
  createDefaultProject,
} from '../../src/schema/projectSchema.js';

describe('Build kirish nuqtasi va sahifa regressiyasi', () => {
  it('createPage ildiz elementi bilan to‘liq sahifa qaytaradi', () => {
    const page = createPage({ nom: 'Test', slug: 'test' });
    expect(page.id).toBeTruthy();
    expect(page.ildiz).toBeTruthy();
    expect(page.ildiz.tur).toBe('page-root');
    expect(Array.isArray(page.ildiz.bolalar)).toBe(true);
  });

  it('bo‘sh sahifali loyiha validatsiyadan o‘tmaydi', () => {
    const invalid = validateProject({ versiya: 1, sahifalar: [] });
    expect(invalid.valid).toBe(false);
  });

  it('standart loyiha kamida bitta sahifaga ega', () => {
    const proj = createDefaultProject('Regressiya');
    expect(proj.sahifalar.length).toBeGreaterThanOrEqual(1);
    expect(
      validateProject(proj).valid
    ).toBe(true);
  });

  it('createElement bolalari har doim massiv bo‘ladi', () => {
    const el = createElement({ tur: 'box', nom: 'Quti' });
    expect(Array.isArray(el.bolalar)).toBe(true);
    expect(Array.isArray(el.harakatlar)).toBe(true);
  });
});
