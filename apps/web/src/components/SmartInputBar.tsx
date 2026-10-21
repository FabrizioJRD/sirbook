'use client';

import React, { useState } from 'react';
import { GenerationMode, MODES_META } from '@sirbook/shared';
import { Sparkles, Search, RotateCcw, Loader2, ArrowRight, BookOpen, Network, Lightbulb, PenLine } from 'lucide-react';

interface SmartInputBarProps {
  onGenerate: (keyword: string, mode: GenerationMode, forceRefresh: boolean) => Promise<void>;
  isLoading: boolean;
  activeContextPath: string;
}

const MODE_ICONS: Record<GenerationMode, React.ReactNode> = {
  concept: <BookOpen className="w-3.5 h-3.5" />,
  graphic: <Network className="w-3.5 h-3.5" />,
  curiosity: <Lightbulb className="w-3.5 h-3.5" />,
  free: <PenLine className="w-3.5 h-3.5" />
};

export const SmartInputBar: React.FC<SmartInputBarProps> = ({
  onGenerate,
  isLoading,
  activeContextPath,
}) => {
  const [keyword, setKeyword] = useState('');
  const [selectedMode, setSelectedMode] = useState<GenerationMode>('concept');
  const [forceRefresh, setForceRefresh] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || isLoading) return;
    await onGenerate(keyword.trim(), selectedMode, forceRefresh);
    setKeyword('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Container Principal */}
      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-2.5 shadow-xl shadow-black/40 border border-white/10"
      >
        {/* Context Breadcrumb */}
        {activeContextPath && (
          <div className="px-3 pt-1 pb-1.5 flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5">
            <span className="flex items-center gap-1.5 truncate">
              <span className="text-zinc-500">Contexto temático:</span>
              <span className="font-medium text-zinc-300">{activeContextPath}</span>
            </span>
            <label className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 w-3 h-3"
              />
              <span className="flex items-center gap-1 text-[10px]">
                <RotateCcw className="w-2.5 h-2.5" /> Forzar búsqueda en vivo
              </span>
            </label>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="text-zinc-400">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-zinc-400" />
            )}
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isLoading}
            placeholder={
              selectedMode === 'free'
                ? 'Escribe el título de tu nota libre...'
                : 'Escribe una palabra clave o tema (ej. "Ciclo de Krebs", "Computación Cuántica")...'
            }
            className="flex-1 bg-transparent border-none text-sm md:text-base text-white placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!keyword.trim() || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs md:text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
          >
            {isLoading ? (
              <span>Sintetizando...</span>
            ) : selectedMode === 'free' ? (
              <>
                <span>Crear Nota</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Llenar con IA</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Mode Selector Pills */}
        <div className="pt-2 px-1 flex items-center gap-1.5 overflow-x-auto border-t border-white/5">
          {(Object.keys(MODES_META) as GenerationMode[]).map((mode) => {
            const meta = MODES_META[mode];
            const isSelected = selectedMode === mode;
            return (
              <button
                type="button"
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 shrink-0 ${
                  isSelected
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {MODE_ICONS[mode]}
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </form>

      {/* Sugerencias Rápidas para Pruebas Inmediatas */}
      <div className="mt-2.5 px-2 flex items-center gap-1.5 overflow-x-auto text-xs text-zinc-400">
        <span className="text-[11px] text-zinc-500 font-medium shrink-0">Prueba rápida:</span>
        {[
          { label: 'Fotosíntesis', mode: 'graphic' as GenerationMode },
          { label: 'Mitocondria', mode: 'concept' as GenerationMode },
          { label: 'Ciclo de Krebs', mode: 'graphic' as GenerationMode },
          { label: 'Dijkstra', mode: 'concept' as GenerationMode },
          { label: 'Transformers', mode: 'graphic' as GenerationMode },
          { label: 'ADN Plátano', mode: 'curiosity' as GenerationMode },
        ].map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              setKeyword(chip.label);
              setSelectedMode(chip.mode);
            }}
            className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 text-[11px] shrink-0 transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};
