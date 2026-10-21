'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NotebookPage, PageBlock, PageOrientation, ExcalidrawShapeType } from '@/types/notebook-engine';
import NotebookSheet from './NotebookSheet';
import { ChevronLeft, ChevronRight, BookOpen, Edit3 } from 'lucide-react';

interface BookPageFlipContainerProps {
  activePage: NotebookPage;
  pageIndex: number;
  totalPages: number;
  orientation: PageOrientation;
  mode: 'edit' | 'study';
  notebookTitle?: string;
  zoomLevel?: number;
  activeTool?: 'select' | 'hand' | 'pencil' | 'text' | 'shape' | 'eraser' | 'ai';
  activeColor?: string;
  penSize?: number;
  activeShapeType?: ExcalidrawShapeType;
  onOpenAIPrompt?: () => void;
  onPageChange: (newIndex: number) => void;
  onUpdatePage: (updated: Partial<NotebookPage>) => void;
  onSplitRight: (blockId: string) => void;
  onSplitBottom: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updated: Partial<PageBlock>) => void;
  onInsertBlock?: (block: PageBlock) => void;
  onUpdateRatio: (splitId: string, newRatio: number) => void;
  onAddPage: () => void;
  onToggleMode: () => void;
  onOpenAIAssist?: (blockId?: string) => void;
}

export default function BookPageFlipContainer({
  activePage,
  pageIndex,
  totalPages,
  orientation,
  mode,
  notebookTitle,
  zoomLevel = 1.0,
  activeTool = 'pencil',
  activeColor = '#2E2822',
  penSize = 3,
  activeShapeType = 'rectangle',
  onOpenAIPrompt,
  onPageChange,
  onUpdatePage,
  onSplitRight,
  onSplitBottom,
  onRemoveBlock,
  onUpdateBlock,
  onInsertBlock,
  onUpdateRatio,
  onAddPage,
  onToggleMode,
  onOpenAIAssist,
}: BookPageFlipContainerProps) {
  const [flipDirection, setFlipDirection] = useState<
    'forward' | 'backward' | 'incoming-forward' | 'incoming-backward' | null
  >(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canGoPrev = pageIndex > 0;
  const canGoNext = pageIndex < totalPages - 1;

  const triggerFlip = useCallback((direction: 'next' | 'prev') => {
    if (flipDirection) return; // already animating

    if (direction === 'next') {
      if (canGoNext) {
        setFlipDirection('forward');
        setTimeout(() => {
          onPageChange(pageIndex + 1);
          setFlipDirection('incoming-forward');
          setTimeout(() => {
            setFlipDirection(null);
          }, 300);
        }, 320);
      } else {
        // Option to create new page if at the end
        onAddPage();
      }
    } else if (direction === 'prev') {
      if (canGoPrev) {
        setFlipDirection('backward');
        setTimeout(() => {
          onPageChange(pageIndex - 1);
          setFlipDirection('incoming-backward');
          setTimeout(() => {
            setFlipDirection(null);
          }, 300);
        }, 320);
      }
    }
  }, [flipDirection, canGoNext, canGoPrev, pageIndex, onPageChange, onAddPage]);

  // Keyboard navigation (Left / Right arrow keys in study mode or with Alt in edit mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        triggerFlip('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        triggerFlip('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerFlip]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Minimum swipe threshold of 50px, and horizontal dominant
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        // Swiped left -> next page
        triggerFlip('next');
      } else {
        // Swiped right -> prev page
        triggerFlip('prev');
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null);

  const isHandActive = activeTool === 'hand' || isSpacePressed;

  // Spacebar pan listener (like Excalidraw / Figma)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePanPointerDown = (e: React.PointerEvent) => {
    if (!isHandActive && e.button !== 1) return;
    e.preventDefault();
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: panOffset.x,
      startY: panOffset.y,
    };
    setIsPanning(true);
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPanOffset({
        x: Math.round(panStartRef.current.startX + dx),
        y: Math.round(panStartRef.current.startY + dy),
      });
    };

    const handleWindowPointerUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [isPanning]);

  // Reset panOffset when page flips
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
  }, [pageIndex]);

  const isInfinite = activePage.pageFormat === 'infinite';

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePanPointerDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full flex-1 flex flex-col overflow-auto select-none bg-[#EFEAE2] ${
        isHandActive ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
      } ${
        isInfinite
          ? 'items-start justify-start p-6 sm:p-10'
          : 'items-center justify-start px-3 sm:px-8 pt-8 pb-16'
      }`}
    >
      {/* 3D Flip Stage Container con Zoom Fluido y Paneo Excalidraw */}
      <div
        className={`relative my-auto ${
          isInfinite
            ? 'flex items-start justify-start min-w-max'
            : 'w-full flex items-center justify-center page-flip-stage perspective-[2200px]'
        }`}
        style={{
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
          transformOrigin: isInfinite ? 'top left' : 'top center',
        }}
      >
        {/* The Animated Page Leaf */}
        <div
          className={`transition-all transform-gpu ${
            isInfinite
              ? 'flex items-start justify-start min-w-max'
              : `w-full flex items-center justify-center ${
                  flipDirection === 'forward'
                    ? 'animate-page-turn-forward'
                    : flipDirection === 'incoming-forward'
                    ? 'animate-page-incoming-forward'
                    : flipDirection === 'backward'
                    ? 'animate-page-turn-backward'
                    : flipDirection === 'incoming-backward'
                    ? 'animate-page-incoming-backward'
                    : ''
                }`
          }`}
          style={{
            transformStyle: isInfinite ? undefined : 'preserve-3d',
            transformOrigin:
              flipDirection === 'backward' || flipDirection === 'incoming-backward'
                ? 'right center'
                : 'left center',
          }}
        >
          <NotebookSheet
            page={activePage}
            totalPages={totalPages}
            orientation={orientation}
            isStudyMode={mode === 'study'}
            notebookTitle={notebookTitle}
            zoomLevel={zoomLevel}
            activeTool={activeTool}
            activeColor={activeColor}
            penSize={penSize}
            activeShapeType={activeShapeType}
            onOpenAIPrompt={onOpenAIPrompt}
            onUpdatePage={onUpdatePage}
            onSplitRight={onSplitRight}
            onSplitBottom={onSplitBottom}
            onRemoveBlock={onRemoveBlock}
            onUpdateBlock={onUpdateBlock}
            onInsertBlock={onInsertBlock}
            onUpdateRatio={onUpdateRatio}
            onOpenAIAssist={onOpenAIAssist}
          />
        </div>
      </div>

      {/* Bottom Quick Page Jump & Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-8 py-2 px-4 rounded-full bg-[#FAF7F2]/95 border border-[#DFD8CB] shadow-sm shrink-0">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onPageChange(idx)}
            className={`transition-all rounded-full ${
              idx === pageIndex
                ? 'w-7 h-2.5 bg-[#8C6B3D] shadow-xs'
                : 'w-2.5 h-2.5 bg-[#DCD5C8] hover:bg-[#B0A798]'
            }`}
            title={`Ir a página ${idx + 1}`}
          />
        ))}

        <button
          onClick={onAddPage}
          className="ml-2 text-xs font-semibold text-[#786E64] hover:text-[#8C6B3D] hover:bg-[#EFEAE1] px-2 py-0.5 rounded transition-colors"
        >
          + Nueva Hoja
        </button>
      </div>
    </div>
  );
}
