'use client';

import React, { useState } from 'react';
import { ConceptBlockContent } from '@sirbook/shared';
import { BookOpen, ExternalLink, CheckCircle2, Lightbulb, Trash2, Copy, Check } from 'lucide-react';

interface ConceptBlockProps {
  content: ConceptBlockContent;
  studyMode: boolean;
  onDelete?: () => void;
}

export const ConceptBlock: React.FC<ConceptBlockProps> = ({
  content,
  studyMode,
  onDelete,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBlurred = studyMode && !revealed;

  const handleCopy = () => {
    const text = `${content.titulo}\n\n${content.definicion_corta}\n\nPuntos Clave:\n${content.puntos_clave.map(p => `- ${p}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 border-l-4 border-l-blue-500 relative group transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen className="w-3 h-3" /> Concepto
            </span>
            {content.contexto && (
              <span className="text-xs text-zinc-400">{content.contexto}</span>
            )}
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {content.titulo}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copiar contenido"
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

      {/* Definición Corta (Con soporte de Modo Estudio) */}
      <div
        onClick={() => isBlurred && setRevealed(true)}
        className={`mb-5 transition-all ${
          isBlurred ? 'study-blur bg-blue-500/5 p-3 rounded-xl ring-1 ring-blue-500/20 cursor-pointer' : ''
        }`}
      >
        <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-normal">
          {content.definicion_corta}
        </p>
        {isBlurred && (
          <div className="text-center text-xs font-semibold text-blue-400 mt-2">
            👁️ Toca para revelar la definición (Modo Estudio)
          </div>
        )}
      </div>

      {/* Puntos Clave */}
      {content.puntos_clave && content.puntos_clave.length > 0 && (
        <div
          onClick={() => isBlurred && setRevealed(true)}
          className={`mb-5 ${isBlurred ? 'study-blur' : ''}`}
        >
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Puntos Clave
          </h4>
          <ul className="space-y-1.5">
            {content.puntos_clave.map((punto, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>{punto}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aplicaciones Prácticas */}
      {content.aplicaciones && content.aplicaciones.length > 0 && !isBlurred && (
        <div className="mb-5 pt-3 border-t border-white/5">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Aplicaciones Prácticas
          </h4>
          <div className="flex flex-wrap gap-2">
            {content.aplicaciones.map((app, idx) => (
              <span
                key={idx}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/80 text-zinc-300 border border-white/5"
              >
                {app}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fuentes Verificadas */}
      {content.fuentes && content.fuentes.length > 0 && (
        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-zinc-400">Fuentes:</span>
          {content.fuentes.map((fuente, idx) => (
            <a
              key={idx}
              href={fuente.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 transition-colors"
            >
              <span className="truncate max-w-[180px]">{fuente.title}</span>
              <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
