'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PageBlock,
  FontSize,
  FontFamily,
} from '@/types/notebook-engine';
import { sanitizeMermaidCode } from '@sirbook/shared';
import {
  GripHorizontal,
  Type,
  Palette,
  Trash2,
  ZoomIn,
  ZoomOut,
  Edit3,
  Check,
  X,
  Plus,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface FluidNoteCardProps {
  block: PageBlock;
  isStudyMode?: boolean;
  sheetWidth?: number;
  sheetHeight?: number;
  onUpdateBlock: (updated: Partial<PageBlock>) => void;
  onRemoveBlock: () => void;
  onStartDrag?: (e: React.PointerEvent, blockId: string) => void;
}

const COLOR_PALETTES = [
  { id: '#FAF7F2', name: 'Marfil', border: '#DFD8CB' },
  { id: '#FEF9C3', name: 'Post-it Amarillo', border: '#FDE047' },
  { id: '#DCFCE7', name: 'Menta Suave', border: '#86EFAC' },
  { id: '#E0F2FE', name: 'Azul Apunte', border: '#7DD3FC' },
  { id: '#F3E8FF', name: 'Lavanda', border: '#D8B4FE' },
  { id: '#FFEDD5', name: 'Melocotón', border: '#FDBA74' },
  { id: '#FCE7F3', name: 'Rosa Suave', border: '#F472B6' },
  { id: '#EFE8DA', name: 'Kraft Vintage', border: '#D5CDBD' },
];

const INK_COLORS = [
  { id: '#2E2822', name: 'Carbón Grafito' },
  { id: '#784315', name: 'Sepia Cuaderno' },
  { id: '#1E3A5F', name: 'Azul Marino' },
  { id: '#14532D', name: 'Verde Bosque' },
  { id: '#7F1D1D', name: 'Vino Burdeos' },
];

export const FluidNoteCard: React.FC<FluidNoteCardProps> = ({
  block,
  isStudyMode = false,
  sheetWidth,
  sheetHeight,
  onUpdateBlock,
  onRemoveBlock,
  onStartDrag,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [isEditingMermaid, setIsEditingMermaid] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>(
    block.type === 'graphic' ? block.content?.codigo_render || '' : ''
  );
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [diagramScale, setDiagramScale] = useState<number>(0.85);

  const styleMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setShowStyleMenu(false);
      }
    };
    if (showStyleMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStyleMenu]);

  // Sincronizar Mermaid
  useEffect(() => {
    if (block.type === 'graphic') {
      setMermaidCode(block.content?.codigo_render || '');
    }
  }, [block.type, block.content?.codigo_render]);

  useEffect(() => {
    if (block.type !== 'graphic') return;
    const code = isEditingMermaid ? mermaidCode : block.content?.codigo_render;
    if (!code || !code.trim()) return;

    let isMounted = true;
    async function renderMermaid() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          themeVariables: {
            darkMode: false,
            background: 'transparent',
            primaryColor: '#EBE5D8',
            primaryTextColor: '#1C1917',
            primaryBorderColor: '#78716C',
            lineColor: '#57534E',
          },
        });
        const sanitized = sanitizeMermaidCode(code);
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, sanitized);
        if (isMounted) {
          const adjustedSvg = svg
            .replace(/style="[^"]*max-width:[^"]*"/g, 'style="max-width: 100%; height: auto;"')
            .replace(/<svg\s+([^>]*?)height="[^"]*"/g, '<svg $1 height="auto"')
            .replace(/<svg\s+([^>]*?)style="/g, '<svg $1 style="max-height: 100%; object-fit: contain; ');
          setSvgHtml(adjustedSvg);
          setMermaidError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setMermaidError(err?.message || 'Error de sintaxis Mermaid');
        }
      }
    }

    renderMermaid();
    return () => {
      isMounted = false;
    };
  }, [block.type, block.content?.codigo_render, mermaidCode, isEditingMermaid]);

  // Estilos aplicados
  const cardColor = block.cardColor || '#FAF7F2';
  const textColor = block.textColor || '#2E2822';
  const fontFamilyClass =
    block.fontFamily === 'handwriting'
      ? 'font-handwriting'
      : block.fontFamily === 'serif'
      ? 'font-serif-study'
      : block.fontFamily === 'mono'
      ? 'font-mono-study'
      : 'font-sans-study';

  const fontSizeClass =
    block.fontSize === 'xs'
      ? 'text-xs leading-relaxed'
      : block.fontSize === 'sm'
      ? 'text-sm leading-relaxed'
      : block.fontSize === 'lg'
      ? 'text-lg leading-relaxed'
      : block.fontSize === 'xl'
      ? 'text-xl leading-relaxed'
      : 'text-base leading-relaxed';

  // Manejo de edición de texto de Concepto
  const handleUpdateContentField = (field: string, value: any) => {
    onUpdateBlock({
      content: {
        ...block.content,
        [field]: value,
      },
    });
  };

  const handleUpdateTitle = (newTitle: string) => {
    onUpdateBlock({
      title: newTitle,
      content:
        typeof block.content === 'object' && block.content !== null
          ? { ...block.content, titulo: newTitle }
          : block.content,
    });
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-shadow shadow-xs hover:shadow-md flex flex-col ${fontFamilyClass} ${fontSizeClass}`}
      style={{
        backgroundColor: cardColor,
        color: textColor,
        borderColor: COLOR_PALETTES.find((c) => c.id === cardColor)?.border || '#DFD8CB',
        minWidth: '260px',
      }}
    >
      {/* Cabecera de la Tarjeta: Arrastre Libre + Acciones de Estilo */}
      <div
        onPointerDown={(e) => onStartDrag && onStartDrag(e, block.id)}
        className="px-3.5 py-2.5 flex items-center justify-between border-b border-black/8 cursor-grab active:cursor-grabbing select-none bg-black/[0.02] rounded-t-2xl"
      >
        {/* Indicador de arrastre y título */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="text-black/40 hover:text-black/80 transition-colors p-0.5 rounded cursor-grab">
            <GripHorizontal className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => handleUpdateTitle(e.target.value)}
            disabled={isStudyMode}
            placeholder="Título del concepto..."
            className="font-bold bg-transparent border-b border-transparent hover:border-black/20 focus:border-black/50 focus:outline-none truncate w-full text-sm transition-colors"
            style={{ color: textColor }}
          />
        </div>

        {/* Micro-toolbar de Personalización y Eliminación */}
        {!isStudyMode && (
          <div
            className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Botón para desplegar paleta de estilo */}
            <div className="relative" ref={styleMenuRef}>
              <button
                type="button"
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-black/5 hover:bg-black/10 text-xs font-medium transition-colors"
                title="Personalizar tipo de letra, tamaño y color"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold hidden sm:inline">Estilo</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {/* Menú Flotante de Estilo */}
              {showStyleMenu && (
                <div className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-xl bg-[#FAF7F2] border border-[#DFD8CB] shadow-xl p-3 text-[#2E2822] animate-in fade-in zoom-in-95 duration-100 font-sans">
                  {/* Selector de Tipo de Letra */}
                  <div className="mb-3">
                    <label className="text-[11px] font-bold text-[#786E64] uppercase tracking-wider block mb-1.5">
                      Tipo de Letra
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'sans', label: 'Moderna (Sans)' },
                          { id: 'serif', label: 'Elegante (Serif)' },
                          { id: 'handwriting', label: 'Manuscrita' },
                          { id: 'mono', label: 'Técnica (Mono)' },
                        ] as { id: FontFamily; label: string }[]
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onUpdateBlock({ fontFamily: f.id })}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium text-left border transition-all ${
                            block.fontFamily === f.id
                              ? 'bg-[#8C6B3D] text-white border-[#8C6B3D]'
                              : 'bg-white hover:bg-[#F3EDE2] text-[#4A4239] border-[#DFD8CB]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Tamaño de Letra */}
                  <div className="mb-3">
                    <label className="text-[11px] font-bold text-[#786E64] uppercase tracking-wider block mb-1.5">
                      Tamaño de Letra
                    </label>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#DFD8CB]">
                      {(
                        [
                          { id: 'xs', label: 'XS' },
                          { id: 'sm', label: 'S' },
                          { id: 'base', label: 'M' },
                          { id: 'lg', label: 'L' },
                          { id: 'xl', label: 'XL' },
                        ] as { id: FontSize; label: string }[]
                      ).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onUpdateBlock({ fontSize: s.id })}
                          className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                            block.fontSize === s.id
                              ? 'bg-[#8C6B3D] text-white'
                              : 'text-[#685F54] hover:bg-[#F3EDE2]'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Color de Tarjeta */}
                  <div className="mb-3">
                    <label className="text-[11px] font-bold text-[#786E64] uppercase tracking-wider block mb-1.5">
                      Color de Papel
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {COLOR_PALETTES.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => onUpdateBlock({ cardColor: color.id })}
                          className={`h-7 rounded-lg border flex items-center justify-center transition-all ${
                            cardColor === color.id ? 'ring-2 ring-[#8C6B3D] scale-105' : 'hover:scale-102'
                          }`}
                          style={{ backgroundColor: color.id, borderColor: color.border }}
                          title={color.name}
                        >
                          {cardColor === color.id && <Check className="w-3.5 h-3.5 text-[#2E2822]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Color de Tinta */}
                  <div>
                    <label className="text-[11px] font-bold text-[#786E64] uppercase tracking-wider block mb-1.5">
                      Color de Tinta
                    </label>
                    <div className="flex items-center gap-2">
                      {INK_COLORS.map((ink) => (
                        <button
                          key={ink.id}
                          type="button"
                          onClick={() => onUpdateBlock({ textColor: ink.id })}
                          className={`w-6 h-6 rounded-full border border-black/20 flex items-center justify-center transition-all ${
                            textColor === ink.id ? 'ring-2 ring-[#8C6B3D] scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: ink.id }}
                          title={ink.name}
                        >
                          {textColor === ink.id && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de eliminar */}
            <button
              type="button"
              onClick={onRemoveBlock}
              className="p-1.5 rounded-lg text-black/40 hover:text-red-700 hover:bg-red-500/10 transition-colors"
              title="Eliminar este apunte"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cuerpo del Contenido según Tipo de Bloque */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col overflow-auto custom-scrollbar">
        {/* 1. MODO CONCEPTO */}
        {block.type === 'concept' && (
          <div className="space-y-3.5">
            {/* Definición Corta */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-black/45 block mb-1">
                Definición
              </label>
              <textarea
                value={block.content?.definicion_corta || ''}
                onChange={(e) => handleUpdateContentField('definicion_corta', e.target.value)}
                disabled={isStudyMode}
                rows={3}
                placeholder="Definición o síntesis conceptual..."
                className="w-full bg-transparent border-b border-transparent hover:border-black/20 focus:border-black/40 focus:outline-none resize-none transition-colors"
                style={{ color: textColor }}
              />
            </div>

            {/* Puntos Clave */}
            {Array.isArray(block.content?.puntos_clave) && (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-black/45 block mb-1">
                  Puntos Clave
                </label>
                <ul className="space-y-1.5">
                  {block.content.puntos_clave.map((pt: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 group/pt">
                      <span className="text-[#8C6B3D] mt-1 shrink-0">•</span>
                      <input
                        type="text"
                        value={pt}
                        onChange={(e) => {
                          const updatedPts = [...block.content.puntos_clave];
                          updatedPts[idx] = e.target.value;
                          handleUpdateContentField('puntos_clave', updatedPts);
                        }}
                        disabled={isStudyMode}
                        className="w-full bg-transparent border-b border-transparent hover:border-black/20 focus:border-black/40 focus:outline-none text-xs sm:text-sm"
                        style={{ color: textColor }}
                      />
                      {!isStudyMode && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedPts = block.content.puntos_clave.filter(
                              (_: any, i: number) => i !== idx
                            );
                            handleUpdateContentField('puntos_clave', updatedPts);
                          }}
                          className="opacity-0 group-hover/pt:opacity-100 text-black/30 hover:text-red-600 transition-opacity p-0.5"
                          title="Quitar punto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {!isStudyMode && (
                  <button
                    type="button"
                    onClick={() => {
                      const updatedPts = [...(block.content.puntos_clave || []), 'Nuevo punto clave'];
                      handleUpdateContentField('puntos_clave', updatedPts);
                    }}
                    className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#8C6B3D] hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Añadir punto clave
                  </button>
                )}
              </div>
            )}

            {/* Aplicaciones prácticas si existen */}
            {Array.isArray(block.content?.aplicaciones) && block.content.aplicaciones.length > 0 && (
              <div className="pt-2 border-t border-black/8">
                <label className="text-[10px] uppercase font-bold tracking-wider text-black/45 block mb-1">
                  Aplicaciones Prácticas
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {block.content.aplicaciones.map((app: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-black/5 text-[11px] font-medium"
                      style={{ color: textColor }}
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Fuentes verificadas */}
            {Array.isArray(block.content?.fuentes) && block.content.fuentes.length > 0 && (
              <div className="pt-2 border-t border-black/8 text-[11px] text-black/50 flex flex-wrap gap-2 items-center">
                <span className="font-bold">Fuentes:</span>
                {block.content.fuentes.map((f: any, i: number) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-[#8C6B3D] flex items-center gap-0.5"
                  >
                    <span>{f.title || 'Fuente'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. MODO GRÁFICO (MERMAID) */}
        {block.type === 'graphic' && (
          <div className="flex-1 flex flex-col min-h-[220px]">
            {/* Controles de Zoom y Edición de Código */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/8 text-xs select-none">
              <span className="text-[11px] font-bold text-black/50">
                {block.content?.tipo_grafico || 'Diagrama Mermaid'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDiagramScale((prev) => Math.max(0.4, prev - 0.15))}
                  className="p-1 rounded bg-black/5 hover:bg-black/10 transition-colors"
                  title="Reducir zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDiagramScale((prev) => Math.min(2.0, prev + 0.15))}
                  className="p-1 rounded bg-black/5 hover:bg-black/10 transition-colors"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {!isStudyMode && (
                  <button
                    type="button"
                    onClick={() => setIsEditingMermaid(!isEditingMermaid)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#8C6B3D] text-white text-[11px] font-semibold hover:bg-[#74572E] transition-colors ml-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditingMermaid ? 'Ver Gráfico' : 'Editar Código'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Vista de Edición de Código Mermaid */}
            {isEditingMermaid ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={mermaidCode}
                  onChange={(e) => setMermaidCode(e.target.value)}
                  rows={8}
                  className="w-full flex-1 p-2.5 font-mono text-xs rounded-xl bg-black/5 border border-black/15 focus:outline-none focus:border-[#8C6B3D] resize-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingMermaid(false);
                    onUpdateBlock({
                      content: {
                        ...block.content,
                        codigo_render: mermaidCode,
                      },
                    });
                  }}
                  className="mt-2 py-1.5 rounded-lg bg-[#8C6B3D] text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Guardar Diagrama
                </button>
              </div>
            ) : (
              /* Vista del Renderizado SVG Mermaid */
              <div className="flex-1 flex flex-col items-center justify-center overflow-auto p-2 min-h-[160px]">
                {mermaidError ? (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-center">
                    <p className="font-bold">Error en diagrama Mermaid:</p>
                    <p className="font-mono text-[11px] mt-1">{mermaidError}</p>
                  </div>
                ) : svgHtml ? (
                  <div
                    className="w-full flex items-center justify-center transition-transform"
                    style={{ transform: `scale(${diagramScale})`, transformOrigin: 'center center' }}
                    dangerouslySetInnerHTML={{ __html: svgHtml }}
                  />
                ) : (
                  <p className="text-xs text-black/40 italic">Cargando diagrama...</p>
                )}

                {block.content?.descripcion_corta && (
                  <p className="text-xs text-black/60 italic text-center mt-2">
                    {block.content.descripcion_corta}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. MODO DATO CURIOSO */}
        {block.type === 'curiosity' && (
          <div className="space-y-2 text-center py-2">
            {block.content?.cifra_destacada && (
              <div className="text-2xl sm:text-3xl font-extrabold text-[#8C6B3D] tracking-tight">
                {block.content.cifra_destacada}
              </div>
            )}
            <textarea
              value={block.content?.explicacion || ''}
              onChange={(e) => handleUpdateContentField('explicacion', e.target.value)}
              disabled={isStudyMode}
              rows={3}
              placeholder="Explicación fascinante..."
              className="w-full text-center bg-transparent border-b border-transparent hover:border-black/20 focus:border-black/40 focus:outline-none resize-none font-medium"
              style={{ color: textColor }}
            />
          </div>
        )}

        {/* 4. MODO TEXTO LIBRE / POST-IT */}
        {(block.type === 'text' || block.type === 'sticky') && (
          <div className="flex-1 flex flex-col">
            {typeof block.content === 'object' && block.content?.titulo && (
              <div className="font-bold text-xs sm:text-sm mb-1.5 opacity-90">
                {block.content.titulo}
              </div>
            )}
            <textarea
              value={
                typeof block.content === 'string'
                  ? block.content
                  : block.content?.texto || block.content?.markdown || ''
              }
              onChange={(e) => {
                if (typeof block.content === 'object' && block.content !== null) {
                  onUpdateBlock({
                    content: {
                      ...block.content,
                      texto: e.target.value,
                    },
                  });
                } else {
                  onUpdateBlock({
                    content: e.target.value,
                  });
                }
              }}
              disabled={isStudyMode}
              rows={4}
              placeholder="Escribe notas, fórmulas o reflexiones libremente..."
              className="w-full flex-1 bg-transparent border-none focus:outline-none resize-none placeholder-black/40"
              style={{ color: textColor }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FluidNoteCard;
