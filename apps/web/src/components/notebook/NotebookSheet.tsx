'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  NotebookPage,
  PageBlock,
  PageOrientation,
  DrawingStroke,
  StrokePoint,
  ShapeElement,
  ExcalidrawShapeType,
} from '../../types/notebook-engine';
import { pointsToSvgPath, isPointNearStroke, isStrokeInBox } from '@/lib/canvas-drawing';
import ExcalidrawTextElement from './ExcalidrawTextElement';
import ExcalidrawDiagramElement from './ExcalidrawDiagramElement';
import ExcalidrawShapeElement from './ExcalidrawShapeElement';
import { Trash2 } from 'lucide-react';

interface NotebookSheetProps {
  page: NotebookPage;
  totalPages: number;
  orientation: PageOrientation;
  isStudyMode: boolean;
  notebookTitle?: string;
  zoomLevel?: number;
  activeTool?: 'select' | 'hand' | 'pencil' | 'text' | 'shape' | 'eraser' | 'ai';
  activeColor?: string;
  penSize?: number;
  activeShapeType?: ExcalidrawShapeType;
  onOpenAIPrompt?: () => void;
  onUpdatePage: (updated: Partial<NotebookPage>) => void;
  onSplitRight?: (blockId: string) => void;
  onSplitBottom?: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updated: Partial<PageBlock>) => void;
  onInsertBlock?: (block: PageBlock) => void;
  onUpdateRatio?: (splitId: string, newRatio: number) => void;
  onOpenAIAssist?: (blockId?: string) => void;
}

export const NotebookSheet: React.FC<NotebookSheetProps> = ({
  page,
  totalPages,
  orientation,
  isStudyMode,
  notebookTitle = 'Cuaderno',
  zoomLevel = 1.0,
  activeTool = 'pencil',
  activeColor = '#2E2822',
  penSize = 3,
  activeShapeType = 'rectangle',
  onOpenAIPrompt,
  onUpdatePage,
  onRemoveBlock,
  onUpdateBlock,
  onInsertBlock,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Estados de Dibujo con Pluma (Excalidraw / Samsung Notes Freehand)
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<StrokePoint[]>([]);

  // Estado para creación interactiva de formas (rectángulos, círculos, rombos, flechas, líneas)
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [shapePreview, setShapePreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Estado de Selección Múltiple y Edición de Texto
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set());
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Estado de Caja de Selección Múltiple Marquee (Arrastre en lienzo vacío)
  const [selectionMarquee, setSelectionMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Estado del Borrador Excalidraw con Cola de Cometa y Opacidad en Espera
  const [isErasing, setIsErasing] = useState(false);
  const [eraserTrail, setEraserTrail] = useState<Array<{ x: number; y: number; time: number }>>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  // Estado de Arrastre Libre de Elementos (Directo y Multi-elemento) con Aceleración por Hardware Directa
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const dragDeltaRef = useRef<{ dx: number; dy: number } | null>(null);
  const dragDOMElementsRef = useRef<
    Array<{
      id: string;
      el: HTMLElement | SVGElement;
      isSvg: boolean;
    }>
  >([]);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    initialPositions: Map<
      string,
      { type: 'block' | 'shape' | 'stroke'; x: number; y: number; points?: StrokePoint[] }
    >;
  } | null>(null);

  const isVertical = orientation === 'vertical';
  const currentPattern = page.paperPattern || 'grid';
  const currentFormat = page.pageFormat || 'a4';

  const patternClass =
    currentPattern === 'dots'
      ? 'notebook-paper-dots'
      : currentPattern === 'ruled'
      ? 'notebook-paper-ruled'
      : currentPattern === 'plain'
      ? 'notebook-paper-plain'
      : 'notebook-paper-grid';

  // Lista de bloques/elementos
  const blocksList = Object.values(page.blocks || {});
  const strokesList = page.drawingStrokes || [];
  const shapesList = page.shapeElements || [];

  // Límites dinámicos para el lienzo infinito
  const infiniteBounds = useMemo(() => {
    let maxX = 2600;
    let maxY = 2200;
    for (const b of blocksList) {
      const bx = (b.position?.x ?? 0) + (b.width ?? 320);
      const by = (b.position?.y ?? 0) + 200;
      if (bx > maxX) maxX = bx;
      if (by > maxY) maxY = by;
    }
    for (const s of shapesList) {
      const sx = s.x + s.width;
      const sy = s.y + s.height;
      if (sx > maxX) maxX = sx;
      if (sy > maxY) maxY = sy;
    }
    for (const st of strokesList) {
      for (const p of st.points) {
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }
    return { width: maxX + 600, height: maxY + 600 };
  }, [blocksList, shapesList, strokesList]);

  // Dimensiones según formato
  let dimensionsClass = isVertical
    ? 'w-full max-w-[740px] min-h-[1046px]'
    : 'w-full max-w-[1040px] min-h-[735px]';

  if (currentFormat === 'a3') {
    dimensionsClass = isVertical
      ? 'w-full max-w-[1040px] min-h-[1470px]'
      : 'w-full max-w-[1470px] min-h-[1040px]';
  } else if (currentFormat === 'a2') {
    dimensionsClass = isVertical
      ? 'w-full max-w-[1470px] min-h-[2078px]'
      : 'w-full max-w-[2078px] min-h-[1470px]';
  } else if (currentFormat === 'a1') {
    dimensionsClass = isVertical
      ? 'w-full max-w-[2078px] min-h-[2938px]'
      : 'w-full max-w-[2938px] min-h-[2078px]';
  } else if (currentFormat === 'letter') {
    dimensionsClass = isVertical
      ? 'w-full max-w-[760px] aspect-[216/279] min-h-[982px]'
      : 'w-full max-w-[980px] aspect-[279/216] min-h-[759px]';
  } else if (currentFormat === 'legal') {
    dimensionsClass = isVertical
      ? 'w-full max-w-[700px] aspect-[216/356] min-h-[1153px]'
      : 'w-full max-w-[1100px] aspect-[356/216] min-h-[668px]';
  } else if (currentFormat === 'infinite') {
    // Lienzo infinito sin restricción de max-w-[740px]
    dimensionsClass = 'w-auto min-w-[2600px] min-h-[2200px] max-w-none shadow-xl';
  }

  // Helper para obtener coordenadas precisas divididas por el zoom
  const getSheetCoords = useCallback(
    (clientX: number, clientY: number) => {
      const targetEl = mainRef.current || sheetRef.current;
      if (!targetEl) return { x: 0, y: 0 };
      const rect = targetEl.getBoundingClientRect();
      const zoom = zoomLevel || 1.0;
      return {
        x: (clientX - rect.left) / zoom,
        y: (clientY - rect.top) / zoom,
      };
    },
    [zoomLevel]
  );

  // Helper para detectar elementos bajo el borrador
  const checkEraserHits = useCallback(
    (x: number, y: number, idsSet: Set<string>) => {
      // 1. Trazos
      for (const stroke of strokesList) {
        if (!idsSet.has(stroke.id) && isPointNearStroke({ x, y }, stroke.points, 24)) {
          idsSet.add(stroke.id);
        }
      }
      // 2. Formas
      for (const shape of shapesList) {
        if (
          !idsSet.has(shape.id) &&
          x >= shape.x - 12 &&
          x <= shape.x + shape.width + 12 &&
          y >= shape.y - 12 &&
          y <= shape.y + shape.height + 12
        ) {
          idsSet.add(shape.id);
        }
      }
      // 3. Textos y diagramas
      for (const block of blocksList) {
        if (!idsSet.has(block.id)) {
          const bx = block.position?.x ?? 40;
          const by = block.position?.y ?? 80;
          const bw = block.width ?? 280;
          const bh = block.type === 'graphic' ? 240 : 60;
          if (x >= bx - 12 && x <= bx + bw + 12 && y >= by - 12 && y <= by + bh + 12) {
            idsSet.add(block.id);
          }
        }
      }
    },
    [blocksList, shapesList, strokesList]
  );

  // Iniciar arrastre multi-elemento
  const handleStartElementsDrag = useCallback(
    (e: React.PointerEvent, targetIds: Set<string>) => {
      if (isStudyMode) return;
      if (activeTool === 'hand') return;
      e.preventDefault();
      e.stopPropagation();
      window.getSelection()?.removeAllRanges();
      document.body.style.userSelect = 'none';

      const initialPositions = new Map<
        string,
        { type: 'block' | 'shape' | 'stroke'; x: number; y: number; points?: StrokePoint[] }
      >();

      const domItems: Array<{ id: string; el: HTMLElement | SVGElement; isSvg: boolean }> = [];

      for (const id of targetIds) {
        if (page.blocks && page.blocks[id]) {
          const b = page.blocks[id];
          initialPositions.set(id, {
            type: 'block',
            x: b.position?.x ?? 40,
            y: b.position?.y ?? 80,
          });
          const el = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement;
          if (el) {
            el.style.transition = 'none';
            el.style.willChange = 'transform';
            domItems.push({ id, el, isSvg: false });
          }
        } else {
          const shape = shapesList.find((s) => s.id === id);
          if (shape) {
            initialPositions.set(id, {
              type: 'shape',
              x: shape.x,
              y: shape.y,
            });
            const el = document.querySelector(`[data-element-id="${id}"]`) as HTMLElement;
            if (el) {
              el.style.transition = 'none';
              el.style.willChange = 'transform';
              domItems.push({ id, el, isSvg: false });
            }
          } else {
            const stroke = strokesList.find((st) => st.id === id);
            if (stroke) {
              initialPositions.set(id, {
                type: 'stroke',
                x: 0,
                y: 0,
                points: stroke.points.map((p) => ({ ...p })),
              });
              const el = document.querySelector(`[data-stroke-id="${id}"]`) as SVGElement;
              if (el) {
                el.style.transition = 'none';
                domItems.push({ id, el, isSvg: true });
              }
            }
          }
        }
      }

      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialPositions,
      };
      dragDOMElementsRef.current = domItems;
      dragDeltaRef.current = { dx: 0, dy: 0 };
      setIsDraggingElements(true);
    },
    [isStudyMode, activeTool, page.blocks, shapesList, strokesList]
  );

  // Trazo seleccionado actualmente (si es exactamente un único trazo)
  const singleSelectedId = selectedElementIds.size === 1 ? Array.from(selectedElementIds)[0] : null;
  const selectedStroke = useMemo(() => {
    return singleSelectedId ? strokesList.find((s) => s.id === singleSelectedId) : null;
  }, [strokesList, singleSelectedId]);

  const selectedStrokeBBox = useMemo(() => {
    if (!selectedStroke || selectedStroke.points.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of selectedStroke.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }, [selectedStroke]);

  // --- 1. Eventos Pointer en el Lienzo de Papel ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isStudyMode) return;
    if (activeTool === 'hand') return; // Permitir paneo libre estilo Excalidraw
    const target = e.target as HTMLElement;

    // Si se hizo clic en un botón o input, no interferir
    if (target.closest('button') || target.closest('input')) {
      return;
    }

    const { x, y } = getSheetCoords(e.clientX, e.clientY);
    const pressure = e.pressure > 0 ? e.pressure : 0.5;

    // A. MODO BORRADOR EXCALIDRAW: Inicia rastro de cometa y opacidad temporal
    if (activeTool === 'eraser') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      setIsErasing(true);
      const now = Date.now();
      setEraserTrail([{ x, y, time: now }]);
      const initialHits = new Set<string>();
      checkEraserHits(x, y, initialHits);
      setPendingDeleteIds(initialHits);
      return;
    }

    // B. MODO PLUMA / DIBUJO LIBRE
    if (activeTool === 'pencil') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      setIsDrawing(true);
      setCurrentStrokePoints([{ x, y, pressure }]);
      return;
    }

    // C. MODO FORMAS (Rectángulos, Elipses, Rombos, Flechas, Líneas)
    if (activeTool === 'shape') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
      setIsDrawingShape(true);
      setShapeStart({ x, y });
      setShapePreview({ x, y, width: 0, height: 0 });
      return;
    }

    // D. MODO TEXTO (Clic en cualquier parte de la hoja para escribir texto puro)
    if (activeTool === 'text') {
      if (target.closest('.excalidraw-text-element')) return;

      const newId = `txt-${Date.now()}`;
      const newBlock: PageBlock = {
        id: newId,
        type: 'text',
        title: '',
        content: '',
        position: { x: Math.round(x), y: Math.round(y) },
        textColor: activeColor || '#2E2822',
        fontSize: 'base',
        fontFamily: 'handwriting',
        createdAt: new Date().toISOString(),
      };

      if (onInsertBlock) {
        onInsertBlock(newBlock);
      } else {
        onUpdatePage({
          blocks: {
            ...page.blocks,
            [newId]: newBlock,
          },
        });
      }

      setSelectedElementIds(new Set([newId]));
      setEditingTextId(newId);
      return;
    }

    // E. MODO AI WAND
    if (activeTool === 'ai') {
      if (onOpenAIPrompt) onOpenAIPrompt();
      return;
    }

    // F. MODO SELECCIÓN (V): Permite seleccionar trazos, formas, texto y selección múltiple marquee
    if (activeTool === 'select') {
      // Verificar si hizo clic cerca de un trazo dibujado
      const hitStroke = strokesList.find((s) => isPointNearStroke({ x, y }, s.points, 18));
      if (hitStroke) {
        const nextSet = e.shiftKey
          ? selectedElementIds.has(hitStroke.id)
            ? (() => {
                const s = new Set(selectedElementIds);
                s.delete(hitStroke.id);
                return s;
              })()
            : new Set([...Array.from(selectedElementIds), hitStroke.id])
          : new Set([hitStroke.id]);

        setSelectedElementIds(nextSet);
        setEditingTextId(null);
        handleStartElementsDrag(e, nextSet);
        return;
      }

      // Si no hizo clic en ningún elemento ni trazo, iniciar caja de selección marquee
      if (!target.closest('.excalidraw-element')) {
        if (!e.shiftKey) {
          setSelectedElementIds(new Set());
        }
        setEditingTextId(null);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {}
        setSelectionMarquee({ startX: x, startY: y, currentX: x, currentY: y });
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isStudyMode) return;
    const { x, y } = getSheetCoords(e.clientX, e.clientY);
    const pressure = e.pressure > 0 ? e.pressure : 0.5;

    // Pluma en movimiento
    if (isDrawing && activeTool === 'pencil') {
      setCurrentStrokePoints((prev) => [...prev, { x, y, pressure }]);
      return;
    }

    // Borrador en arrastre con cola de cometa y opacidad temporal
    if (isErasing && activeTool === 'eraser') {
      const now = Date.now();
      setEraserTrail((prev) => {
        const next = [...prev, { x, y, time: now }];
        // Mantener cola de los últimos 320ms (máx 25 puntos)
        return next.filter((p) => now - p.time < 320).slice(-25);
      });
      setPendingDeleteIds((prev) => {
        const next = new Set(prev);
        checkEraserHits(x, y, next);
        return next;
      });
      return;
    }

    // Forma en creación
    if (isDrawingShape && shapeStart) {
      const rx = Math.min(shapeStart.x, x);
      const ry = Math.min(shapeStart.y, y);
      const rw = Math.abs(x - shapeStart.x);
      const rh = Math.abs(y - shapeStart.y);
      setShapePreview({ x: rx, y: ry, width: rw, height: rh });
      return;
    }

    // Arrastre de selección múltiple (Marquee)
    if (selectionMarquee && activeTool === 'select') {
      setSelectionMarquee((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));

      const minX = Math.min(selectionMarquee.startX, x);
      const minY = Math.min(selectionMarquee.startY, y);
      const maxX = Math.max(selectionMarquee.startX, x);
      const maxY = Math.max(selectionMarquee.startY, y);
      const box = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

      const foundIds = new Set<string>();

      // 1. Formas
      for (const s of shapesList) {
        if (s.x < maxX && s.x + s.width > minX && s.y < maxY && s.y + s.height > minY) {
          foundIds.add(s.id);
        }
      }

      // 2. Textos y diagramas
      for (const b of blocksList) {
        const bx = b.position?.x ?? 40;
        const by = b.position?.y ?? 80;
        const bw = b.width ?? 280;
        const bh = b.type === 'graphic' ? 240 : 60;
        if (bx < maxX && bx + bw > minX && by < maxY && by + bh > minY) {
          foundIds.add(b.id);
        }
      }

      // 3. Trazos
      for (const st of strokesList) {
        if (isStrokeInBox(box, st.points)) {
          foundIds.add(st.id);
        }
      }

      setSelectedElementIds(foundIds);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isStudyMode) return;

    // Finalizar trazo de Pluma
    if (isDrawing && activeTool === 'pencil') {
      setIsDrawing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}

      if (currentStrokePoints.length > 0) {
        const newStroke: DrawingStroke = {
          id: `stroke-${Date.now()}`,
          points: currentStrokePoints,
          color: activeColor || '#2E2822',
          size: penSize || 3,
          createdAt: new Date().toISOString(),
        };
        const nextStrokes = [...(page.drawingStrokes || []), newStroke];
        onUpdatePage({ drawingStrokes: nextStrokes });
      }
      setCurrentStrokePoints([]);
      return;
    }

    // Finalizar borrador Excalidraw: borrar atómicamente todos los elementos marcados
    if (isErasing && activeTool === 'eraser') {
      setIsErasing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}

      if (pendingDeleteIds.size > 0) {
        const remainingStrokes = strokesList.filter((s) => !pendingDeleteIds.has(s.id));
        const remainingShapes = shapesList.filter((s) => !pendingDeleteIds.has(s.id));
        const remainingBlocks = { ...(page.blocks || {}) };
        for (const id of pendingDeleteIds) {
          delete remainingBlocks[id];
        }

        onUpdatePage({
          drawingStrokes: remainingStrokes,
          shapeElements: remainingShapes,
          blocks: remainingBlocks,
        });

        // Limpiar selección de los elementos eliminados
        setSelectedElementIds((prev) => {
          const next = new Set(prev);
          for (const id of pendingDeleteIds) next.delete(id);
          return next;
        });
      }

      setPendingDeleteIds(new Set());
      setEraserTrail([]);
      return;
    }

    // Finalizar caja de selección múltiple (Marquee)
    if (selectionMarquee) {
      setSelectionMarquee(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      return;
    }

    // Finalizar creación de forma
    if (isDrawingShape && shapeStart && shapePreview) {
      setIsDrawingShape(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}

      const width = Math.max(30, shapePreview.width);
      const height = Math.max(20, shapePreview.height);

      const newShape: ShapeElement = {
        id: `shape-${Date.now()}`,
        type: activeShapeType || 'rectangle',
        x: Math.round(shapePreview.x),
        y: Math.round(shapePreview.y),
        width: Math.round(width),
        height: Math.round(height),
        color: activeColor || '#2E2822',
        strokeWidth: 2,
        createdAt: new Date().toISOString(),
      };

      const nextShapes = [...(page.shapeElements || []), newShape];
      onUpdatePage({ shapeElements: nextShapes });
      setSelectedElementIds(new Set([newShape.id]));
      setShapeStart(null);
      setShapePreview(null);
    }
  };

  // --- 2. Arrastre Directo y Multi-elemento Global con 60/120 FPS Hardware Transform Directo ---
  useEffect(() => {
    if (!isDraggingElements) return;

    const handlePointerMoveGlobal = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      window.getSelection()?.removeAllRanges();
      const zoom = zoomLevel || 1.0;
      const dx = (e.clientX - dragStartRef.current.clientX) / zoom;
      const dy = (e.clientY - dragStartRef.current.clientY) / zoom;

      dragDeltaRef.current = { dx, dy };

      // Movimiento 100% instantáneo por hardware directo al DOM (cero latencia de React)
      if (dragDOMElementsRef.current) {
        for (const item of dragDOMElementsRef.current) {
          if (item.isSvg) {
            item.el.setAttribute('transform', `translate(${dx}, ${dy})`);
          } else {
            (item.el as HTMLElement).style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
          }
        }
      }
    };

    const handlePointerUpGlobal = () => {
      document.body.style.userSelect = '';

      // Limpiar estilos directos del DOM
      if (dragDOMElementsRef.current) {
        for (const item of dragDOMElementsRef.current) {
          if (item.isSvg) {
            item.el.removeAttribute('transform');
          } else {
            (item.el as HTMLElement).style.transform = '';
            (item.el as HTMLElement).style.willChange = '';
            (item.el as HTMLElement).style.transition = '';
          }
        }
      }

      if (dragStartRef.current && dragDeltaRef.current) {
        const { dx, dy } = dragDeltaRef.current;
        const initialPositions = dragStartRef.current.initialPositions;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          let hasBlockUpdates = false;
          const updatedBlocks = { ...(page.blocks || {}) };

          let hasShapeUpdates = false;
          let updatedShapes = [...(page.shapeElements || [])];

          let hasStrokeUpdates = false;
          let updatedStrokes = [...(page.drawingStrokes || [])];

          for (const [id, initial] of initialPositions.entries()) {
            if (initial.type === 'block' && updatedBlocks[id]) {
              updatedBlocks[id] = {
                ...updatedBlocks[id],
                position: {
                  x: Math.round(initial.x + dx),
                  y: Math.round(initial.y + dy),
                },
              };
              hasBlockUpdates = true;
            } else if (initial.type === 'shape') {
              updatedShapes = updatedShapes.map((s) =>
                s.id === id ? { ...s, x: Math.round(initial.x + dx), y: Math.round(initial.y + dy) } : s
              );
              hasShapeUpdates = true;
            } else if (initial.type === 'stroke' && initial.points) {
              updatedStrokes = updatedStrokes.map((st) =>
                st.id === id
                  ? {
                      ...st,
                      points: initial.points!.map((p) => ({
                        ...p,
                        x: Math.round(p.x + dx),
                        y: Math.round(p.y + dy),
                      })),
                    }
                  : st
              );
              hasStrokeUpdates = true;
            }
          }

          if (hasBlockUpdates || hasShapeUpdates || hasStrokeUpdates) {
            onUpdatePage({
              ...(hasBlockUpdates ? { blocks: updatedBlocks } : {}),
              ...(hasShapeUpdates ? { shapeElements: updatedShapes } : {}),
              ...(hasStrokeUpdates ? { drawingStrokes: updatedStrokes } : {}),
            });
          }
        }
      }

      setIsDraggingElements(false);
      dragDOMElementsRef.current = [];
      dragDeltaRef.current = null;
      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMoveGlobal);
    window.addEventListener('pointerup', handlePointerUpGlobal);
    return () => {
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMoveGlobal);
      window.removeEventListener('pointerup', handlePointerUpGlobal);
    };
  }, [isDraggingElements, onUpdatePage, page.blocks, page.shapeElements, page.drawingStrokes, zoomLevel]);

  // Atajo de teclado global para borrar elementos seleccionados (Supr / Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedElementIds.size === 0 || editingTextId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();

        const remainingStrokes = strokesList.filter((s) => !selectedElementIds.has(s.id));
        const remainingShapes = shapesList.filter((s) => !selectedElementIds.has(s.id));
        const remainingBlocks = { ...(page.blocks || {}) };
        for (const id of selectedElementIds) {
          delete remainingBlocks[id];
        }

        onUpdatePage({
          drawingStrokes: remainingStrokes,
          shapeElements: remainingShapes,
          blocks: remainingBlocks,
        });
        setSelectedElementIds(new Set());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, editingTextId, onUpdatePage, page.blocks, shapesList, strokesList]);

  // Generar trazado SVG actual mientras se dibuja
  const currentStrokeSvgPath =
    currentStrokePoints.length > 0 ? pointsToSvgPath(currentStrokePoints, penSize) : '';

  // Determinar cursor según la herramienta activa
  const canvasCursor =
    activeTool === 'hand'
      ? 'cursor-grab'
      : activeTool === 'pencil'
      ? 'cursor-crosshair'
      : activeTool === 'eraser'
      ? 'cursor-none'
      : activeTool === 'text'
      ? 'cursor-text'
      : activeTool === 'shape'
      ? 'cursor-crosshair'
      : 'cursor-default';

  return (
    <div
      className={`w-full select-none ${
        currentFormat === 'infinite'
          ? 'min-w-max flex justify-start py-6 px-8'
          : 'flex justify-center py-6 px-2 sm:px-6'
      }`}
    >
      {/* Contenedor Físico de la Hoja de Cuaderno - Bordes en Punta y Superficie Limpia sin Sombras Interiores */}
      <div
        ref={sheetRef}
        id="active-notebook-sheet"
        style={
          currentFormat === 'infinite'
            ? { width: `${infiniteBounds.width}px`, minHeight: `${infiniteBounds.height}px` }
            : undefined
        }
        className={`${dimensionsClass} rounded-none ${patternClass} text-stone-800 flex flex-col relative border border-[#DFD8CB] overflow-hidden shadow-md select-none`}
      >
        {/* Lienzo Excalidraw Vivo: Capa de Dibujo Libre + Elementos + Texto Puro (Ocupa toda la hoja desde arriba) */}
        <main
          ref={mainRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`flex-1 relative overflow-hidden min-h-[600px] select-none ${canvasCursor}`}
        >
          {/* Capa A: SVG de Trazos Dibujados con la Pluma (Excalidraw Vector Strokes) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible">
            {strokesList.map((stroke) => {
              const pathData = pointsToSvgPath(stroke.points, stroke.size);
              const isSelected = selectedElementIds.has(stroke.id);
              const isPending = pendingDeleteIds.has(stroke.id);
              const isBeingDragged =
                isDraggingElements && dragStartRef.current?.initialPositions.has(stroke.id);
              return (
                <path
                  key={stroke.id}
                  data-stroke-id={stroke.id}
                  d={pathData}
                  fill={stroke.color}
                  style={{
                    filter: isPending
                      ? 'grayscale(1) blur(0.5px)'
                      : isSelected
                      ? 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.9))'
                      : 'none',
                    opacity: isPending ? 0.25 : 1,
                  }}
                  className={isBeingDragged ? 'pointer-events-none' : ''}
                />
              );
            })}

            {/* Trazo activo en tiempo real mientras el usuario mueve el lápiz */}
            {isDrawing && currentStrokeSvgPath && (
              <path d={currentStrokeSvgPath} fill={activeColor} opacity={0.9} />
            )}

            {/* Cola de Cometa Excalidraw para el Borrador ("cola de cometa") */}
            {isErasing && eraserTrail.length > 1 && (
              <g className="eraser-comet-tail pointer-events-none">
                {eraserTrail.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = eraserTrail[i - 1];
                  const progress = i / eraserTrail.length; // 0 en la cola, 1 en el cursor
                  const strokeWidth = 3 + progress * 13;
                  const opacity = 0.15 + progress * 0.75;
                  return (
                    <line
                      key={`comet-${i}`}
                      x1={prev.x}
                      y1={prev.y}
                      x2={pt.x}
                      y2={pt.y}
                      stroke="#FA5252"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeOpacity={opacity}
                      style={{
                        filter: 'drop-shadow(0 0 6px rgba(250, 82, 82, 0.7))',
                      }}
                    />
                  );
                })}
                {eraserTrail.length > 0 && (
                  <circle
                    cx={eraserTrail[eraserTrail.length - 1].x}
                    cy={eraserTrail[eraserTrail.length - 1].y}
                    r={8}
                    fill="#FA5252"
                    opacity={0.9}
                    style={{
                      filter: 'drop-shadow(0 0 10px rgba(250, 82, 82, 0.95))',
                    }}
                  />
                )}
              </g>
            )}
          </svg>

          {/* Barra de opciones flotante para trazo único seleccionado */}
          {selectedStroke && selectedStrokeBBox && !isStudyMode && selectedElementIds.size === 1 && (
            <div
              style={{
                position: 'absolute',
                left: `${selectedStrokeBBox.minX}px`,
                top: `${Math.max(10, selectedStrokeBBox.minY - 40)}px`,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="z-40 flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DFD8CB] rounded-full px-2.5 py-1 shadow-lg text-xs font-sans pointer-events-auto animate-in fade-in"
            >
              <span className="font-bold text-[10px] text-stone-500 uppercase">Trazo</span>
              <span className="text-[#D5CDBD]">|</span>
              <button
                type="button"
                onClick={() => {
                  onUpdatePage({ drawingStrokes: strokesList.filter((s) => s.id !== selectedStroke.id) });
                  setSelectedElementIds(new Set());
                }}
                className="p-1 rounded-full hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                title="Eliminar trazo (Supr)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Capa B: Previsualización de Rectángulo/Forma mientras se arrastra */}
          {isDrawingShape && shapePreview && (
            <div
              style={{
                position: 'absolute',
                left: `${shapePreview.x}px`,
                top: `${shapePreview.y}px`,
                width: `${shapePreview.width}px`,
                height: `${shapePreview.height}px`,
                borderColor: activeColor,
              }}
              className="border-2 border-dashed rounded-lg pointer-events-none z-20 bg-black/5"
            />
          )}

          {/* Capa Marquee: Caja de Selección Múltiple arrastrando sobre lienzo vacío */}
          {selectionMarquee && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(selectionMarquee.startX, selectionMarquee.currentX)}px`,
                top: `${Math.min(selectionMarquee.startY, selectionMarquee.currentY)}px`,
                width: `${Math.abs(selectionMarquee.currentX - selectionMarquee.startX)}px`,
                height: `${Math.abs(selectionMarquee.currentY - selectionMarquee.startY)}px`,
              }}
              className="border-2 border-dashed border-blue-500 bg-blue-500/10 rounded-md pointer-events-none z-30 animate-in fade-in duration-75"
            />
          )}

          {/* Capa C: Formas Creadas con Redimensionado y Arrastre Directo (Excalidraw Shape Elements) */}
          {shapesList.map((shape) => {
            const isSelected = selectedElementIds.has(shape.id);
            const isPendingDelete = pendingDeleteIds.has(shape.id);
            return (
              <div key={shape.id} className="excalidraw-element">
                <ExcalidrawShapeElement
                  shape={shape}
                  zoomLevel={zoomLevel}
                  isSelected={isSelected}
                  isPendingDelete={isPendingDelete}
                  isStudyMode={isStudyMode}
                  isHandActive={activeTool === 'hand'}
                  onSelect={() => {
                    if (!selectedElementIds.has(shape.id)) {
                      setSelectedElementIds(new Set([shape.id]));
                    }
                  }}
                  onUpdate={(updated) => {
                    const nextShapes = shapesList.map((s) => (s.id === shape.id ? { ...s, ...updated } : s));
                    onUpdatePage({ shapeElements: nextShapes });
                  }}
                  onDelete={() => {
                    onUpdatePage({ shapeElements: shapesList.filter((s) => s.id !== shape.id) });
                    setSelectedElementIds((prev) => {
                      const next = new Set(prev);
                      next.delete(shape.id);
                      return next;
                    });
                  }}
                  onStartDrag={(e) => {
                    const targetIds = selectedElementIds.has(shape.id)
                      ? selectedElementIds
                      : new Set([shape.id]);
                    if (!selectedElementIds.has(shape.id)) {
                      setSelectedElementIds(targetIds);
                    }
                    handleStartElementsDrag(e, targetIds);
                  }}
                />
              </div>
            );
          })}

          {/* Capa D: Texto Puro y Diagramas en la Hoja con Arrastre Directo (Sin necesidad de asas de 6 puntos) */}
          {blocksList.map((block, idx) => {
            const posX = block.position?.x ?? 40 + (idx % 2) * 320;
            const posY = block.position?.y ?? 80 + Math.floor(idx / 2) * 160;
            const isSelected = selectedElementIds.has(block.id);
            const isPendingDelete = pendingDeleteIds.has(block.id);

            if (block.type === 'graphic') {
              // Diagrama visual Mermaid en la hoja
              const diagramCode =
                block.content?.codigo_render || (typeof block.content === 'string' ? block.content : '');
              return (
                <div key={block.id} className="excalidraw-element">
                  <ExcalidrawDiagramElement
                    id={block.id}
                    title={block.title || 'Diagrama'}
                    code={diagramCode}
                    x={posX}
                    y={posY}
                    width={block.width || 460}
                    isSelected={isSelected}
                    isPendingDelete={isPendingDelete}
                    isStudyMode={isStudyMode}
                    isHandActive={activeTool === 'hand'}
                    onSelect={() => {
                      if (!selectedElementIds.has(block.id)) {
                        setSelectedElementIds(new Set([block.id]));
                      }
                    }}
                    onUpdate={(up) => onUpdateBlock(block.id, up)}
                    onDelete={() => onRemoveBlock(block.id)}
                    onStartDrag={(e) => {
                      const targetIds = selectedElementIds.has(block.id)
                        ? selectedElementIds
                        : new Set([block.id]);
                      if (!selectedElementIds.has(block.id)) {
                        setSelectedElementIds(targetIds);
                      }
                      handleStartElementsDrag(e, targetIds);
                    }}
                  />
                </div>
              );
            }

            // Elemento de Texto Puro Excalidraw con redimensionado y arrastre directo
            let blockText = '';
            if (typeof block.content === 'string') {
              blockText = block.content;
            } else if (block.content) {
              blockText = block.content.texto || block.content.definicion_corta || block.title || '';
            } else {
              blockText = block.title || '';
            }

            return (
              <div key={block.id} className="excalidraw-element excalidraw-text-element">
                <ExcalidrawTextElement
                  id={block.id}
                  text={blockText}
                  x={posX}
                  y={posY}
                  width={block.width}
                  fontSize={
                    block.fontSize === 'xl' ? 40 : block.fontSize === 'lg' ? 30 : block.fontSize === 'sm' ? 16 : 22
                  }
                  fontFamily={block.fontFamily === 'sans' ? 'sans' : 'handwriting'}
                  color={block.textColor || '#2E2822'}
                  isSelected={isSelected}
                  isPendingDelete={isPendingDelete}
                  isEditing={editingTextId === block.id}
                  zoomLevel={zoomLevel}
                  isStudyMode={isStudyMode}
                  notebookTitle={notebookTitle}
                  isHandActive={activeTool === 'hand'}
                  onSelect={() => {
                    if (!selectedElementIds.has(block.id)) {
                      setSelectedElementIds(new Set([block.id]));
                    }
                  }}
                  onStartEditing={() => {
                    setSelectedElementIds(new Set([block.id]));
                    setEditingTextId(block.id);
                  }}
                  onFinishEditing={(newText) => {
                    setEditingTextId(null);
                    onUpdateBlock(block.id, {
                      content: newText,
                      title: newText.split('\n')[0].slice(0, 30) || 'Apunte',
                    });
                  }}
                  onChangeText={(newText) => {
                    onUpdateBlock(block.id, {
                      content: newText,
                      title: newText.split('\n')[0].slice(0, 30) || 'Apunte',
                    });
                  }}
                  onUpdateProps={({ fontSize, fontFamily, color, width }) => {
                    const mappedSize =
                      fontSize === 40 ? 'xl' : fontSize === 30 ? 'lg' : fontSize === 16 ? 'sm' : 'base';
                    onUpdateBlock(block.id, {
                      fontSize: mappedSize,
                      fontFamily,
                      textColor: color,
                      width: width !== undefined ? width : block.width,
                    });
                  }}
                  onDelete={() => onRemoveBlock(block.id)}
                  onStartDrag={(e) => {
                    const targetIds = selectedElementIds.has(block.id)
                      ? selectedElementIds
                      : new Set([block.id]);
                    if (!selectedElementIds.has(block.id)) {
                      setSelectedElementIds(targetIds);
                    }
                    handleStartElementsDrag(e, targetIds);
                  }}
                  onConvertToDiagram={() => {
                    onUpdateBlock(block.id, {
                      type: 'graphic',
                      content: {
                        codigo_render: `graph TD\n  A[${blockText.slice(0, 20)}] --> B[Detalle]`,
                        titulo: blockText.slice(0, 20),
                      },
                    });
                  }}
                />
              </div>
            );
          })}

          {/* Indicador sutil si el cuaderno está completamente en blanco */}
          {blocksList.length === 0 && strokesList.length === 0 && shapesList.length === 0 && (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center select-none pointer-events-none opacity-40">
              <p className="text-sm font-medium text-stone-500">
                Usa la <span className="font-bold">Pluma ✍️</span> para dibujar o la herramienta{' '}
                <span className="font-bold">Texto (T)</span> para escribir en cualquier parte...
              </p>
            </div>
          )}
        </main>

        {/* 3. Pie de Página del Cuaderno */}
        <footer className="px-8 py-3 border-t border-[#DFD8CB]/80 flex items-center justify-between text-xs font-medium text-[#786E64] shrink-0 z-20 bg-[#FAF7F2]/60 select-none">
          <span className="font-sans">Sirbook · {notebookTitle}</span>
          <span className="font-mono font-bold tracking-wider text-[#2E2822]">
            {currentFormat === 'infinite'
              ? `LIENZO INFINITO ♾️ (HOJA ${page.pageNumber})`
              : `HOJA ${page.pageNumber} DE ${totalPages}`}
          </span>
        </footer>
      </div>
    </div>
  );
};

export default NotebookSheet;
