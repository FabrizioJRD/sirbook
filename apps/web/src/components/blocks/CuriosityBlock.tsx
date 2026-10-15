'use client';

import React, { useState } from 'react';
import { CuriosityBlockContent } from '@sirbook/shared';
import { Lightbulb, ExternalLink, Trash2, Copy, Check, Sparkles } from 'lucide-react';

interface CuriosityBlockProps {
  content: CuriosityBlockContent;
  studyMode: boolean;
  onDelete?: () => void;
}

export const CuriosityBlock: React.FC<CuriosityBlockProps> = ({
  content,
  studyMode,
  onDelete,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBlurred = studyMode && !revealed;

  const handleCopy = () => {
    const text = `💡 ${content.titular}\n${content.cifra_destacada ? `[${content.cifra_destacada}]\n` : ''}${content.explicacion}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 border-l-4 border-l-amber-500 relative group transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3 h-3" /> Dato o Curiosidad
            </span>
            {content.contexto && (
              <span className="text-xs text-zinc-400">{content.contexto}</span>
            )}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{content.titular}</span>
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copiar dato"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Eliminar bloque"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cifra Destacada (Stat Badge) */}
      {content.cifra_destacada && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold text-base md:text-lg">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{content.cifra_destacada}</span>
          </div>
        </div>
      )}

      {/* Explicación (Con soporte de Modo Estudio) */}
      <div
        onClick={() => isBlurred && setRevealed(true)}
        className={`mb-4 transition-all ${
          isBlurred ? 'study-blur bg-amber-500/5 p-4 rounded-xl ring-1 ring-amber-500/20 cursor-pointer' : ''
        }`}
      >
        <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
          {content.explicacion}
        </p>
        {isBlurred && (
          <div className="text-center text-xs font-semibold text-amber-400 mt-2">
            👁️ Toca para revelar el dato curioso (Modo Estudio)
          </div>
        )}
      </div>

      {/* Fuente Verificada */}
      {content.fuente_verificada && (
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-zinc-400">Fuente Verificada:</span>
            <a
              href={content.fuente_verificada.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 transition-colors"
            >
              <span className="truncate max-w-[220px]">{content.fuente_verificada.title}</span>
              <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
