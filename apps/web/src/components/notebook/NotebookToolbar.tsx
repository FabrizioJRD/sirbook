'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Layers,
  BookOpen,
  Edit3,
  Sliders,
  Download,
  Loader2,
  MousePointer2,
  Type,
  Pencil,
  Wand2,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
  Eraser,
  Check,
  ChevronDown,
  Hand,
} from 'lucide-react';
import { DigitalNotebook, PaperPattern, PageOrientation, PageFormat, ExcalidrawShapeType } from '@/types/notebook-engine';
import SheetFormatModal from './SheetFormatModal';

export type CanvasTool = 'select' | 'hand' | 'pencil' | 'text' | 'shape' | 'eraser' | 'ai';

interface NotebookToolbarProps {
  notebook: DigitalNotebook;
  activePageIndex: number;
  totalPages: number;
  mode: 'edit' | 'study';
  orientation: PageOrientation;
  pageFormat?: PageFormat;
  paperPattern: PaperPattern;
  canUndo: boolean;
  canRedo: boolean;
  isExportingPdf?: boolean;
  activeTool?: CanvasTool;
  activeColor?: string;
  penSize?: number;
  activeShapeType?: ExcalidrawShapeType;
  onSelectTool?: (tool: CanvasTool) => void;
  onSelectColor?: (color: string) => void;
  onSelectPenSize?: (size: number) => void;
  onSelectShapeType?: (shapeType: ExcalidrawShapeType) => void;
  onOpenAIPrompt?: () => void;
  onBackToGallery: () => void;
  onToggleMode: () => void;
  onToggleOrientation: () => void;
  onSelectPattern: (pattern: PaperPattern) => void;
  onApplyPageFormat: (config: {
    orientation: PageOrientation;
    format: PageFormat;
    pattern: PaperPattern;
    applyToAll: boolean;
  }) => void;
  onExportPdf: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenThumbnailsDrawer: () => void;
  onAddPage: () => void;
}

const INK_PRESETS = [
  { id: '#2E2822', name: 'Carbón' },
  { id: '#1E3A5F', name: 'Azul Real' },
  { id: '#784315', name: 'Sepia' },
  { id: '#14532D', name: 'Verde' },
  { id: '#7F1D1D', name: 'Rojo' },
];

export default function NotebookToolbar({
  notebook,
  activePageIndex,
  totalPages,
  mode,
  orientation,
  pageFormat = 'a4',
  paperPattern,
  canUndo,
  canRedo,
  isExportingPdf = false,
  activeTool = 'pencil',
  activeColor = '#2E2822',
  penSize = 3,
  activeShapeType = 'rectangle',
  onSelectTool,
  onSelectColor,
  onSelectPenSize,
  onSelectShapeType,
  onOpenAIPrompt,
  onBackToGallery,
  onToggleMode,
  onToggleOrientation,
  onSelectPattern,
  onApplyPageFormat,
  onExportPdf,
  onUndo,
  onRedo,
  onOpenThumbnailsDrawer,
  onAddPage,
}: NotebookToolbarProps) {
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);

  const formatLabel =
    pageFormat === 'legal'
      ? 'Oficio'
      : pageFormat === 'letter'
      ? 'Carta'
      : pageFormat === 'infinite'
      ? 'Infinita'
      : pageFormat === 'a3'
      ? 'A3'
      : pageFormat === 'a2'
      ? 'A2'
      : pageFormat === 'a1'
      ? 'A1'
      : 'A4';

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#DFD8CB] px-3 sm:px-5 py-2 flex items-center justify-between text-[#2E2822] shadow-2xs select-none">
      {/* 1. Left Section: Samsung Notes Brand, Back Arrow, Notebook Title & Auto-Save Badge */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onBackToGallery}
          className="p-1.5 rounded-xl hover:bg-[#EFEAE1] text-[#5A5043] transition-colors active:scale-95"
          title="Regresar a la Galería"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
            style={{ backgroundColor: notebook.coverColor }}
          />
          <span className="font-bold text-sm sm:text-base text-[#2E2822] truncate max-w-[120px] sm:max-w-[220px]">
            {notebook.title}
          </span>
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Guardado
          </span>

          {/* Badge de Herramienta Activa (movido de la hoja a la barra superior) */}
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono font-bold tracking-wider text-[#786E64] uppercase px-2.5 py-0.5 rounded-full bg-black/5 border border-black/5">
            {activeTool === 'pencil'
              ? '✍️ Pluma'
              : activeTool === 'hand'
              ? '✋ Mano'
              : activeTool === 'text'
              ? 'T Texto'
              : activeTool === 'shape'
              ? `▢ Forma (${activeShapeType})`
              : activeTool === 'eraser'
              ? '🧹 Borrador'
              : 'V Selector'}
          </span>
        </div>
      </div>

      {/* 2. Center Section: Iconic Samsung Notes One UI Floating Tool Pill */}
      <div className="flex items-center gap-1 bg-[#EFEAE1]/90 border border-[#D5CDBD] p-1 rounded-full shadow-2xs">
        {/* Puntero / Selección (V) */}
        <button
          type="button"
          onClick={() => onSelectTool && onSelectTool('select')}
          className={`p-2 rounded-full transition-all ${
            activeTool === 'select'
              ? 'bg-[#2E2822] text-white shadow-xs'
              : 'text-[#685F54] hover:bg-black/5 hover:text-[#2E2822]'
          }`}
          title="Seleccionar y mover elementos (V)"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        {/* Mano / Desplazarse por el lienzo (H / Espacio) */}
        <button
          type="button"
          onClick={() => onSelectTool && onSelectTool('hand')}
          className={`p-2 rounded-full transition-all ${
            activeTool === 'hand'
              ? 'bg-[#2E2822] text-white shadow-xs'
              : 'text-[#685F54] hover:bg-black/5 hover:text-[#2E2822]'
          }`}
          title="Mano para desplazarse por el lienzo (H / Mantén Espacio)"
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Pluma / Trazo Libre Excalidraw (P) */}
        <button
          type="button"
          onClick={() => onSelectTool && onSelectTool('pencil')}
          className={`p-2 rounded-full transition-all ${
            activeTool === 'pencil'
              ? 'bg-[#2E2822] text-white shadow-xs'
              : 'text-[#685F54] hover:bg-black/5 hover:text-[#2E2822]'
          }`}
          title="Pluma / Dibujo a mano alzada Excalidraw (P)"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Texto libre en la hoja (T) */}
        <button
          type="button"
          onClick={() => onSelectTool && onSelectTool('text')}
          className={`p-2 rounded-full transition-all ${
            activeTool === 'text'
              ? 'bg-[#2E2822] text-white shadow-xs'
              : 'text-[#685F54] hover:bg-black/5 hover:text-[#2E2822]'
          }`}
          title="Texto directo en el lienzo - Clic en la hoja para escribir (T)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Formas Excalidraw (R) con selector rápido */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (onSelectTool) onSelectTool('shape');
              setShowShapePicker(!showShapePicker);
            }}
            className={`flex items-center gap-0.5 p-2 rounded-full transition-all ${
              activeTool === 'shape'
                ? 'bg-[#2E2822] text-white shadow-xs'
                : 'text-[#685F54] hover:bg-black/5 hover:text-[#2E2822]'
            }`}
            title="Formas Excalidraw (R)"
          >
            {activeShapeType === 'ellipse' ? (
              <Circle className="w-4 h-4" />
            ) : activeShapeType === 'diamond' ? (
              <Diamond className="w-4 h-4" />
            ) : activeShapeType === 'arrow' ? (
              <ArrowRight className="w-4 h-4" />
            ) : activeShapeType === 'line' ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {showShapePicker && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-40 bg-[#FAF7F2] border border-[#DFD8CB] rounded-2xl p-1.5 shadow-xl flex items-center gap-1 animate-in fade-in duration-100">
              {[
                { type: 'rectangle' as ExcalidrawShapeType, icon: Square, label: 'Rectángulo' },
                { type: 'ellipse' as ExcalidrawShapeType, icon: Circle, label: 'Círculo' },
                { type: 'diamond' as ExcalidrawShapeType, icon: Diamond, label: 'Rombo' },
                { type: 'arrow' as ExcalidrawShapeType, icon: ArrowRight, label: 'Flecha' },
                { type: 'line' as ExcalidrawShapeType, icon: Minus, label: 'Línea' },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.type}
                    type="button"
                    onClick={() => {
                      if (onSelectShapeType) onSelectShapeType(s.type);
                      if (onSelectTool) onSelectTool('shape');
                      setShowShapePicker(false);
                    }}
                    className={`p-2 rounded-xl transition-colors ${
                      activeShapeType === s.type
                        ? 'bg-[#8C6B3D] text-white shadow-xs'
                        : 'text-[#685F54] hover:bg-black/10'
                    }`}
                    title={s.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Borrador (E) */}
        <button
          type="button"
          onClick={() => onSelectTool && onSelectTool('eraser')}
          className={`p-2 rounded-full transition-all ${
            activeTool === 'eraser'
              ? 'bg-[#2E2822] text-white shadow-xs'
              : 'text-[#685F54] hover:bg-black/5 hover:text-[#2E2822]'
          }`}
          title="Borrador de trazos y elementos (E)"
        >
          <Eraser className="w-4 h-4" />
        </button>

        {/* IA Generativa (Galaxy AI / Excalidraw Style) */}
        <button
          type="button"
          onClick={() => {
            if (onOpenAIPrompt) onOpenAIPrompt();
            if (onSelectTool) onSelectTool('ai');
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
            activeTool === 'ai'
              ? 'bg-[#8C6B3D] text-white shadow-xs'
              : 'bg-amber-100/70 hover:bg-amber-200/80 text-amber-900 border border-amber-300/80'
          }`}
          title="Generar diagramas o conceptos con IA estilo Excalidraw (Ctrl+J)"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Generar IA</span>
        </button>

        <div className="h-4 w-px bg-[#D5CDBD] mx-0.5" />

        {/* Selector de Tinta y Grosor */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-6 h-6 rounded-full border-2 border-white shadow-xs transition-transform hover:scale-110 flex items-center justify-center mx-1"
            style={{ backgroundColor: activeColor }}
            title="Color de tinta y grosor de pluma"
          />

          {showColorPicker && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-40 bg-[#FAF7F2] border border-[#DFD8CB] rounded-2xl p-3 shadow-xl flex flex-col gap-2.5 animate-in fade-in duration-100 min-w-[200px]">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">Color</span>
                <div className="flex items-center gap-1.5">
                  {INK_PRESETS.map((ink) => (
                    <button
                      key={ink.id}
                      type="button"
                      onClick={() => {
                        if (onSelectColor) onSelectColor(ink.id);
                      }}
                      className={`w-6 h-6 rounded-full border border-black/20 flex items-center justify-center transition-all ${
                        activeColor === ink.id ? 'ring-2 ring-[#8C6B3D] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: ink.id }}
                      title={ink.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">Grosor de Pluma</span>
                <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-full">
                  {[
                    { size: 2, label: 'Fino' },
                    { size: 4, label: 'Medio' },
                    { size: 8, label: 'Grueso' },
                  ].map((p) => (
                    <button
                      key={p.size}
                      type="button"
                      onClick={() => onSelectPenSize && onSelectPenSize(p.size)}
                      className={`flex-1 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        penSize === p.size
                          ? 'bg-[#8C6B3D] text-white shadow-xs'
                          : 'text-[#685F54] hover:bg-black/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right Section: Undo/Redo, Page Manager, Format, PDF & Study Mode */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Deshacer / Rehacer */}
        <div className="flex items-center bg-[#EFEAE1] border border-[#D5CDBD] rounded-xl p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-[#5A5043] hover:text-[#2E2822] hover:bg-white/70 disabled:opacity-30 transition-all"
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-[#5A5043] hover:text-[#2E2822] hover:bg-white/70 disabled:opacity-30 transition-all"
            title="Rehacer (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Indicador y Navegador de Páginas Samsung Notes */}
        <button
          onClick={onOpenThumbnailsDrawer}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E5DFD4] text-[#4A4239] border border-[#D5CDBD] text-xs font-semibold shadow-2xs transition-colors"
          title="Ver miniaturas de todas las hojas"
        >
          <span className="font-mono text-[11px] font-bold text-[#8C6B3D]">
            {activePageIndex + 1}/{totalPages}
          </span>
          <Layers className="w-3.5 h-3.5 opacity-70" />
        </button>

        {/* Formato de Hoja */}
        <button
          onClick={() => setIsFormatModalOpen(true)}
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E5DFD4] text-[#4A4239] border border-[#D5CDBD] text-xs font-semibold transition-colors"
          title="Ajustar tamaño de hoja (A4, A3, Carta, etc.)"
        >
          <Sliders className="w-3.5 h-3.5 text-[#8C6B3D]" />
          <span>{formatLabel}</span>
        </button>

        {/* Exportar PDF */}
        <button
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#EFEAE1] hover:bg-[#E5DFD4] text-[#4A4239] border border-[#D5CDBD] text-xs font-semibold transition-colors flex items-center gap-1"
          title="Exportar cuaderno a PDF"
        >
          {isExportingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#8C6B3D]" />
          ) : (
            <>
              <Download className="w-4 h-4 text-[#8C6B3D]" />
              <span className="hidden sm:inline">PDF</span>
            </>
          )}
        </button>

        {/* Modo Estudio / Edición */}
        <button
          onClick={onToggleMode}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
            mode === 'study'
              ? 'bg-[#8C6B3D] text-white border-[#8C6B3D] shadow-xs'
              : 'bg-[#EFEAE1] text-[#4A4239] border-[#D5CDBD] hover:bg-[#E5DFD4]'
          }`}
          title="Alternar entre modo edición libre y modo estudio 3D"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{mode === 'study' ? 'Lectura' : 'Edición'}</span>
        </button>
      </div>

      {/* Modal para Editar Formato y Dimensiones de la Hoja */}
      <SheetFormatModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        currentOrientation={orientation}
        currentFormat={pageFormat}
        currentPattern={paperPattern}
        onApplyFormat={onApplyPageFormat}
      />
    </header>
  );
}
