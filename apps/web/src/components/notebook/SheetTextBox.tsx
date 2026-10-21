'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageBlock, FontSize, FontFamily } from '@/types/notebook-engine';
import { sanitizeMermaidCode } from '@sirbook/shared';
import {
  GripHorizontal,
  Wand2,
  BarChart3,
  Trash2,
  Loader2,
  ZoomIn,
  ZoomOut,
  Type,
  Palette,
  Check,
} from 'lucide-react';

interface SheetTextBoxProps {
  block: PageBlock;
  isStudyMode?: boolean;
  notebookTitle?: string;
  onUpdateBlock: (updated: Partial<PageBlock>) => void;
  onRemoveBlock: () => void;
  onStartDrag: (e: React.PointerEvent, blockId: string) => void;
}

const INK_PRESETS = [
  { id: '#2E2822', name: 'Carbón' },
  { id: '#1E3A5F', name: 'Azul Real' },
  { id: '#784315', name: 'Sepia' },
  { id: '#14532D', name: 'Verde' },
  { id: '#7F1D1D', name: 'Rojo' },
];

export const SheetTextBox: React.FC<SheetTextBoxProps> = ({
  block,
  isStudyMode = false,
  notebookTitle = 'General',
  onUpdateBlock,
  onRemoveBlock,
  onStartDrag,
}) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isEditingMermaid, setIsEditingMermaid] = useState(false);
  const [mermaidCode, setMermaidCode] = useState('');
  const [svgHtml, setSvgHtml] = useState('');
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [diagramScale, setDiagramScale] = useState(0.85);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Extraer texto plano
  const getInitialText = (): string => {
    if (typeof block.content === 'string') return block.content;
    if (!block.content) return block.title || '';
    if (block.type === 'graphic') return block.content.codigo_render || '';
    
    let text = block.content.texto || block.content.markdown || '';
    if (!text && block.content.definicion_corta) {
      text = block.title
        ? `${block.title}: ${block.content.definicion_corta}`
        : block.content.definicion_corta;
      if (Array.isArray(block.content.puntos_clave) && block.content.puntos_clave.length > 0) {
        text += '\n\n' + block.content.puntos_clave.map((p: string) => `• ${p}`).join('\n');
      }
    }
    if (!text && block.content.explicacion) {
      text = `${block.content.cifra_destacada || ''} ${block.content.explicacion}`.trim();
    }
    return text || block.title || '';
  };

  const [text, setText] = useState(getInitialText);

  useEffect(() => {
    setText(getInitialText());
  }, [block.content, block.title]);

  useEffect(() => {
    if (textareaRef.current && block.type !== 'graphic') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(48, textareaRef.current.scrollHeight)}px`;
    }
  }, [text, block.type]);

  // Diagrama Mermaid
  useEffect(() => {
    if (block.type !== 'graphic') return;
    const code = block.content?.codigo_render || text;
    setMermaidCode(code);
    if (!code || !code.trim()) return;

    let isMounted = true;
    async function renderMermaid() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Caveat, Inter, system-ui, sans-serif',
          themeVariables: {
            darkMode: false,
            background: 'transparent',
            primaryColor: '#FAF7F2',
            primaryTextColor: '#2E2822',
            primaryBorderColor: '#8C6B3D',
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
          setMermaidError(err?.message || 'Error de diagrama');
        }
      }
    }

    renderMermaid();
    return () => {
      isMounted = false;
    };
  }, [block.type, block.content?.codigo_render, text]);

  // Deseleccionar al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setIsSelected(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  // Adivinar concepto con IA a partir de las palabras escritas
  const handleAdivinarConcepto = async () => {
    const rawKeyword = text.trim();
    if (!rawKeyword) {
      textareaRef.current?.focus();
      return;
    }

    setIsLoadingAI(true);
    try {
      const res = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: rawKeyword, context: notebookTitle }),
      });
      const data = await res.json();

      let addition = '';
      if (data.success && data.summary) {
        addition = `: ${data.summary}`;
      } else {
        const genRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: rawKeyword, mode: 'concept', notebookTitle }),
        });
        const genData = await genRes.json();
        if (genData.success && genData.content) {
          const c = genData.content;
          addition = `: ${c.definicion_corta || ''}`;
          if (Array.isArray(c.puntos_clave) && c.puntos_clave.length > 0) {
            addition += '\n\n' + c.puntos_clave.map((p: string) => `• ${p}`).join('\n');
          }
        }
      }

      if (addition) {
        const newText = rawKeyword + addition;
        setText(newText);
        onUpdateBlock({ content: newText, title: rawKeyword.slice(0, 30) });
      }
    } catch (err) {
      console.warn('[Smart Guess] Error:', err);
    } finally {
      setIsLoadingAI(false);
      textareaRef.current?.focus();
    }
  };

  // Convertir palabra clave en diagrama Excalidraw / Mermaid
  const handleInsertarGrafico = async () => {
    const rawKeyword = text.trim();
    if (!rawKeyword) return;

    setIsLoadingAI(true);
    try {
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: rawKeyword, mode: 'graphic', notebookTitle }),
      });
      const genData = await genRes.json();
      if (genData.success && genData.content?.codigo_render) {
        onUpdateBlock({
          type: 'graphic',
          title: genData.content.titulo || rawKeyword,
          content: genData.content,
          width: Math.max(420, block.width || 420),
        });
      }
    } catch (err) {
      console.warn('[Graphic Generation] Error:', err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Resize interactivo desde esquina inferior derecha
  const handleCornerResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = boxRef.current?.offsetWidth || block.width || 320;
    const startHeight = boxRef.current?.offsetHeight || 80;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const newWidth = Math.max(160, startWidth + deltaX);
      const newHeight = Math.max(50, startHeight + deltaY);

      if (boxRef.current) {
        boxRef.current.style.width = `${newWidth}px`;
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const deltaX = upEvent.clientX - startX;
      const newWidth = Math.max(160, startWidth + deltaX);
      onUpdateBlock({ width: Math.round(newWidth) });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const width = block.width || 320;
  const pos = block.position || { x: 40, y: 100 };
  const textColor = block.textColor || '#2E2822';

  const fontClass =
    block.fontFamily === 'handwriting'
      ? 'font-handwriting'
      : block.fontFamily === 'mono'
      ? 'font-mono-study'
      : 'font-sans-study';

  const sizeClass =
    block.fontSize === 'xs'
      ? 'text-xs'
      : block.fontSize === 'lg'
      ? 'text-lg font-medium'
      : block.fontSize === 'xl'
      ? 'text-xl font-bold'
      : 'text-sm sm:text-base';

  return (
    <div
      ref={boxRef}
      onClick={(e) => {
        e.stopPropagation();
        setIsSelected(true);
      }}
      onDoubleClick={() => {
        setIsEditing(true);
        setTimeout(() => textareaRef.current?.focus(), 20);
      }}
      style={{
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${width}px`,
        minWidth: '180px',
      }}
      className={`group select-text transition-all rounded-xl ${
        isSelected
          ? 'ring-2 ring-blue-500/80 bg-blue-50/10'
          : 'hover:ring-1 hover:ring-black/20'
      }`}
    >
      {/* 1. Barra de Propiedades Flotante Excalidraw Style (Aparece cuando el elemento está seleccionado) */}
      {!isStudyMode && isSelected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-10 left-0 z-40 flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DFD8CB] rounded-full px-2.5 py-1 shadow-lg text-xs text-[#2E2822] animate-in fade-in duration-100 select-none font-sans"
        >
          {/* Tamaño de fuente Excalidraw (S, M, L, XL) */}
          <div className="flex items-center gap-0.5 bg-black/5 rounded-full p-0.5">
            {(
              [
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
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  (block.fontSize || 'base') === s.id
                    ? 'bg-[#8C6B3D] text-white shadow-2xs'
                    : 'text-[#685F54] hover:bg-black/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Tipo de fuente: Manuscrita (Excalidraw Virgil) vs Sans */}
          <button
            type="button"
            onClick={() =>
              onUpdateBlock({
                fontFamily: block.fontFamily === 'handwriting' ? 'sans' : 'handwriting',
              })
            }
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
              block.fontFamily === 'handwriting'
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-handwriting text-sm'
                : 'bg-white border-[#DFD8CB] text-[#5A5043]'
            }`}
            title="Alternar entre trazo manuscrito Excalidraw y fuente estándar"
          >
            {block.fontFamily === 'handwriting' ? 'Virgil ✍️' : 'Sans'}
          </button>

          <span className="text-[#D5CDBD]">|</span>

          {/* Selector de color de tinta Excalidraw */}
          <div className="flex items-center gap-1">
            {INK_PRESETS.map((ink) => (
              <button
                key={ink.id}
                type="button"
                onClick={() => onUpdateBlock({ textColor: ink.id })}
                className={`w-4 h-4 rounded-full border border-black/20 transition-transform ${
                  textColor === ink.id ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: ink.id }}
                title={ink.name}
              />
            ))}
          </div>

          <span className="text-[#D5CDBD]">|</span>

          {/* Adivinar con IA */}
          <button
            type="button"
            onClick={handleAdivinarConcepto}
            disabled={isLoadingAI}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] transition-colors disabled:opacity-50"
            title="Adivinar y completar concepto con IA"
          >
            {isLoadingAI ? (
              <Loader2 className="w-3 h-3 animate-spin text-amber-800" />
            ) : (
              <Wand2 className="w-3 h-3 text-amber-800" />
            )}
            <span>Adivinar</span>
          </button>

          {/* Convertir a Gráfico */}
          <button
            type="button"
            onClick={handleInsertarGrafico}
            disabled={isLoadingAI}
            className="p-1 rounded-full hover:bg-black/5 text-[#5A5043] transition-colors disabled:opacity-50"
            title="Convertir a gráfico visual Mermaid"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>

          {/* Eliminar elemento */}
          <button
            type="button"
            onClick={onRemoveBlock}
            className="p-1 rounded-full hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
            title="Eliminar elemento"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Asa de Arrastre Libre Excalidraw */}
      {!isStudyMode && isSelected && (
        <div
          onPointerDown={(e) => onStartDrag(e, block.id)}
          className="absolute -top-3 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing p-0.5 bg-white border border-blue-500 rounded-sm text-blue-600 shadow-xs z-30"
          title="Arrastrar para mover elemento libremente"
        >
          <GripHorizontal className="w-3.5 h-3.5" />
        </div>
      )}

      {/* 3. Manijas de esquina Excalidraw (4 puntos azules en las esquinas al seleccionar) */}
      {!isStudyMode && isSelected && (
        <>
          <div className="w-2 h-2 rounded-xs bg-white border border-blue-600 absolute -top-1 -left-1 shadow-2xs z-30 pointer-events-none" />
          <div className="w-2 h-2 rounded-xs bg-white border border-blue-600 absolute -top-1 -right-1 shadow-2xs z-30 pointer-events-none" />
          <div className="w-2 h-2 rounded-xs bg-white border border-blue-600 absolute -bottom-1 -left-1 shadow-2xs z-30 pointer-events-none" />
          <div
            onPointerDown={handleCornerResize}
            className="w-2.5 h-2.5 rounded-xs bg-white border-2 border-blue-600 absolute -bottom-1.5 -right-1.5 shadow-xs z-40 cursor-nwse-resize hover:scale-125 transition-transform"
            title="Arrastra para redimensionar el ancho"
          />
        </>
      )}

      {/* 4. Contenido Real: Diagrama Mermaid o Texto Puro en el Lienzo */}
      {block.type === 'graphic' ? (
        <div className="p-3 flex flex-col items-center justify-center min-h-[160px]">
          <div className="w-full flex items-center justify-between pb-1.5 mb-2 border-b border-black/10 text-xs">
            <span className="font-bold text-xs text-[#2E2822]">{block.title || 'Diagrama'}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDiagramScale((p) => Math.max(0.4, p - 0.15))}
                className="p-1 rounded hover:bg-black/5"
                title="Alejar"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setDiagramScale((p) => Math.min(2.0, p + 0.15))}
                className="p-1 rounded hover:bg-black/5"
                title="Acercar"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              {!isStudyMode && (
                <button
                  type="button"
                  onClick={() => setIsEditingMermaid(!isEditingMermaid)}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-black/5 hover:bg-black/10"
                >
                  {isEditingMermaid ? 'Ver' : 'Código'}
                </button>
              )}
            </div>
          </div>

          {isEditingMermaid ? (
            <textarea
              value={mermaidCode}
              onChange={(e) => {
                setMermaidCode(e.target.value);
                onUpdateBlock({
                  content: { ...block.content, codigo_render: e.target.value },
                });
              }}
              rows={6}
              className="w-full p-2 font-mono text-xs bg-white/80 border border-black/15 rounded-lg focus:outline-none"
            />
          ) : mermaidError ? (
            <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
              {mermaidError}
            </div>
          ) : svgHtml ? (
            <div
              className="w-full flex items-center justify-center"
              style={{ transform: `scale(${diagramScale})`, transformOrigin: 'center center' }}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          ) : (
            <p className="text-xs text-stone-500 italic">Cargando gráfico...</p>
          )}
        </div>
      ) : (
        /* Escritura Pura en el Lienzo de Papel (Sin marco de tarjeta) */
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onUpdateBlock({
              content: e.target.value,
              title: e.target.value.split('\n')[0].slice(0, 35) || 'Apunte',
            });
          }}
          onFocus={() => {
            setIsSelected(true);
            setIsEditing(true);
          }}
          disabled={isStudyMode}
          placeholder="Escribe directamente en la hoja..."
          className={`w-full h-full p-2 bg-transparent border-none focus:outline-none resize-none leading-relaxed overflow-hidden ${fontClass} ${sizeClass}`}
          style={{ color: textColor, minHeight: '48px' }}
        />
      )}
    </div>
  );
};

export default SheetTextBox;
