'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  BarChart3,
  Lightbulb,
  Sparkles,
  Loader2,
  X,
  Search,
  CornerDownLeft,
} from 'lucide-react';
import { PageBlock } from '@/types/notebook-engine';

interface ExcalidrawAIPromptProps {
  isOpen: boolean;
  notebookTitle?: string;
  onClose: () => void;
  onInsertGenerated: (block: PageBlock) => void;
}

export const ExcalidrawAIPrompt: React.FC<ExcalidrawAIPromptProps> = ({
  isOpen,
  notebookTitle = 'General',
  onClose,
  onInsertGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setPrompt('');
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGenerate = async (mode: 'graphic' | 'concept' | 'curiosity') => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setLoadingMode(mode);
    setError(null);

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
        throw new Error(data.error || 'Error al generar contenido');
      }

      const generated = data.content;
      let newBlock: PageBlock;

      if (mode === 'graphic') {
        newBlock = {
          id: `diag-${Date.now()}`,
          type: 'graphic',
          title: generated.titulo || trimmed,
          content: generated,
          position: { x: 50, y: 120 },
          width: 480,
          createdAt: new Date().toISOString(),
        };
      } else {
        // Concepto en texto puro Excalidraw
        let textContent = `${generated.titulo || trimmed}: ${generated.definicion_corta || ''}`;
        if (Array.isArray(generated.puntos_clave) && generated.puntos_clave.length > 0) {
          textContent += '\n\n' + generated.puntos_clave.map((p: string) => `• ${p}`).join('\n');
        }
        if (Array.isArray(generated.aplicaciones) && generated.aplicaciones.length > 0) {
          textContent += '\n\nAplicaciones: ' + generated.aplicaciones.join(', ');
        }

        newBlock = {
          id: `txt-${Date.now()}`,
          type: 'text',
          title: generated.titulo || trimmed,
          content: textContent,
          position: { x: 60, y: 130 },
          width: 380,
          createdAt: new Date().toISOString(),
        };
      }

      onInsertGenerated(newBlock);
      onClose();
    } catch (err: any) {
      console.error('[Excalidraw AI] Error:', err);
      setError(err.message || 'Error al conectar con el motor de IA.');
    } finally {
      setIsLoading(false);
      setLoadingMode(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-lg bg-[#FAF7F2] border-2 border-[#2E2822] rounded-3xl p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-[#2E2822]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera estilo Excalidraw AI */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#DFD8CB]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#2E2822] text-amber-300 flex items-center justify-center shadow-xs">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#2E2822]">
                Generar Contenido con IA (Excalidraw Style)
              </h3>
              <p className="text-[11px] text-[#786E64]">
                Escribe un tema para generar diagramas visuales o conceptos automáticos
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

        {/* Input del Prompt */}
        <div className="relative mb-3">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                handleGenerate('graphic');
              }
            }}
            disabled={isLoading}
            placeholder="ej: Ciclo de Krebs con etapas, Fotosíntesis, Árbol Binario..."
            className="w-full bg-white border border-[#D5CDBD] focus:border-[#2E2822] rounded-2xl pl-10 pr-4 py-3 text-sm text-[#2E2822] placeholder-stone-400 focus:outline-none shadow-xs font-sans"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        </div>

        {error && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Acciones de Generación estilo Excalidraw */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleGenerate('graphic')}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-[#2E2822] hover:bg-[#1E1A16] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-40"
          >
            {isLoading && loadingMode === 'graphic' ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <BarChart3 className="w-4 h-4 text-sky-300" />
            )}
            <span>Diagrama / Flujo</span>
          </button>

          <button
            type="button"
            onClick={() => handleGenerate('concept')}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-[#8C6B3D] hover:bg-[#74572E] text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-40"
          >
            {isLoading && loadingMode === 'concept' ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-200" />
            )}
            <span>Sintetizar Concepto</span>
          </button>
        </div>

        <div className="mt-3 pt-2 border-t border-[#DFD8CB]/70 flex items-center justify-between text-[11px] text-[#786E64]">
          <span>Presiona <kbd className="px-1 py-0.5 rounded bg-stone-200 font-mono text-[10px]">Enter</kbd> para generar diagrama</span>
          <span>Atajo: <kbd className="px-1 py-0.5 rounded bg-stone-200 font-mono text-[10px]">Ctrl + J</kbd></span>
        </div>
      </div>
    </div>
  );
};

export default ExcalidrawAIPrompt;
