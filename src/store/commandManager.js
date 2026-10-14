/**
 * Buyruqlar boshqaruvchisi (Command Manager)
 * Cheksiz Undo / Redo va Batch (guruhlangan) o'zgarishlarni qo'llab-quvvatlaydi.
 */
export class CommandManager {
  constructor(options = {}) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = options.maxHistory || 1000;
    this.isExecuting = false;
    this.batchDepth = 0;
    this.currentBatch = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener({
          canUndo: this.canUndo(),
          canRedo: this.canRedo(),
          undoCount: this.undoStack.length,
          redoCount: this.redoStack.length,
          lastCommand: this.getLastCommand(),
        });
      } catch (err) {
        console.error('Command listener error:', err);
      }
    });
  }

  execute(command) {
    if (this.isExecuting) return;

    if (this.batchDepth > 0 && this.currentBatch) {
      this.currentBatch.commands.push(command);
      this.isExecuting = true;
      try {
        command.execute();
      } finally {
        this.isExecuting = false;
      }
      return;
    }

    this.isExecuting = true;
    try {
      command.execute();
      this.undoStack.push(command);
      this.redoStack = []; // Yangi harakat bajarilganda redo tozalanadi
      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
    } finally {
      this.isExecuting = false;
      this.notify();
    }
  }

  batch(name, fn) {
    const previousBatch = this.currentBatch;
    const batchCmd = {
      nom: name,
      commands: [],
      execute: () => {
        for (const cmd of batchCmd.commands) {
          cmd.execute();
        }
      },
      undo: () => {
        for (let i = batchCmd.commands.length - 1; i >= 0; i--) {
          batchCmd.commands[i].undo();
        }
      },
    };

    this.currentBatch = batchCmd;
    this.batchDepth++;

    try {
      fn();
    } finally {
      this.batchDepth--;
      this.currentBatch = previousBatch;
    }

    if (this.batchDepth === 0 && batchCmd.commands.length > 0) {
      this.undoStack.push(batchCmd);
      this.redoStack = [];
      if (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
      this.notify();
    }
  }

  undo() {
    if (!this.canUndo() || this.isExecuting) return false;

    const command = this.undoStack.pop();
    this.isExecuting = true;
    try {
      command.undo();
      this.redoStack.push(command);
    } finally {
      this.isExecuting = false;
      this.notify();
    }
    return true;
  }

  redo() {
    if (!this.canRedo() || this.isExecuting) return false;

    const command = this.redoStack.pop();
    this.isExecuting = true;
    try {
      command.execute();
      this.undoStack.push(command);
    } finally {
      this.isExecuting = false;
      this.notify();
    }
    return true;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  getLastCommand() {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }
}
