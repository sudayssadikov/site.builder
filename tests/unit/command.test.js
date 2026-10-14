import { describe, it, expect, beforeEach } from 'vitest';
import { CommandManager } from '../../src/store/commandManager.js';

describe('CommandManager va Undo/Redo tizimi', () => {
  let manager;
  let state;

  beforeEach(() => {
    manager = new CommandManager();
    state = { count: 0, text: 'salom' };
  });

  it('Buyruq bajariladi va undo/redo to‘g‘ri ishlaydi', () => {
    const cmd = {
      nom: 'Sonni oshirish',
      execute: () => {
        state.count += 1;
      },
      undo: () => {
        state.count -= 1;
      },
    };

    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(false);

    manager.execute(cmd);
    expect(state.count).toBe(1);
    expect(manager.canUndo()).toBe(true);
    expect(manager.canRedo()).toBe(false);

    manager.undo();
    expect(state.count).toBe(0);
    expect(manager.canUndo()).toBe(false);
    expect(manager.canRedo()).toBe(true);

    manager.redo();
    expect(state.count).toBe(1);
    expect(manager.canUndo()).toBe(true);
  });

  it('Yangi buyruq bajarilganda redo ro‘yxati tozalanadi', () => {
    const cmd1 = {
      nom: '1-qadam',
      execute: () => (state.count = 1),
      undo: () => (state.count = 0),
    };
    const cmd2 = {
      nom: '2-qadam',
      execute: () => (state.count = 2),
      undo: () => (state.count = 1),
    };

    manager.execute(cmd1);
    manager.undo();
    expect(manager.canRedo()).toBe(true);

    manager.execute(cmd2);
    expect(manager.canRedo()).toBe(false);
    expect(state.count).toBe(2);
  });

  it('Batch operatsiyasi ko‘p o‘zgarishlarni bitta atomik qadamga birlashtiradi', () => {
    manager.batch('Guruhli o‘zgarish', () => {
      manager.execute({
        nom: 'Qadam 1',
        execute: () => (state.count = 10),
        undo: () => (state.count = 0),
      });
      manager.execute({
        nom: 'Qadam 2',
        execute: () => (state.text = 'dunyo'),
        undo: () => (state.text = 'salom'),
      });
    });

    expect(state.count).toBe(10);
    expect(state.text).toBe('dunyo');
    expect(manager.undoStack.length).toBe(1);

    // Bitta undo ikkala o'zgarishni ham bekor qiladi
    manager.undo();
    expect(state.count).toBe(0);
    expect(state.text).toBe('salom');

    // Bitta redo ikkalasini qaytaradi
    manager.redo();
    expect(state.count).toBe(10);
    expect(state.text).toBe('dunyo');
  });
});
