import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  createDefaultProject,
  createElement,
  createPage,
  findElementById,
  findParentAndIndex,
  cloneElementWithNewIds,
} from '../schema/projectSchema.js';
import { CommandManager } from './commandManager.js';
import { saveProject, loadActiveProject } from '../storage.js';

export const commandManager = new CommandManager();

// Boshlang'ich loyiha: saqlangan yoki yangi
const initialProject = loadActiveProject() || createDefaultProject('Mening Yangi Saytim');
if (!initialProject.id) {
  initialProject.id = 'proj_' + Date.now().toString(36);
}

export const DEVICE_SIZES = {
  desktop: { width: 1200, name: 'Desktop (Kompyuter)' },
  tablet: { width: 768, name: 'Planshet' },
  mobile: { width: 390, name: 'Mobil' },
};

export const useEditorStore = create(
  immer((set, get) => {
    // Buyruqlar menejeridan xabardor bo'lish
    commandManager.subscribe(() => {
      set((state) => {
        state.canUndo = commandManager.canUndo();
        state.canRedo = commandManager.canRedo();
      });
    });

    return {
      // Asosiy ma'lumotlar
      project: initialProject,
      activePageId: initialProject.sahifalar[0]?.id || null,
      selectedId: null,
      selectedIds: [],
      hoveredId: null,
      activeDevice: 'desktop', // 'desktop' | 'tablet' | 'mobile'
      zoom: 1,
      previewMode: false,
      codeModalOpen: false,
      templatesModalOpen: false,
      shortcutsModalOpen: false,
      activeTab: 'dizayn', // 'dizayn' | 'qatlamlar' | 'komponentlar' | 'sahifalar' | 'harakatlar' | 'animatsiya'
      activeState: 'default', // 'default' | 'hover' | 'active' | 'focus'

      // Undo/Redo ko'rsatkichlari
      canUndo: false,
      canRedo: false,

      // Bufer (clipboard)
      clipboard: null,

      // Drag / Resize vaqtinchalik holatlari
      dragState: null,
      resizeState: null,

      // === PROYEKT VA SAHIFA AMALLARI ===
      setProject: (newProject) => {
        set((state) => {
          state.project = newProject;
          state.activePageId = newProject.sahifalar[0]?.id || null;
          state.selectedId = null;
          state.selectedIds = [];
        });
        saveProject(newProject);
        commandManager.clear();
      },

      setActivePageId: (pageId) => {
        set((state) => {
          state.activePageId = pageId;
          state.selectedId = null;
          state.selectedIds = [];
        });
      },

      addPage: (nom = 'Yangi sahifa', slug = null) => {
        const pageSlug = slug || `sahifa-${Date.now().toString(36).slice(-4)}`;
        const newPage = createPage({ nom, slug: pageSlug });
        const oldPages = [...get().project.sahifalar];

        const cmd = {
          nom: `Yangi sahifa qo‘shildi: ${nom}`,
          execute: () => {
            set((state) => {
              state.project.sahifalar.push(newPage);
              state.activePageId = newPage.id;
            });
            saveProject(get().project);
          },
          undo: () => {
            set((state) => {
              state.project.sahifalar = oldPages;
              state.activePageId = oldPages[0]?.id || null;
            });
            saveProject(get().project);
          },
        };
        commandManager.execute(cmd);
      },

      deletePage: (pageId) => {
        const currentPages = get().project.sahifalar;
        if (currentPages.length <= 1) {
          console.warn('Oxirgi sahifani o‘chirib bo‘lmaydi');
          return;
        }
        const pageIndex = currentPages.findIndex((p) => p.id === pageId);
        const deletedPage = currentPages[pageIndex];
        const nextActiveId =
          pageIndex === 0 ? currentPages[1].id : currentPages[pageIndex - 1].id;

        const cmd = {
          nom: `Sahifa o‘chirildi: ${deletedPage.nom}`,
          execute: () => {
            set((state) => {
              state.project.sahifalar = state.project.sahifalar.filter((p) => p.id !== pageId);
              state.activePageId = nextActiveId;
            });
            saveProject(get().project);
          },
          undo: () => {
            set((state) => {
              state.project.sahifalar.splice(pageIndex, 0, deletedPage);
              state.activePageId = pageId;
            });
            saveProject(get().project);
          },
        };
        commandManager.execute(cmd);
      },

      updateProjectTokens: (tokens) => {
        const oldTokens = JSON.parse(JSON.stringify(get().project.sozlamalar.tokenlar));
        const newTokens = { ...oldTokens, ...tokens };

        const cmd = {
          nom: 'Global tokenlar yangilandi',
          execute: () => {
            set((state) => {
              state.project.sozlamalar.tokenlar = newTokens;
            });
            saveProject(get().project);
          },
          undo: () => {
            set((state) => {
              state.project.sozlamalar.tokenlar = oldTokens;
            });
            saveProject(get().project);
          },
        };
        commandManager.execute(cmd);
      },

      // === SELEKTSION AMALLAR ===
      setSelectedId: (id, multi = false) => {
        set((state) => {
          if (!id) {
            state.selectedId = null;
            state.selectedIds = [];
            return;
          }
          if (multi) {
            if (state.selectedIds.includes(id)) {
              state.selectedIds = state.selectedIds.filter((x) => x !== id);
              state.selectedId = state.selectedIds[state.selectedIds.length - 1] || null;
            } else {
              state.selectedIds.push(id);
              state.selectedId = id;
            }
          } else {
            state.selectedId = id;
            state.selectedIds = [id];
          }
        });
      },

      setHoveredId: (id) => {
        set((state) => {
          state.hoveredId = id;
        });
      },

      setActiveDevice: (device) => {
        set((state) => {
          state.activeDevice = device;
        });
      },

      setZoom: (zoom) => {
        set((state) => {
          state.zoom = Math.min(Math.max(zoom, 0.25), 2.0);
        });
      },

      setPreviewMode: (mode) => {
        set((state) => {
          state.previewMode = mode;
          state.selectedId = null;
          state.selectedIds = [];
        });
      },

      setActiveTab: (tab) => {
        set((state) => {
          state.activeTab = tab;
        });
      },

      setActiveState: (pseudoState) => {
        set((state) => {
          state.activeState = pseudoState;
        });
      },

      setModalOpen: (modalName, isOpen) => {
        set((state) => {
          state[modalName] = isOpen;
        });
      },

      // === ELEMENT DARAHTI AMALLARI (COMMAND BILAN) ===
      getActivePageRoot: () => {
        const { project, activePageId } = get();
        const page = project.sahifalar.find((p) => p.id === activePageId);
        return page ? page.ildiz : null;
      },

      addElement: (elementData, parentId = null, targetIndex = -1) => {
        const root = get().getActivePageRoot();
        if (!root) return;

        let targetParentId = parentId;
        if (!targetParentId) {
          // Tanlangan element bo'lsa unga yoki uning otasiga qo'shish
          const selId = get().selectedId;
          if (selId) {
            const selEl = findElementById(root, selId);
            if (selEl && ['box', 'section', 'container', 'page-root'].includes(selEl.tur)) {
              targetParentId = selId;
            } else {
              const pInfo = findParentAndIndex(root, selId);
              targetParentId = pInfo ? pInfo.parent.id : root.id;
            }
          } else {
            targetParentId = root.id;
          }
        }

        const newEl = createElement(elementData);

        const cmd = {
          nom: `Element qo‘shildi: ${newEl.nom}`,
          execute: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const parent = findElementById(currentRoot, targetParentId);
              if (parent) {
                if (!Array.isArray(parent.bolalar)) parent.bolalar = [];
                if (targetIndex >= 0 && targetIndex <= parent.bolalar.length) {
                  parent.bolalar.splice(targetIndex, 0, newEl);
                } else {
                  parent.bolalar.push(newEl);
                }
              }
              state.selectedId = newEl.id;
              state.selectedIds = [newEl.id];
            });
            saveProject(get().project);
          },
          undo: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const pInfo = findParentAndIndex(currentRoot, newEl.id);
              if (pInfo) {
                pInfo.parent.bolalar.splice(pInfo.index, 1);
              }
              state.selectedId = targetParentId;
              state.selectedIds = [targetParentId];
            });
            saveProject(get().project);
          },
        };

        commandManager.execute(cmd);
      },

      deleteElement: (elementId = null) => {
        const idToDelete = elementId || get().selectedId;
        const root = get().getActivePageRoot();
        if (!idToDelete || !root || idToDelete === root.id) {
          return; // Ildizni o'chirib bo'lmaydi
        }

        const pInfo = findParentAndIndex(root, idToDelete);
        if (!pInfo) return;

        const { parent, index } = pInfo;
        const deletedElement = parent.bolalar[index];
        const parentId = parent.id;

        const cmd = {
          nom: `Element o‘chirildi: ${deletedElement.nom}`,
          execute: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const info = findParentAndIndex(currentRoot, idToDelete);
              if (info) {
                info.parent.bolalar.splice(info.index, 1);
              }
              state.selectedId = parentId;
              state.selectedIds = [parentId];
            });
            saveProject(get().project);
          },
          undo: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const p = findElementById(currentRoot, parentId);
              if (p) {
                p.bolalar.splice(index, 0, deletedElement);
              }
              state.selectedId = idToDelete;
              state.selectedIds = [idToDelete];
            });
            saveProject(get().project);
          },
        };

        commandManager.execute(cmd);
      },

      updateElementProps: (elementId, newProps, nom = 'Atributlar yangilandi') => {
        const root = get().getActivePageRoot();
        const element = findElementById(root, elementId);
        if (!element) return;

        const oldProps = JSON.parse(JSON.stringify(element.props || {}));
        const mergedProps = { ...oldProps, ...newProps };

        const cmd = {
          nom,
          execute: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const el = findElementById(currentRoot, elementId);
              if (el) el.props = mergedProps;
            });
            saveProject(get().project);
          },
          undo: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const el = findElementById(currentRoot, elementId);
              if (el) el.props = oldProps;
            });
            saveProject(get().project);
          },
        };

        commandManager.execute(cmd);
      },

      updateElementStyle: (elementId, styleUpdates, options = {}) => {
        const { device = get().activeDevice, pseudoState = get().activeState } = options;
        const root = get().getActivePageRoot();
        const element = findElementById(root, elementId);
        if (!element) return;

        const oldUslub = JSON.parse(JSON.stringify(element.uslub));

        // Yangi uslub ob'ektini hisoblash
        const newUslub = JSON.parse(JSON.stringify(element.uslub));
        if (pseudoState && pseudoState !== 'default') {
          if (!newUslub.holatlar) newUslub.holatlar = {};
          if (!newUslub.holatlar[pseudoState]) newUslub.holatlar[pseudoState] = {};
          newUslub.holatlar[pseudoState] = {
            ...newUslub.holatlar[pseudoState],
            ...styleUpdates,
          };
        } else {
          const deviceKey = device === 'desktop' ? 'asosiy' : device;
          newUslub[deviceKey] = {
            ...newUslub[deviceKey],
            ...styleUpdates,
          };
        }

        const cmd = {
          nom: `Uslub yangilandi (${device}, ${pseudoState})`,
          execute: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const el = findElementById(currentRoot, elementId);
              if (el) el.uslub = newUslub;
            });
            saveProject(get().project);
          },
          undo: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const el = findElementById(currentRoot, elementId);
              if (el) el.uslub = oldUslub;
            });
            saveProject(get().project);
          },
        };

        commandManager.execute(cmd);
      },

      moveElement: (elementId, newParentId, newIndex) => {
        const root = get().getActivePageRoot();
        const pInfo = findParentAndIndex(root, elementId);
        if (!pInfo) return;

        const oldParentId = pInfo.parent.id;
        const oldIndex = pInfo.index;

        if (oldParentId === newParentId && oldIndex === newIndex) return;

        const cmd = {
          nom: 'Element ko‘chirildi',
          execute: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const fromP = findParentAndIndex(currentRoot, elementId);
              if (!fromP) return;
              const [el] = fromP.parent.bolalar.splice(fromP.index, 1);
              const toP = findElementById(currentRoot, newParentId);
              if (toP) {
                if (!toP.bolalar) toP.bolalar = [];
                toP.bolalar.splice(newIndex, 0, el);
              }
            });
            saveProject(get().project);
          },
          undo: () => {
            set((state) => {
              const currentRoot = state.project.sahifalar.find(
                (p) => p.id === state.activePageId
              )?.ildiz;
              const fromP = findParentAndIndex(currentRoot, elementId);
              if (!fromP) return;
              const [el] = fromP.parent.bolalar.splice(fromP.index, 1);
              const toP = findElementById(currentRoot, oldParentId);
              if (toP) {
                toP.bolalar.splice(oldIndex, 0, el);
              }
            });
            saveProject(get().project);
          },
        };

        commandManager.execute(cmd);
      },

      duplicateElement: (elementId = null) => {
        const targetId = elementId || get().selectedId;
        const root = get().getActivePageRoot();
        if (!targetId || !root) return;

        const pInfo = findParentAndIndex(root, targetId);
        if (!pInfo) return;

        const original = pInfo.parent.bolalar[pInfo.index];
        const cloned = cloneElementWithNewIds(original);
        cloned.nom = `${cloned.nom} (Nusxa)`;

        get().addElement(cloned, pInfo.parent.id, pInfo.index + 1);
      },

      copyElement: (elementId = null) => {
        const targetId = elementId || get().selectedId;
        const root = get().getActivePageRoot();
        if (!targetId || !root) return;

        const el = findElementById(root, targetId);
        if (el) {
          set((state) => {
            state.clipboard = JSON.parse(JSON.stringify(el));
          });
        }
      },

      pasteElement: (targetParentId = null) => {
        const clip = get().clipboard;
        if (!clip) return;
        const cloned = cloneElementWithNewIds(clip);
        get().addElement(cloned, targetParentId);
      },

      undo: () => {
        commandManager.undo();
      },

      redo: () => {
        commandManager.redo();
      },
    };
  })
);
