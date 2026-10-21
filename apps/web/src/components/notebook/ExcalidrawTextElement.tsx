'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wand2,
  BarChart3,
  Trash2,
  Loader2,
} from 'lucide-react';

interface ExcalidrawTextElementProps {
  id: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
  fontFamily?: 'handwriting' | 'sans';
  color?: string;
  isSelected?: boolean;
  isEditing?: boolean;
  isPendingDelete?: boolean;
  zoomLevel?: number;
  isStudyMode?: boolean;
  notebookTitle?: string;
  isHandActive?: boolean;
  dragTransform?: string;
  onSelect: () => void;
  onStartEditing: () => void;
  onFinishEditing: (newText: string) => void;
  onChangeText: (newText: string) => void;
  onUpdateProps: (props: { fontSize?: number; fontFamily?: 'handwriting' | 'sans'; color?: string; width?: number }) => void;
  onDelete: () => void;
  onStartDrag: (e: React.PointerEvent) => void;
  onConvertToDiagram?: () => void;
}

const INK_PRESETS = [
  { id: '#2E2822', name: 'Carbón' },
  { id: '#1E3A5F', name: 'Azul Real' },
  { id: '#784315', name: 'Sepia' },
  { id: '#14532D', name: 'Verde' },
  { id: '#7F1D1D', name: 'Rojo' },
];

export const ExcalidrawTextElement: React.FC<ExcalidrawTextElementProps> = ({
  id,
  text,
  x,
  y,
  width,
  fontSize = 20,
  fontFamily = 'handwriting',
  color = '#2E2822',
  isSelected = false,
  isEditing = false,
  isPendingDelete = false,
  zoomLevel = 1.0,
  isStudyMode = false,
  notebookTitle = 'General',
  isHandActive = false,
  dragTransform,
  onSelect,
  onStartEditing,
  onFinishEditing,
  onChangeText,
  onUpdateProps,
  onDelete,
  onStartDrag,
  onConvertToDiagram,
}) => {
  const [editText, setEditText] = useState(text);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [isGuessing, setIsGuessing] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueriedRef = useRef<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditText(text);
  }, [text]);

  // Adivinar concepto automáticamente por defecto mientras el usuario escribe
  useEffect(() => {
    if (!isEditing) {
      setAiSuggestion('');
      return;
    }

    const trimmed = editText.trim();
    // Predecir si tiene al menos 2 caracteres y no contiene saltos de línea de párrafo largo
    if (trimmed.length < 2 || trimmed.includes('\n\n')) {
      setAiSuggestion('');
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Si el texto ya tiene una definición completa con ':', no predecir otra
      if (trimmed.includes(':') && trimmed.split(':')[1].trim().length > 15) {
        setAiSuggestion('');
        return;
      }

      const queryKeyword = trimmed.split(':')[0].trim();
      if (!queryKeyword || queryKeyword === lastQueriedRef.current) return;
      lastQueriedRef.current = queryKeyword;

      setIsGuessing(true);
      try {
        const res = await fetch('/api/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: queryKeyword, context: notebookTitle }),
        });
        const data = await res.json();
        if (data.success && (data.completionText || data.summary)) {
          let suggestion = data.completionText || `: ${data.summary}`;
          setAiSuggestion(suggestion);
        } else {
          setAiSuggestion('');
        }
      } catch {
        setAiSuggestion('');
      } finally {
        setIsGuessing(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [editText, isEditing, notebookTitle]);

  // Ajustar tamaño del textarea para que crezca dinámicamente con el texto
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.width = width ? `${width}px` : 'auto';
      textareaRef.current.style.height = `${Math.max(32, textareaRef.current.scrollHeight)}px`;
      if (!width) {
        textareaRef.current.style.width = `${Math.max(120, textareaRef.current.scrollWidth + 10)}px`;
      }
    }
  }, [editText, isEditing, width]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 20);
    }
  }, [isEditing]);

  const handleBlur = () => {
    onFinishEditing(editText);
  };

  const insertAiSuggestion = useCallback(() => {
    if (!aiSuggestion) return;
    let base = editText.trimEnd();
    let addition = aiSuggestion;
    if (base.endsWith(':') && addition.startsWith(':')) {
      addition = addition.slice(1).trimStart();
    }
    const glue = base.endsWith(':') || addition.startsWith(':') || addition.startsWith(' ') ? '' : ' ';
    const fullText = `${base}${glue}${addition}`;
    setEditText(fullText);
    onChangeText(fullText);
    setAiSuggestion('');
  }, [aiSuggestion, editText, onChangeText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && aiSuggestion) {
      e.preventDefault();
      insertAiSuggestion();
      return;
    }
    if (e.key === 'Escape') {
      if (aiSuggestion) {
        setAiSuggestion('');
        return;
      }
      onFinishEditing(editText);
    }
  };

  // Redimensionado interactivo del ancho de texto
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = elementRef.current?.offsetWidth || width || 220;
    const zoom = zoomLevel || 1.0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const newWidth = Math.max(90, startWidth + dx);
      if (elementRef.current) {
        elementRef.current.style.width = `${newWidth}px`;
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      const dx = (upEvent.clientX - startX) / zoom;
      const finalWidth = Math.max(90, startWidth + dx);
      onUpdateProps({ width: Math.round(finalWidth) });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };


  const fontStyle =
    fontFamily === 'handwriting'
      ? 'font-handwriting font-bold leading-relaxed'
      : 'font-sans font-medium leading-relaxed';

  return (
    <div
      ref={elementRef}
      data-element-id={id}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: width ? `${width}px` : 'auto',
        maxWidth: '800px',
        color,
        fontSize: `${fontSize}px`,
        userSelect: isEditing ? 'auto' : 'none',
        transform: dragTransform,
        willChange: dragTransform ? 'transform' : 'auto',
      }}
      onPointerDown={(e) => {
        if (isEditing) return;
        if (isHandActive) return; // Allow bubbling to canvas pan
        e.preventDefault();
        e.stopPropagation();
        window.getSelection()?.removeAllRanges();
        onSelect();
        onStartDrag(e);
      }}
      onDoubleClick={(e) => {
        if (isHandActive) return;
        e.stopPropagation();
        if (!isStudyMode) {
          onStartEditing();
        }
      }}
      className={`relative inline-block cursor-move select-none p-1 ${
        isPendingDelete
          ? 'opacity-25 filter grayscale blur-[0.5px]'
          : isSelected && !isEditing
          ? 'border border-[#854cd6] bg-[#854cd6]/[0.03]'
          : 'border border-transparent hover:border-[#854cd6]/30'
      }`}
    >
      {/* 1. Barra de Propiedades Flotante Excalidraw */}
      {!isStudyMode && isSelected && !isEditing && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-13 left-0 z-40 flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DFD8CB] rounded-full px-2.5 py-1 shadow-lg text-xs text-[#2E2822] animate-in fade-in duration-100 select-none font-sans"
        >
          {/* Tamaños Excalidraw: S, M, L, XL */}
          <div className="flex items-center gap-0.5 bg-black/5 rounded-full p-0.5">
            {[
              { size: 16, label: 'S' },
              { size: 22, label: 'M' },
              { size: 30, label: 'L' },
              { size: 40, label: 'XL' },
            ].map((s) => (
              <button
                key={s.size}
                type="button"
                onClick={() => onUpdateProps({ fontSize: s.size })}
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  fontSize === s.size
                    ? 'bg-[#8C6B3D] text-white shadow-2xs'
                    : 'text-[#685F54] hover:bg-black/5'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Fuente: Manuscrita Virgil vs Sans */}
          <button
            type="button"
            onClick={() =>
              onUpdateProps({
                fontFamily: fontFamily === 'handwriting' ? 'sans' : 'handwriting',
              })
            }
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
              fontFamily === 'handwriting'
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-handwriting text-sm'
                : 'bg-white border-[#DFD8CB] text-[#5A5043]'
            }`}
            title="Alternar entre trazo manuscrito Virgil y fuente estándar"
          >
            {fontFamily === 'handwriting' ? 'Virgil ✍️' : 'Sans'}
          </button>

          <span className="text-[#D5CDBD]">|</span>

          {/* Color de tinta */}
          <div className="flex items-center gap-1">
            {INK_PRESETS.map((ink) => (
              <button
                key={ink.id}
                type="button"
                onClick={() => onUpdateProps({ color: ink.id })}
                className={`w-3.5 h-3.5 rounded-full border border-black/20 transition-transform ${
                  color === ink.id ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: ink.id }}
                title={ink.name}
              />
            ))}
          </div>

          <span className="text-[#D5CDBD]">|</span>

          {/* Indicador de Autocompletado Inteligente con Tecla TAB */}
          <div
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100/90 text-amber-950 font-bold text-[11px] shadow-2xs"
            title="Escribe un concepto y presiona Tab para insertar la explicación completa"
          >
            <Wand2 className="w-3 h-3 text-amber-800 animate-pulse" />
            <span>Tab ⇥ autocompleta</span>
          </div>

          {/* Convertir a diagrama visual */}
          {onConvertToDiagram && (
            <button
              type="button"
              onClick={onConvertToDiagram}
              className="p-1 rounded-full hover:bg-black/5 text-[#5A5043] transition-colors"
              title="Convertir a gráfico visual Mermaid"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Eliminar */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-full hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
            title="Eliminar texto (Supr)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Manijas y Rotación estilo Excalidraw */}
      {!isStudyMode && isSelected && !isEditing && (
        <>
          {/* Manija de rotación superior con vástago */}
          <div className="w-[1.5px] h-3 bg-[#854cd6] absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="w-2 h-2 rounded-full bg-white border border-[#854cd6] absolute -top-[18px] left-1/2 -translate-x-1/2 pointer-events-none shadow-2xs" />

          {/* 4 Esquinas Excalidraw */}
          <div className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -top-1 -left-1 z-30 pointer-events-none" />
          <div className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -top-1 -right-1 z-30 pointer-events-none" />
          <div className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -bottom-1 -left-1 z-30 pointer-events-none" />
          {/* Manija interactiva en esquina inferior derecha para redimensionar ancho */}
          <div
            onPointerDown={handleResizePointerDown}
            className="w-2.5 h-2.5 bg-white border border-[#854cd6] rounded-[1px] absolute -bottom-1.25 -right-1.25 z-40 cursor-nwse-resize hover:scale-125 transition-transform"
            title="Arrastra para ajustar el ancho del texto"
          />
        </>
      )}

      {/* 4. Contenido Real: Modo Edición Inline o Renderizado Puro de Texto */}
      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              onChangeText(e.target.value);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Escribe aquí..."
            className={`bg-transparent border-none outline-none resize-none overflow-hidden p-0 m-0 ${fontStyle}`}
            style={{
              color,
              fontSize: `${fontSize}px`,
              width: width ? `${width}px` : 'auto',
              minWidth: '80px',
              minHeight: `${fontSize * 1.4}px`,
            }}
          />

          {/* 5. Previsualización de Concepto Adivinado por Defecto con Tecla Tab */}
          {aiSuggestion && (
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                insertAiSuggestion();
              }}
              className="absolute top-full left-0 mt-2 z-50 p-2.5 rounded-xl bg-[#FAF7F2] border-2 border-amber-400 shadow-xl max-w-[480px] animate-in fade-in slide-in-from-top-1 text-xs font-sans text-stone-800 cursor-pointer hover:bg-amber-50/90 transition-all select-none pointer-events-auto"
              title="Haz clic o presiona Tab para insertar todo el concepto"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  <Wand2 className="w-3 h-3 text-amber-800 animate-pulse" />
                  Concepto Adivinado
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#8C6B3D] text-white px-2 py-0.5 rounded shadow-2xs font-mono">
                  Presiona Tab ⇥
                </span>
              </div>
              <p className="text-[#2E2822] text-xs leading-relaxed font-normal">
                <span className="font-bold text-[#8C6B3D]">{editText.trim()}</span>
                <span className="opacity-90">{aiSuggestion}</span>
              </p>
            </div>
          )}
        </>
      ) : (
        <div
          className={`p-0 m-0 whitespace-pre-wrap break-words select-none pointer-events-none ${fontStyle}`}
          style={{ minHeight: `${fontSize * 1.2}px` }}
        >
          {text || <span className="opacity-40 italic">Escribe algo...</span>}
        </div>
      )}
    </div>
  );
};

export default ExcalidrawTextElement;
