'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BarChart3,
  Lightbulb,
  FileEdit,
  Loader2,
  X,
  CornerDownLeft,
  Search,
} from 'lucide-react';
import { PageBlock } from '@/types/notebook-engine';

interface MagicPromptInserterProps {
  position: { x: number; y: number } | null;
  notebookTitle?: string;
  onClose: () => void;
  onInsertBlock: (block: PageBlock) => void;
}

export const MagicPromptInserter: React.FC<MagicPromptInserterProps> = ({
  position,
  notebookTitle = 'Cuaderno',
  onClose,
  onInsertBlock,
}) => {
  const [keyword, setKeyword] = useState('');
  const [autocompleteText, setAutocompleteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autoenfocar al abrir
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cerrar al presionar Escape o hacer click fuera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Autocompletado en tiempo real al escribir
  useEffect(() => {
    if (!keyword.trim() || keyword.trim().length < 3) {
      setAutocompleteText('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/autocomplete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: keyword.trim(),
            context: notebookTitle,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.summary) {
            setAutocompleteText(data.summary);
          }
        }
      } catch (err) {
        console.warn('[Autocomplete] Silencioso:', err);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [keyword, notebookTitle]);

  // Generar contenido con IA o crear nota
  const handleGenerate = async (mode: 'concept' | 'graphic' | 'curiosity' | 'text') => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    // Si es nota de texto libre directa
    if (mode === 'text') {
      const newBlock: PageBlock = {
        id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'text',
        title: trimmed,
        content: autocompleteText || `Apunte personal sobre ${trimmed}`,
        createdAt: new Date().toISOString(),
        position: position || undefined,
        fontSize: 'base',
        fontFamily: 'handwriting',
        cardColor: '#FEF9C3', // Post-it amarillo por defecto
        textColor: '#2E2822',
      };
      onInsertBlock(newBlock);
      onClose();
      return;
    }

    setIsLoading(true);
    setLoadingMode(mode);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: trimmed,
          mode,
          notebookTitle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al sintetizar con IA');
      }

      const generatedContent = data.content;
      const newBlock: PageBlock = {
        id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: mode,
        title: generatedContent.titulo || generatedContent.titular || trimmed,
        content: generatedContent,
        createdAt: new Date().toISOString(),
        position: position || undefined,
        fontSize: 'base',
        fontFamily: mode === 'graphic' ? 'sans' : 'sans',
        cardColor: mode === 'curiosity' ? '#FEF9C3' : '#FAF7F2',
        textColor: '#2E2822',
      };

      onInsertBlock(newBlock);
      onClose();
    } catch (err: any) {
      console.error('[MagicPrompt] Error:', err);
      setErrorMessage(err.message || 'No se pudo generar el contenido. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
      setLoadingMode(null);
    }
  };

  // Posicionamiento en pantalla
  const stylePos: React.CSSProperties = position
    ? {
        position: 'absolute',
        left: `${Math.max(16, Math.min(position.x, 580))}px`,
        top: `${Math.max(16, position.y)}px`,
      }
    : {
        position: 'relative',
        margin: '0 auto',
      };

  return (
    <div
      ref={containerRef}
      style={stylePos}
      className="z-50 w-full max-w-[420px] rounded-2xl bg-[#FAF7F2] border-2 border-[#8C6B3D] shadow-2xl p-4 text-[#2E2822] animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Cabecera del Inserter Mágico */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2DCCE]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-[#8C6B3D]" />
          </div>
          <span className="text-xs font-bold tracking-tight text-[#2E2822]">
            Escribir o Adivinar Concepto
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#8C7E70] hover:text-[#2E2822] hover:bg-[#EAE4D8] transition-colors"
          title="Cerrar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Input de Palabra Clave */}
      <div className="relative mb-2">
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              e.preventDefault();
              handleGenerate('concept');
            }
          }}
          disabled={isLoading}
          placeholder="Escribe palabras clave... ej: Fotosíntesis, Mitocondria"
          className="w-full bg-[#FFFFFF] border border-[#D5CDBD] focus:border-[#8C6B3D] rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#2E2822] placeholder-[#A09587] focus:outline-none shadow-xs transition-colors"
        />
        <div className="absolute right-2.5 top-2.5 text-[#A09587]">
          <Search className="w-4 h-4" />
        </div>
      </div>

      {/* Sugerencia de autocompletado en tiempo real */}
      {autocompleteText && !isLoading && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
          <span className="font-semibold shrink-0">💡 Sugerencia:</span>
          <span className="italic line-clamp-2">{autocompleteText}</span>
        </div>
      )}

      {/* Mensaje de error si falla */}
      {errorMessage && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Botones de acción principales */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleGenerate('concept')}
          disabled={isLoading || !keyword.trim()}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#8C6B3D] hover:bg-[#74572E] text-white text-xs font-bold shadow-xs transition-all active:scale-98 disabled:opacity-50"
          title="Adivina y estructura el concepto con definición, puntos clave y aplicaciones (Enter)"
        >
          {isLoading && loadingMode === 'concept' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          )}
          <span>Adivinar Concepto</span>
        </button>

        <button
          type="button"
          onClick={() => handleGenerate('graphic')}
          disabled={isLoading || !keyword.trim()}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2E2822] hover:bg-[#1E1A16] text-white text-xs font-bold shadow-xs transition-all active:scale-98 disabled:opacity-50"
          title="Genera un gráfico o diagrama de flujo Mermaid a partir de las palabras clave"
        >
          {isLoading && loadingMode === 'graphic' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <BarChart3 className="w-3.5 h-3.5 text-sky-300" />
          )}
          <span>Insertar Gráfico</span>
        </button>

        <button
          type="button"
          onClick={() => handleGenerate('curiosity')}
          disabled={isLoading || !keyword.trim()}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#EFEAE1] hover:bg-[#E4DDCF] text-[#4A4239] border border-[#D5CDBD] text-xs font-semibold shadow-xs transition-all active:scale-98 disabled:opacity-50"
          title="Genera una cápsula de alto impacto con cifras y datos curiosos"
        >
          {isLoading && loadingMode === 'curiosity' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>Dato Curioso</span>
        </button>

        <button
          type="button"
          onClick={() => handleGenerate('text')}
          disabled={isLoading || !keyword.trim()}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FEF9C3] hover:bg-[#FEF08A] text-[#713F12] border border-amber-300 text-xs font-semibold shadow-xs transition-all active:scale-98 disabled:opacity-50"
          title="Inserta una nota libre tipo post-it en esta posición"
        >
          <FileEdit className="w-3.5 h-3.5 text-amber-700" />
          <span>Nota Libre</span>
        </button>
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#EAE4D8] flex items-center justify-between text-[11px] text-[#8C7E70]">
        <span>Presiona <kbd className="px-1 py-0.5 rounded bg-stone-200 font-mono text-[10px]">Enter</kbd> para Adivinar</span>
        <span>Haz clic en cualquier parte de la hoja</span>
      </div>
    </div>
  );
};

export default MagicPromptInserter;
