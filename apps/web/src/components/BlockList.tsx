'use client';

import React, { useState } from 'react';
import { Block, BlockContent, ConceptBlockContent, GraphicBlockContent, CuriosityBlockContent, FreeBlockContent } from '@sirbook/shared';
import { ConceptBlock } from './blocks/ConceptBlock';
import { GraphicBlock } from './blocks/GraphicBlock';
import { CuriosityBlock } from './blocks/CuriosityBlock';
import { FreeBlock } from './blocks/FreeBlock';
import { Sparkles, Search, Filter } from 'lucide-react';

interface BlockListProps {
  blocks: Block[];
  studyMode: boolean;
  onDeleteBlock: (id: string) => void;
  onUpdateBlockContent: (id: string, content: BlockContent) => void;
  lastTelemetry?: {
    cached: boolean;
    provider: string;
    latencyMs: number;
    costSavedUSD: number;
    infoMessage?: string;
  } | null;
}

export const BlockList: React.FC<BlockListProps> = ({
  blocks,
  studyMode,
  onDeleteBlock,
  onUpdateBlockContent,
  lastTelemetry,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredBlocks = blocks.filter((b) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const keywordMatch = b.keyword?.toLowerCase().includes(q);
    const modeMatch = b.mode.toLowerCase().includes(q);
    let titleMatch = false;

    if ('titulo' in b.content && b.content.titulo) {
      titleMatch = b.content.titulo.toLowerCase().includes(q);
    } else if ('titular' in b.content && b.content.titular) {
      titleMatch = b.content.titular.toLowerCase().includes(q);
    }

    return keywordMatch || modeMatch || titleMatch;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Telemetry Alert Banner if just generated */}
      {lastTelemetry && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs animate-fade-in shadow-md shadow-emerald-500/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">
              {lastTelemetry.cached ? '⚡ Servido desde Caché SHA-256' : '✨ Generación Optimizada'}
            </span>
            <span className="text-zinc-400 hidden sm:inline">
              ({lastTelemetry.latencyMs}ms | ${lastTelemetry.costSavedUSD.toFixed(3)} USD ahorrados)
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 truncate max-w-xs">
            {lastTelemetry.infoMessage || lastTelemetry.provider}
          </span>
        </div>
      )}

      {/* Filter and Count Bar */}
      {blocks.length > 2 && (
        <div className="flex items-center justify-between gap-3 px-1 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <span>{filteredBlocks.length} de {blocks.length} bloques</span>
          </div>

          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrar por palabra clave..."
              className="w-full bg-black/40 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {blocks.length === 0 ? (
        <div className="text-center py-16 px-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Sección lista para sintetizar</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Escribe una palabra clave arriba y selecciona si deseas un <b>Concepto</b>, un <b>Gráfico Mermaid</b>, un <b>Dato Curioso</b> o una <b>Nota Libre</b>.
          </p>
        </div>
      ) : filteredBlocks.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-500">
          No se encontraron bloques que coincidan con &quot;{filterQuery}&quot;.
        </div>
      ) : (
        filteredBlocks.map((block) => {
          switch (block.mode) {
            case 'concept':
              return (
                <ConceptBlock
                  key={block.id}
                  content={block.content as ConceptBlockContent}
                  studyMode={studyMode}
                  onDelete={() => onDeleteBlock(block.id)}
                />
              );

            case 'graphic':
              return (
                <GraphicBlock
                  key={block.id}
                  content={block.content as GraphicBlockContent}
                  onDelete={() => onDeleteBlock(block.id)}
                />
              );

            case 'curiosity':
              return (
                <CuriosityBlock
                  key={block.id}
                  content={block.content as CuriosityBlockContent}
                  studyMode={studyMode}
                  onDelete={() => onDeleteBlock(block.id)}
                />
              );

            case 'free':
              return (
                <FreeBlock
                  key={block.id}
                  content={block.content as FreeBlockContent}
                  onUpdate={(newContent) => onUpdateBlockContent(block.id, newContent)}
                  onDelete={() => onDeleteBlock(block.id)}
                />
              );

            default:
              return null;
          }
        })
      )}
    </div>
  );
};
