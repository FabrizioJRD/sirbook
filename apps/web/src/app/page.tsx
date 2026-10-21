'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  DigitalNotebook,
  NotebookPage,
  PageBlock,
  PageOrientation,
  PageFormat,
  PaperPattern,
  ExcalidrawShapeType,
  LooseNote,
} from '@/types/notebook-engine';
import { exportFullNotebookToPdf } from '@/lib/pdf-export';
import {
  fetchFoldersFromDB,
  saveFolderToDB,
  deleteFolderFromDB,
  fetchLooseNotesFromDB,
  saveLooseNoteToDB,
  deleteLooseNoteFromDB,
  AUTH_TOKEN_KEY,
} from '@/lib/notebook-storage';
import {
  splitBlockNode,
  removeBlockNode,
  updateSplitRatio,
} from '@/lib/tiling-utils';
import NotebooksGallery from '@/components/notebook/NotebooksGallery';
import NotebookToolbar, { CanvasTool } from '@/components/notebook/NotebookToolbar';
import BookPageFlipContainer from '@/components/notebook/BookPageFlipContainer';
import PageThumbnailsDrawer from '@/components/notebook/PageThumbnailsDrawer';
import ZoomControllerDock from '@/components/notebook/ZoomControllerDock';
import ExcalidrawAIPrompt from '@/components/notebook/ExcalidrawAIPrompt';
import AuthModal from '@/components/auth/AuthModal';
import { LoadingScreen } from '@/components/ui/CssLoader6';

const DEFAULT_BLANK_PAGE: NotebookPage = {
  id: 'blank-page-1',
  pageNumber: 1,
  subjectTopic: 'Página en Blanco',
  paperPattern: 'grid',
  pageFormat: 'a4',
  stickers: [],
  tilingRoot: { id: 'root', type: 'leaf', blockId: 'blk-init' },
  blocks: {},
  shapes: [],
  drawingStrokes: [],
  textElements: [],
  shapeElements: [],
};

const DEFAULT_EMPTY_NOTEBOOK: DigitalNotebook = {
  id: 'blank-notebook',
  title: 'Mi Primer Cuaderno',
  subject: 'General',
  coverColor: '#059669',
  coverTheme: 'emerald-study',
  icon: '📓',
  orientation: 'vertical',
  lastActivePageIndex: 0,
  pages: [DEFAULT_BLANK_PAGE],
  asNotebook: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function DigitalNotebookPlatformPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<'gallery' | 'notebook'>('gallery');

  // Estado de Autenticación y Sesión Persistente (30 días)
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoadingDB, setIsLoadingDB] = useState(true);

  // 100% Base de datos real: inicializado en vacío
  const [notebooks, setNotebooks] = useState<DigitalNotebook[]>([]);
  const [looseNotes, setLooseNotes] = useState<LooseNote[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>('');
  const [activeLooseNoteId, setActiveLooseNoteId] = useState<string | null>(null);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [mode, setMode] = useState<'edit' | 'study'>('edit');
  const [orientation, setOrientation] = useState<PageOrientation>('vertical');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Zoom interactivo y Herramientas Samsung Notes / Excalidraw
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeTool, setActiveTool] = useState<CanvasTool>('pencil');
  const [activeColor, setActiveColor] = useState<string>('#2E2822');
  const [penSize, setPenSize] = useState<number>(3);
  const [activeShapeType, setActiveShapeType] = useState<ExcalidrawShapeType>('rectangle');
  const [isAIPromptOpen, setIsAIPromptOpen] = useState<boolean>(false);

  // Undo / Redo History Stack per active page
  const [historyStack, setHistoryStack] = useState<NotebookPage[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoActionRef = useRef<boolean>(false);
  const autoSaveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Función para cargar los datos reales desde PostgreSQL
  const loadDatabaseData = useCallback(async () => {
    setIsLoadingDB(true);
    try {
      const [foldersData, notesData] = await Promise.all([
        fetchFoldersFromDB().catch(() => []),
        fetchLooseNotesFromDB().catch(() => []),
      ]);
      setNotebooks(foldersData);
      setLooseNotes(notesData);
      if (foldersData.length > 0) {
        setActiveNotebookId(foldersData[0].id);
        setActivePageIndex(foldersData[0].lastActivePageIndex || 0);
        setOrientation(foldersData[0].orientation || 'vertical');
      }
    } catch (err) {
      console.error('Error cargando datos de la BD:', err);
    } finally {
      setIsLoadingDB(false);
    }
  }, []);

  // 1. Verificación de Sesión Persistente al cargar la web
  useEffect(() => {
    setIsMounted(true);

    const checkSessionAndLoad = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
      if (!token) {
        // No hay token guardado: abrir modal de inicio de sesión
        setIsAuthModalOpen(true);
        setIsLoadingDB(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            setIsAuthModalOpen(false);
            // Cargar datos 100% reales de la BD
            await loadDatabaseData();
          } else {
            setIsAuthModalOpen(true);
          }
        } else {
          // Token expirado o inválido
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setIsAuthModalOpen(true);
        }
      } catch (err) {
        console.warn('Error al verificar sesión persistente:', err);
        setIsAuthModalOpen(true);
      } finally {
        setIsLoadingDB(false);
      }
    };

    checkSessionAndLoad();

    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'notebook') {
      setView('notebook');
    }
  }, [loadDatabaseData]);

  // Manejador de Login / Registro Exitoso
  const handleAuthSuccess = async (user: any, token: string) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    await loadDatabaseData();
  };

  // Manejador de Cierre de Sesión Explícito
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      document.cookie = 'sirbook_auth_token=; Max-Age=0; path=/;';
    }
    setCurrentUser(null);
    setNotebooks([]);
    setLooseNotes([]);
    setView('gallery');
    setIsAuthModalOpen(true);
  };

  // Cuaderno y Página activa (soporte unificado para cuadernos y notas sueltas)
  const activeNotebook: DigitalNotebook = useMemo(() => {
    if (activeLooseNoteId) {
      const found = looseNotes.find((n) => n.id === activeLooseNoteId);
      if (found) {
        return {
          id: found.id,
          title: found.title,
          description: found.subject || 'Nota suelta',
          subject: found.subject || 'General',
          coverColor: '#00A82D',
          coverTheme: 'emerald-study',
          icon: '📝',
          orientation: 'vertical',
          lastActivePageIndex: 0,
          pages: [found.page],
          asNotebook: false,
          created_at: found.created_at,
          updated_at: found.updated_at,
        };
      }
    }
    const foundNb = notebooks.find((nb) => nb.id === activeNotebookId);
    if (foundNb) return foundNb;
    if (notebooks.length > 0) return notebooks[0];
    return DEFAULT_EMPTY_NOTEBOOK;
  }, [activeLooseNoteId, looseNotes, notebooks, activeNotebookId]);

  const activePage: NotebookPage =
    activeNotebook?.pages?.[activePageIndex] ||
    activeNotebook?.pages?.[0] ||
    DEFAULT_BLANK_PAGE;

  // Inicializar historial de Undo/Redo cuando cambia de página o cuaderno
  useEffect(() => {
    if (activePage && !isUndoRedoActionRef.current) {
      setHistoryStack([JSON.parse(JSON.stringify(activePage))]);
      setHistoryIndex(0);
    }
    isUndoRedoActionRef.current = false;
  }, [activeNotebookId, activePageIndex]);

  // Helper para registrar un nuevo estado en el historial de Deshacer
  const pushToHistory = useCallback((newPageState: NotebookPage) => {
    setHistoryStack((prevStack) => {
      const trimmed = prevStack.slice(0, historyIndex + 1);
      const nextStack = [...trimmed, JSON.parse(JSON.stringify(newPageState))];
      if (nextStack.length > 50) return nextStack.slice(nextStack.length - 50);
      return nextStack;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Actualizar página activa y persistir en tiempo real a PostgreSQL con debounce
  const updateActivePage = useCallback(
    (updatedPartial: Partial<NotebookPage>, skipHistory = false) => {
      if (activeLooseNoteId) {
        setLooseNotes((prevNotes) =>
          prevNotes.map((n) => {
            if (n.id !== activeLooseNoteId) return n;
            const merged = { ...n.page, ...updatedPartial };
            if (!skipHistory && !isUndoRedoActionRef.current) {
              pushToHistory(merged);
            }
            const updatedNote: LooseNote = {
              ...n,
              page: merged,
              updated_at: new Date().toISOString(),
            };

            // Auto-guardado debounced en PostgreSQL
            if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
            autoSaveDebounceRef.current = setTimeout(() => {
              saveLooseNoteToDB(updatedNote).catch((e) =>
                console.error('Error auto-guardando nota en BD:', e)
              );
            }, 800);

            return updatedNote;
          })
        );
        return;
      }

      setNotebooks((prevNotebooks) =>
        prevNotebooks.map((nb) => {
          if (nb.id !== activeNotebookId) return nb;
          const updatedPages = nb.pages.map((p, idx) => {
            if (idx !== activePageIndex) return p;
            const merged = { ...p, ...updatedPartial };
            if (!skipHistory && !isUndoRedoActionRef.current) {
              pushToHistory(merged);
            }
            return merged;
          });
          const updatedFolder: DigitalNotebook = {
            ...nb,
            pages: updatedPages,
            updated_at: new Date().toISOString(),
          };

          // Auto-guardado debounced en PostgreSQL
          if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
          autoSaveDebounceRef.current = setTimeout(() => {
            saveFolderToDB(updatedFolder).catch((e) =>
              console.error('Error auto-guardando cuaderno en BD:', e)
            );
          }, 800);

          return updatedFolder;
        })
      );
    },
    [activeLooseNoteId, activeNotebookId, activePageIndex, pushToHistory]
  );

  // Deshacer (Undo)
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoActionRef.current = true;
      const targetState = historyStack[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      updateActivePage(targetState, true);
    }
  }, [historyIndex, historyStack, updateActivePage]);

  // Rehacer (Redo)
  const handleRedo = useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      isUndoRedoActionRef.current = true;
      const targetState = historyStack[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      updateActivePage(targetState, true);
    }
  }, [historyIndex, historyStack, updateActivePage]);

  // --- Controles de Zoom ---
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  // Atajos de teclado globales
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isCtrlOrMeta) {
        if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
          e.preventDefault();
          handleZoomIn();
          return;
        } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          handleZoomOut();
          return;
        } else if (e.key === '0' || e.code === 'Numpad0') {
          e.preventDefault();
          handleResetZoom();
          return;
        } else if (e.key.toLowerCase() === 'j') {
          e.preventDefault();
          setIsAIPromptOpen((prev) => !prev);
          return;
        }
      }

      if (isTyping) return;

      if (isCtrlOrMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCtrlOrMeta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handleUndo, handleRedo, handleZoomIn, handleZoomOut, handleResetZoom]);

  // --- Manejo del Tiling Engine (Splits y Bloques) ---
  const handleSplitRight = (targetBlockId: string) => {
    if (!activePage) return;
    const newBlockId = `blk-${Date.now()}`;
    const newTilingRoot = splitBlockNode(
      activePage.tilingRoot,
      targetBlockId,
      newBlockId,
      'horizontal'
    );
    const newBlock: PageBlock = {
      id: newBlockId,
      type: 'concept',
      title: 'Nuevo Concepto',
      content: {
        modo: 'concepto',
        titulo: 'Nuevo Concepto',
        definicion_corta: 'Haz clic para editar este apunte...',
        puntos_clave: [],
        aplicaciones: [],
      },
    };
    updateActivePage({
      tilingRoot: newTilingRoot,
      blocks: {
        ...activePage.blocks,
        [newBlockId]: newBlock,
      },
    });
  };

  const handleSplitBottom = (targetBlockId: string) => {
    if (!activePage) return;
    const newBlockId = `blk-${Date.now()}`;
    const newTilingRoot = splitBlockNode(
      activePage.tilingRoot,
      targetBlockId,
      newBlockId,
      'vertical'
    );
    const newBlock: PageBlock = {
      id: newBlockId,
      type: 'sticky',
      title: 'Nota Rápida',
      content: {
        titulo: '📌 Nota Adicional',
        texto: 'Anotación complementaria...',
        color: 'bg-amber-100 text-amber-900 border-amber-300 shadow-md',
      },
    };
    updateActivePage({
      tilingRoot: newTilingRoot,
      blocks: {
        ...activePage.blocks,
        [newBlockId]: newBlock,
      },
    });
  };

  const handleRemoveBlock = (blockIdToRemove: string) => {
    if (!activePage) return;
    const blockKeys = Object.keys(activePage.blocks);
    if (blockKeys.length <= 1) return;
    const newTilingRoot = removeBlockNode(activePage.tilingRoot, blockIdToRemove);
    if (!newTilingRoot) return;
    const nextBlocks = { ...activePage.blocks };
    delete nextBlocks[blockIdToRemove];
    updateActivePage({
      tilingRoot: newTilingRoot,
      blocks: nextBlocks,
    });
  };

  const handleUpdateBlock = (blockId: string, updatedPartial: Partial<PageBlock>) => {
    if (!activePage || !activePage.blocks[blockId]) return;
    const current = activePage.blocks[blockId];
    updateActivePage({
      blocks: {
        ...activePage.blocks,
        [blockId]: { ...current, ...updatedPartial },
      },
    });
  };

  const handleInsertBlock = (newBlock: PageBlock) => {
    if (!activePage) return;
    updateActivePage({
      blocks: {
        ...activePage.blocks,
        [newBlock.id]: newBlock,
      },
    });
  };

  const handleUpdateRatio = (splitId: string, newRatio: number) => {
    if (!activePage) return;
    const newTilingRoot = updateSplitRatio(activePage.tilingRoot, splitId, newRatio);
    updateActivePage({ tilingRoot: newTilingRoot });
  };

  // --- Navegación y Gestión de Páginas del Cuaderno ---
  const handlePageChange = (newIndex: number) => {
    if (!activeNotebook || newIndex < 0 || newIndex >= activeNotebook.pages.length) return;
    setActivePageIndex(newIndex);
    setNotebooks((prev) =>
      prev.map((nb) =>
        nb.id === activeNotebookId
          ? { ...nb, lastActivePageIndex: newIndex, updated_at: new Date().toISOString() }
          : nb
      )
    );
  };

  const handleAddPage = async () => {
    if (!activeNotebook) return;
    const newPageNum = activeNotebook.pages.length + 1;
    const newBlockId = `blk-${Date.now()}`;
    const newPage: NotebookPage = {
      id: `page-${Date.now()}`,
      pageNumber: newPageNum,
      subjectTopic: `Hoja ${newPageNum}`,
      paperPattern: activePage?.paperPattern || 'grid',
      pageFormat: activePage?.pageFormat || 'a4',
      stickers: [],
      tilingRoot: { id: `root-${Date.now()}`, type: 'leaf', blockId: newBlockId },
      blocks: {
        [newBlockId]: {
          id: newBlockId,
          type: 'text',
          title: `Apunte de la Hoja ${newPageNum}`,
          content: 'Escribe tus apuntes o genera conceptos con IA...',
          fontSize: 'base',
          fontFamily: 'sans',
          cardColor: '#FAF7F2',
          textColor: '#2E2822',
        },
      },
      shapes: [],
      drawingStrokes: [],
      textElements: [],
      shapeElements: [],
    };

    const nextPages = [...activeNotebook.pages, newPage];
    const newIndex = nextPages.length - 1;

    const updatedNb = {
      ...activeNotebook,
      pages: nextPages,
      lastActivePageIndex: newIndex,
      updated_at: new Date().toISOString(),
    };

    setNotebooks((prev) => prev.map((nb) => (nb.id === activeNotebookId ? updatedNb : nb)));
    setActivePageIndex(newIndex);

    // Persistir en PostgreSQL
    try {
      await saveFolderToDB(updatedNb);
    } catch (err) {
      console.error('Error al persistir nueva página en BD:', err);
    }
  };

  const handleDeletePage = async (indexToDelete: number) => {
    if (!activeNotebook || activeNotebook.pages.length <= 1) return;
    const nextPages = activeNotebook.pages.filter((_, idx) => idx !== indexToDelete);
    const nextIndex = Math.max(0, Math.min(activePageIndex, nextPages.length - 1));

    const updatedNb = {
      ...activeNotebook,
      pages: nextPages,
      lastActivePageIndex: nextIndex,
      updated_at: new Date().toISOString(),
    };

    setNotebooks((prev) => prev.map((nb) => (nb.id === activeNotebookId ? updatedNb : nb)));
    setActivePageIndex(nextIndex);

    try {
      await saveFolderToDB(updatedNb);
    } catch (err) {
      console.error('Error al borrar página en BD:', err);
    }
  };

  const handleDuplicatePage = async (indexToDuplicate: number) => {
    if (!activeNotebook) return;
    const source = activeNotebook.pages[indexToDuplicate];
    const clone: NotebookPage = JSON.parse(JSON.stringify(source));
    clone.id = `page-${Date.now()}`;
    clone.pageNumber = activeNotebook.pages.length + 1;
    clone.subjectTopic = `${clone.subjectTopic} (Copia)`;

    const nextPages = [...activeNotebook.pages, clone];
    const newIndex = nextPages.length - 1;

    const updatedNb = {
      ...activeNotebook,
      pages: nextPages,
      lastActivePageIndex: newIndex,
      updated_at: new Date().toISOString(),
    };

    setNotebooks((prev) => prev.map((nb) => (nb.id === activeNotebookId ? updatedNb : nb)));
    setActivePageIndex(newIndex);

    try {
      await saveFolderToDB(updatedNb);
    } catch (err) {
      console.error('Error al duplicar página en BD:', err);
    }
  };

  // --- Acciones de la Galería conectadas 100% a PostgreSQL ---
  const handleSelectNotebook = (id: string) => {
    const target = notebooks.find((nb) => nb.id === id);
    if (!target) return;
    setActiveLooseNoteId(null);
    setActiveNotebookId(id);
    const targetPageIndex =
      typeof target.lastActivePageIndex === 'number' &&
      target.lastActivePageIndex < target.pages.length
        ? target.lastActivePageIndex
        : 0;
    setActivePageIndex(targetPageIndex);
    setOrientation(target.orientation || 'vertical');
    setView('notebook');
  };

  const handleSelectLooseNote = (note: LooseNote) => {
    setActiveLooseNoteId(note.id);
    setActivePageIndex(0);
    setView('notebook');
  };

  const handleCreateNotebook = async (
    newNbData: Omit<DigitalNotebook, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const saved = await saveFolderToDB({
        ...newNbData,
        title: newNbData.title,
      });
      setNotebooks((prev) => [saved, ...prev]);
      setActiveLooseNoteId(null);
      setActiveNotebookId(saved.id);
      setActivePageIndex(0);
      setView('notebook');
    } catch (err) {
      console.error('Error al crear cuaderno en BD:', err);
    }
  };

  const handleUpdateNotebook = async (updated: DigitalNotebook) => {
    setNotebooks((prev) => prev.map((nb) => (nb.id === updated.id ? updated : nb)));
    try {
      await saveFolderToDB(updated);
    } catch (err) {
      console.error('Error al actualizar cuaderno en BD:', err);
    }
  };

  const handleDeleteNotebook = async (idToDelete: string) => {
    const remaining = notebooks.filter((nb) => nb.id !== idToDelete);
    setNotebooks(remaining);
    if (activeNotebookId === idToDelete && remaining.length > 0) {
      setActiveNotebookId(remaining[0].id);
      setActivePageIndex(0);
    }
    try {
      await deleteFolderFromDB(idToDelete);
    } catch (err) {
      console.error('Error al eliminar cuaderno en BD:', err);
    }
  };

  const handleCreateLooseNote = async (
    noteData: Omit<LooseNote, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const saved = await saveLooseNoteToDB({
        ...noteData,
        title: noteData.title,
      });
      setLooseNotes((prev) => [saved, ...prev]);
      setActiveLooseNoteId(saved.id);
      setActivePageIndex(0);
      setView('notebook');
    } catch (err) {
      console.error('Error al crear nota en BD:', err);
    }
  };

  const handleUpdateLooseNote = async (updated: LooseNote) => {
    setLooseNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    try {
      await saveLooseNoteToDB(updated);
    } catch (err) {
      console.error('Error al actualizar nota en BD:', err);
    }
  };

  const handleDeleteLooseNote = async (idToDelete: string) => {
    setLooseNotes((prev) => prev.filter((n) => n.id !== idToDelete));
    try {
      await deleteLooseNoteFromDB(idToDelete);
    } catch (err) {
      console.error('Error al eliminar nota en BD:', err);
    }
  };

  const handleMoveNoteToFolder = async (noteId: string, folderId: string | null) => {
    const target = looseNotes.find((n) => n.id === noteId);
    if (!target) return;

    if (folderId) {
      // Mover a folder en base de datos
      try {
        await saveLooseNoteToDB({ id: noteId, folderId, title: target.title });
        await loadDatabaseData();
      } catch (err) {
        console.error('Error al mover nota a carpeta en BD:', err);
      }
    } else {
      try {
        await saveLooseNoteToDB({ id: noteId, folderId: null, title: target.title });
        await loadDatabaseData();
      } catch (err) {
        console.error('Error al desasociar nota en BD:', err);
      }
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleApplyPageFormat = ({
    orientation: newOrientation,
    format: newFormat,
    pattern: newPattern,
    applyToAll,
  }: {
    orientation: PageOrientation;
    format: PageFormat;
    pattern: PaperPattern;
    applyToAll: boolean;
  }) => {
    setOrientation(newOrientation);

    if (applyToAll) {
      setNotebooks((prev) =>
        prev.map((nb) => {
          if (nb.id !== activeNotebookId) return nb;
          const updated = {
            ...nb,
            orientation: newOrientation,
            pages: nb.pages.map((p) => ({
              ...p,
              pageFormat: newFormat,
              paperPattern: newPattern,
            })),
            updated_at: new Date().toISOString(),
          };
          saveFolderToDB(updated).catch(() => {});
          return updated;
        })
      );
    } else {
      updateActivePage({
        pageFormat: newFormat,
        paperPattern: newPattern,
      });
      setNotebooks((prev) =>
        prev.map((nb) =>
          nb.id === activeNotebookId ? { ...nb, orientation: newOrientation } : nb
        )
      );
    }
  };

  const handleExportPdf = async () => {
    if (!activeNotebook || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const sheetElement = document.getElementById('active-notebook-sheet');
      await exportFullNotebookToPdf(activeNotebook, sheetElement);
    } catch (err) {
      console.error('Error al exportar cuaderno:', err);
      alert('Hubo un problema al exportar el cuaderno a PDF. Inténtalo de nuevo.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isMounted || (isLoadingDB && currentUser)) {
    return (
      <LoadingScreen
        message="Iniciando Sirbook..."
        submessage="Conectando con PostgreSQL (Docker)..."
      />
    );
  }

  return (
    <>
      {/* Pantalla de Carga durante Exportación de PDF */}
      {isExportingPdf && (
        <LoadingScreen
          message="Exportando Cuaderno a PDF..."
          submessage="Renderizando páginas y vectores..."
        />
      )}

      {/* Modal de Autenticación Persistente */}
      <AuthModal
        isOpen={isAuthModalOpen && !currentUser}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Vista 1: Galería Principal de Cuadernos y Notas Sueltas */}
      {view === 'gallery' ? (
        <NotebooksGallery
          notebooks={notebooks}
          looseNotes={looseNotes}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSelectNotebook={handleSelectNotebook}
          onSelectLooseNote={handleSelectLooseNote}
          onCreateNotebook={handleCreateNotebook}
          onUpdateNotebook={handleUpdateNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onCreateLooseNote={handleCreateLooseNote}
          onUpdateLooseNote={handleUpdateLooseNote}
          onDeleteLooseNote={handleDeleteLooseNote}
          onMoveNoteToFolder={handleMoveNoteToFolder}
        />
      ) : (
        /* Vista 2: Cuaderno Activo (Modo Edición / Estudio 3D con Tiling y Pasado de Páginas) */
        <div className="flex flex-col h-screen w-screen bg-[#EFEAE2] overflow-hidden font-sans">
          {/* 1. Barra de Herramientas Superior Samsung Notes One UI */}
          <NotebookToolbar
            notebook={activeNotebook}
            activePageIndex={activePageIndex}
            totalPages={activeNotebook.pages.length}
            mode={mode}
            orientation={orientation}
            pageFormat={activePage.pageFormat || 'a4'}
            paperPattern={activePage.paperPattern || 'grid'}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < historyStack.length - 1}
            isExportingPdf={isExportingPdf}
            activeTool={activeTool}
            activeColor={activeColor}
            penSize={penSize}
            onSelectTool={setActiveTool}
            onSelectColor={setActiveColor}
            onSelectPenSize={setPenSize}
            activeShapeType={activeShapeType}
            onSelectShapeType={setActiveShapeType}
            onOpenAIPrompt={() => setIsAIPromptOpen(true)}
            onBackToGallery={() => setView('gallery')}
            onToggleMode={() => setMode((prev) => (prev === 'edit' ? 'study' : 'edit'))}
            onToggleOrientation={() =>
              setOrientation((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'))
            }
            onSelectPattern={(pattern) => updateActivePage({ paperPattern: pattern })}
            onApplyPageFormat={handleApplyPageFormat}
            onExportPdf={handleExportPdf}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onOpenThumbnailsDrawer={() => setIsDrawerOpen(true)}
            onAddPage={handleAddPage}
          />

          {/* 2. Contenedor con Animación 3D de Paso de Página, Gestos Táctiles y Zoom */}
          <BookPageFlipContainer
            activePage={activePage}
            pageIndex={activePageIndex}
            totalPages={activeNotebook.pages.length}
            orientation={orientation}
            mode={mode}
            notebookTitle={activeNotebook.title}
            zoomLevel={zoomLevel}
            activeTool={activeTool}
            activeColor={activeColor}
            penSize={penSize}
            activeShapeType={activeShapeType}
            onOpenAIPrompt={() => setIsAIPromptOpen(true)}
            onPageChange={handlePageChange}
            onUpdatePage={updateActivePage}
            onSplitRight={handleSplitRight}
            onSplitBottom={handleSplitBottom}
            onRemoveBlock={handleRemoveBlock}
            onUpdateBlock={handleUpdateBlock}
            onInsertBlock={handleInsertBlock}
            onUpdateRatio={handleUpdateRatio}
            onAddPage={handleAddPage}
            onToggleMode={() => setMode((prev) => (prev === 'edit' ? 'study' : 'edit'))}
          />

          {/* 3. Dock Flotante de Control de Zoom (Samsung Notes / Excalidraw Style) */}
          <ZoomControllerDock
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
          />

          {/* 4. Barra de Generación de Contenido con IA Estilo Excalidraw */}
          <ExcalidrawAIPrompt
            isOpen={isAIPromptOpen}
            notebookTitle={activeNotebook.title}
            onClose={() => setIsAIPromptOpen(false)}
            onInsertGenerated={handleInsertBlock}
          />

          {/* 5. Panel Lateral Desplegable con Miniaturas de todas las Hojas */}
          <PageThumbnailsDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            pages={activeNotebook.pages}
            activePageIndex={activePageIndex}
            onSelectPage={(index) => {
              handlePageChange(index);
              setIsDrawerOpen(false);
            }}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onDuplicatePage={handleDuplicatePage}
          />
        </div>
      )}
    </>
  );
}
