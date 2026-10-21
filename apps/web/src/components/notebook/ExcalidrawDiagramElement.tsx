'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sanitizeMermaidCode } from '@sirbook/shared';
import {
  Trash2,
  ZoomIn,
  ZoomOut,
  Edit2,
  Check,
} from 'lucide-react';

interface ExcalidrawDiagramElementProps {
  id: string;
  title: string;
  code: string;
  x: number;
  y: number;
  width?: number;
  isSelected?: boolean;
  isPendingDelete?: boolean;
  isStudyMode?: boolean;
  isHandActive?: boolean;
  dragTransform?: string;
  onSelect: () => void;
  onUpdate: (updated: { title?: string; code?: string; width?: number }) => void;
  onDelete: () => void;
  onStartDrag: (e: React.PointerEvent) => void;
}

export const ExcalidrawDiagramElement: React.FC<ExcalidrawDiagramElementProps> = ({
  id,
  title,
  code,
  x,
  y,
  width = 460,
  isSelected = false,
  isPendingDelete = false,
  isStudyMode = false,
  isHandActive = false,
  dragTransform,
  onSelect,
  onUpdate,
  onDelete,
  onStartDrag,
}) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [rawCode, setRawCode] = useState(code);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    setRawCode(code);
  }, [code]);

  useEffect(() => {
    if (!rawCode || !rawCode.trim()) return;
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

        const sanitized = sanitizeMermaidCode(rawCode);
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, sanitized);

        if (isMounted) {
          const adjusted = svg
            .replace(/style="[^"]*max-width:[^"]*"/g, 'style="max-width: 100%; height: auto;"')
            .replace(/<svg\s+([^>]*?)height="[^"]*"/g, '<svg $1 height="auto"')
            .replace(/<svg\s+([^>]*?)style="/g, '<svg $1 style="max-height: 100%; object-fit: contain; ');
          setSvgHtml(adjusted);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error al compilar diagrama');
        }
      }
    }

    renderMermaid();
    return () => {
      isMounted = false;
    };
  }, [rawCode]);

  return (
    <div
      data-element-id={id}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        transform: dragTransform,
        willChange: dragTransform ? 'transform' : 'auto',
      }}
      onPointerDown={(e) => {
        if (isEditingCode) return;
        if (isHandActive) return; // Allow bubbling to canvas pan
        e.preventDefault();
        e.stopPropagation();
        window.getSelection()?.removeAllRanges();
        onSelect();
        onStartDrag(e);
      }}
      className={`relative select-none cursor-move ${
        isPendingDelete
          ? 'opacity-25 filter grayscale blur-[0.5px]'
          : isSelected
          ? 'border border-[#854cd6] bg-[#854cd6]/[0.02]'
          : 'border border-transparent hover:border-[#854cd6]/30'
      }`}
    >
      {/* 1. Barra Flotante de Herramientas Excalidraw */}
      {!isStudyMode && isSelected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-10 left-0 z-40 flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DFD8CB] rounded-full px-2.5 py-1 shadow-lg text-xs text-[#2E2822] animate-in fade-in duration-100 select-none font-sans"
        >
          <span className="font-bold text-[11px] text-[#5A5043] truncate max-w-[140px] px-1">
            {title || 'Diagrama'}
          </span>

          <span className="text-[#D5CDBD]">|</span>

          {/* Zoom In / Out */}
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
            className="p-1 rounded-full hover:bg-black/5"
            title="Reducir escala"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
            className="p-1 rounded-full hover:bg-black/5"
            title="Aumentar escala"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span className="text-[#D5CDBD]">|</span>

          {/* Editar Código */}
          <button
            type="button"
            onClick={() => setIsEditingCode(!isEditingCode)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              isEditingCode ? 'bg-[#8C6B3D] text-white' : 'bg-black/5 hover:bg-black/10'
            }`}
          >
            <Edit2 className="w-3 h-3" />
            <span>{isEditingCode ? 'Listo' : 'Código'}</span>
          </button>

          {/* Eliminar */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-full hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
            title="Eliminar diagrama"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Manijas y Rotación estilo Excalidraw */}
      {!isStudyMode && isSelected && (
        <>
          {/* Manija de rotación superior con vástago */}
          <div className="w-[1.5px] h-3 bg-[#854cd6] absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="w-2 h-2 rounded-full bg-white border border-[#854cd6] absolute -top-[18px] left-1/2 -translate-x-1/2 pointer-events-none shadow-2xs" />

          {/* 4 Esquinas Excalidraw */}
          <div className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -top-1 -left-1 shadow-2xs z-30 pointer-events-none" />
          <div className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -top-1 -right-1 shadow-2xs z-30 pointer-events-none" />
          <div className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -bottom-1 -left-1 shadow-2xs z-30 pointer-events-none" />
          <div className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -bottom-1 -right-1 shadow-2xs z-30 pointer-events-none" />
        </>
      )}

      {/* 4. Contenido Real del Diagrama */}
      <div className="p-2 flex flex-col items-center justify-center min-h-[140px]">
        {isEditingCode ? (
          <textarea
            value={rawCode}
            onChange={(e) => {
              setRawCode(e.target.value);
              onUpdate({ code: e.target.value });
            }}
            rows={6}
            className="w-full p-2 font-mono text-xs bg-white/90 border border-black/15 rounded-lg focus:outline-none"
          />
        ) : error ? (
          <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
            {error}
          </div>
        ) : svgHtml ? (
          <div
            className="w-full flex items-center justify-center transition-transform"
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <p className="text-xs text-stone-500 italic">Renderizando diagrama...</p>
        )}
      </div>
    </div>
  );
};

export default ExcalidrawDiagramElement;
