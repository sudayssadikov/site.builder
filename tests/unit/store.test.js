import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../src/store/editorStore.js';
import { createDefaultProject } from '../../src/schema/projectSchema.js';

describe('Zustand Editor Store', () => {
  beforeEach(() => {
    useEditorStore.getState().setProject(createDefaultProject('Test Proyekt'));
  });

  it('Element qo‘shish va o‘chirish undo/redo bilan ishlaydi', () => {
    const store = useEditorStore.getState();
    const root = store.getActivePageRoot();
    expect(root.bolalar.length).toBe(0);

    // Qo'shish
    store.addElement({ tur: 'button', nom: 'Sinov Tugmasi', props: { text: 'Bos' } });
    let updatedRoot = useEditorStore.getState().getActivePageRoot();
    expect(updatedRoot.bolalar.length).toBe(1);
    const addedId = updatedRoot.bolalar[0].id;

    // Undo qilish
    useEditorStore.getState().undo();
    updatedRoot = useEditorStore.getState().getActivePageRoot();
    expect(updatedRoot.bolalar.length).toBe(0);

    // Redo qilish
    useEditorStore.getState().redo();
    updatedRoot = useEditorStore.getState().getActivePageRoot();
    expect(updatedRoot.bolalar.length).toBe(1);
    expect(updatedRoot.bolalar[0].id).toBe(addedId);

    // O'chirish
    useEditorStore.getState().deleteElement(addedId);
    updatedRoot = useEditorStore.getState().getActivePageRoot();
    expect(updatedRoot.bolalar.length).toBe(0);

    // O'chirishni undo qilish
    useEditorStore.getState().undo();
    updatedRoot = useEditorStore.getState().getActivePageRoot();
    expect(updatedRoot.bolalar.length).toBe(1);
  });

  it('Uslub o‘zgartirish va undo/redo', () => {
    const store = useEditorStore.getState();
    store.addElement({ tur: 'text', nom: 'Sarlavha', props: { text: 'Salom' } });
    const root = useEditorStore.getState().getActivePageRoot();
    const elId = root.bolalar[0].id;

    useEditorStore.getState().updateElementStyle(elId, { color: '#ef4444', fontSize: '24px' });
    let el = useEditorStore.getState().getActivePageRoot().bolalar[0];
    expect(el.uslub.asosiy.color).toBe('#ef4444');
    expect(el.uslub.asosiy.fontSize).toBe('24px');

    useEditorStore.getState().undo();
    el = useEditorStore.getState().getActivePageRoot().bolalar[0];
    expect(el.uslub.asosiy.color).toBeUndefined();
  });
});
