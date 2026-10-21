'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PageFormat, PageOrientation, PaperPattern } from '@/types/notebook-engine';
import {
  X,
  Sliders,
  Rows,
  Columns,
  Maximize2,
  FileText,
  Infinity as InfinityIcon,
  Check,
  Grid3X3,
  CircleDot,
  ListFilter,
  Square,
} from 'lucide-react';

interface SheetFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrientation: PageOrientation;
  currentFormat: PageFormat;
  currentPattern: PaperPattern;
  onApplyFormat: (config: {
    orientation: PageOrientation;
    format: PageFormat;
    pattern: PaperPattern;
    applyToAll: boolean;
  }) => void;
}

const FORMAT_OPTIONS: {
  id: PageFormat;
  title: string;
  desc: string;
  dimensions: string;
  icon: any;
}[] = [
  {
    id: 'a4',
    title: 'A4 Estándar',
    desc: 'Proporción internacional estándar (1:1.414).',
    dimensions: '210 × 297 mm',
    icon: FileText,
  },
  {
    id: 'a3',
    title: 'A3 Doble',
    desc: 'El doble de espacio de A4. Entran muchos más conceptos.',
    dimensions: '297 × 420 mm (1:1.414)',
    icon: Maximize2,
  },
  {
    id: 'a2',
    title: 'A2 Mural Póster',
    desc: 'Lienzo enorme para mapas conceptuales y esquemas.',
    dimensions: '420 × 594 mm (1:1.414)',
    icon: Maximize2,
  },
  {
    id: 'a1',
    title: 'A1 Lienzo Gigante',
    desc: 'Mural masivo para sintetizar materias completas.',
    dimensions: '594 × 841 mm (1:1.414)',
    icon: Maximize2,
  },
  {
    id: 'letter',
    title: 'Carta (Letter)',
    desc: 'Formato tradicional de libreta y apuntes.',
    dimensions: '216 × 279 mm',
    icon: FileText,
  },
  {
    id: 'legal',
    title: 'Oficio (Legal)',
    desc: 'Lámina larga para diagramas extensos.',
    dimensions: '216 × 356 mm',
    icon: Maximize2,
  },
  {
    id: 'infinite',
    title: 'Hoja Infinita',
    desc: 'Lienzo continuo sin corte vertical de altura.',
    dimensions: 'Scroll continuo ilimitado',
    icon: InfinityIcon,
  },
];

const PATTERN_OPTIONS: { id: PaperPattern; label: string; icon: any }[] = [
  { id: 'grid', label: 'Cuadrícula', icon: Grid3X3 },
  { id: 'dots', label: 'Puntos', icon: CircleDot },
  { id: 'ruled', label: 'Rayado', icon: ListFilter },
  { id: 'plain', label: 'Liso', icon: Square },
];

export default function SheetFormatModal({
  isOpen,
  onClose,
  currentOrientation,
  currentFormat,
  currentPattern,
  onApplyFormat,
}: SheetFormatModalProps) {
  const [orientation, setOrientation] = useState<PageOrientation>(currentOrientation || 'vertical');
  const [format, setFormat] = useState<PageFormat>(currentFormat || 'a4');
  const [pattern, setPattern] = useState<PaperPattern>(currentPattern || 'grid');
  const [applyToAll, setApplyToAll] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFormat({
      orientation,
      format,
      pattern,
      applyToAll,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-sans select-none overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#B5A591] rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-[#2E2822] my-auto overflow-hidden">
        {/* Header Fijo */}
        <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#DFD8CB] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EFEAE1] border border-[#DFD8CB] flex items-center justify-center text-[#8C6B3D]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2E2822]">Formato y Dimensiones de Hoja</h3>
              <p className="text-[11px] text-[#786E64]">
                Ajusta orientación, tamaño exacto (A4, Oficio, Carta) y patrón de papel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#786E64] hover:text-[#2E2822] hover:bg-[#EFEAE1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo Scrollable */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* 1. Orientación */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#685F54] mb-1.5">
              Orientación de la Hoja
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrientation('vertical')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  orientation === 'vertical'
                    ? 'bg-white border-[#8C6B3D] ring-2 ring-[#8C6B3D]/25 shadow-xs font-bold'
                    : 'bg-[#F5F2EB] border-[#DFD8CB] hover:bg-white text-[#5A5043]'
                }`}
              >
                <div className="w-5 h-7 rounded border border-current flex items-center justify-center shrink-0">
                  <Rows className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2E2822]">Vertical (Retrato)</div>
                  <div className="text-[10px] text-[#786E64]">Lectura y apunte estándar</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrientation('horizontal')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  orientation === 'horizontal'
                    ? 'bg-white border-[#8C6B3D] ring-2 ring-[#8C6B3D]/25 shadow-xs font-bold'
                    : 'bg-[#F5F2EB] border-[#DFD8CB] hover:bg-white text-[#5A5043]'
                }`}
              >
                <div className="w-7 h-5 rounded border border-current flex items-center justify-center shrink-0">
                  <Columns className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2E2822]">Horizontal (Apaisado)</div>
                  <div className="text-[10px] text-[#786E64]">Esquemas y mapas anchos</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Tamaño y Relación de Aspecto */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#685F54] mb-1.5">
              Tamaño y Proporción Real
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-white border-[#8C6B3D] ring-2 ring-[#8C6B3D]/25 shadow-xs'
                        : 'bg-[#F5F2EB] border-[#DFD8CB] hover:bg-white'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#8C6B3D] text-white' : 'bg-[#EFEAE1] text-[#8C6B3D]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2E2822]">{opt.title}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#8C6B3D]" />}
                      </div>
                      <p className="text-[10px] text-[#786E64] mt-0.5 leading-tight">{opt.desc}</p>
                      <span className="inline-block mt-0.5 text-[9px] font-mono text-[#8A7F73]">
                        {opt.dimensions}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Tipo de Papel */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#685F54] mb-1.5">
              Patrón del Papel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PATTERN_OPTIONS.map((p) => {
                const Icon = p.icon;
                const isSelected = pattern === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPattern(p.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-white border-[#8C6B3D] text-[#2E2822] font-bold ring-2 ring-[#8C6B3D]/25 shadow-xs'
                        : 'bg-[#F5F2EB] border-[#DFD8CB] text-[#685F54] hover:bg-white hover:text-[#2E2822]'
                    }`}
                  >
                    <Icon className="w-3 h-3 text-[#8C6B3D]" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Aplicar a todas las hojas */}
          <div className="pt-2 border-t border-[#DFD8CB]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-4 h-4 rounded border-[#D5CDBD] text-[#8C6B3D] focus:ring-[#8C6B3D]"
              />
              <span className="text-xs text-[#5A5043]">
                Aplicar este formato a todas las hojas del cuaderno
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center justify-end gap-2 pt-3 border-t border-[#DFD8CB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#786E64] hover:text-[#2E2822] hover:bg-[#EFEAE1] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8C6B3D] hover:bg-[#78592E] text-white transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
