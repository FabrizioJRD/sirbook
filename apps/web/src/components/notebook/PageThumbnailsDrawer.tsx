'use client';

import React from 'react';
import { NotebookPage, PageBlock, TilingNode } from '@/types/notebook-engine';
import { X, Plus, Trash2, FileText, Sparkles, Copy } from 'lucide-react';

interface PageThumbnailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pages: NotebookPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
}

// Mini renderizador recursivo del árbol de Tiling de la página completa
function MiniTilingPreview({
  node,
  blocks,
}: {
  node?: TilingNode;
  blocks?: Record<string, PageBlock>;
}) {
  if (!node || !blocks) return null;

  if (node.type === 'leaf') {
    const block = blocks[node.blockId];
    if (!block) return null;

    return (
      <div className="w-full h-full p-2 overflow-hidden flex flex-col justify-start border border-[#E2DCCE]/70 rounded-lg bg-white/50 backdrop-blur-xs shadow-2xs">
        {/* Encabezado del Bloque */}
        <div className="flex items-center justify-between gap-1 mb-1 border-b border-[#EAE4D8]/80 pb-0.5">
          <span className="text-[10px] font-bold text-[#2E2822] truncate">
            {block.title || block.content?.titulo || 'Bloque'}
          </span>
          <span className="text-[8px] font-mono font-medium text-[#8C6B3D] bg-[#EFEAE1] px-1 py-0.2 rounded border border-[#DFD8CB]">
            {block.type === 'graphic'
              ? 'diagrama'
              : block.type === 'concept'
              ? 'concepto'
              : block.type === 'curiosity'
              ? 'dato'
              : 'apunte'}
          </span>
        </div>

        {/* Contenido según tipo */}
        {block.type === 'concept' && (
          <div className="space-y-1 text-[8.5px] leading-tight text-[#5A5043]">
            {block.content?.definicion_corta && (
              <p className="line-clamp-2">{block.content.definicion_corta}</p>
            )}
            {Array.isArray(block.content?.puntos_clave) && block.content.puntos_clave.length > 0 && (
              <ul className="space-y-0.5 pl-1.5 border-l border-[#8C6B3D]/40">
                {block.content.puntos_clave.slice(0, 2).map((pt: string, idx: number) => (
                  <li key={idx} className="truncate">• {pt}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {block.type === 'graphic' && (
          <div className="flex-1 flex flex-col justify-center items-center py-1">
            <div className="flex items-center gap-1 text-[8px] font-mono text-[#5A5043]">
              <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#DDD6C9] font-medium shadow-2xs">
                {block.content?.titulo || 'Ruta'}
              </span>
              <span className="text-[#8C6B3D] font-bold">→</span>
              <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#DDD6C9] font-medium shadow-2xs">
                Nodos
              </span>
              <span className="text-[#8C6B3D] font-bold">→</span>
              <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#DDD6C9] font-medium shadow-2xs">
                ...
              </span>
            </div>
            {block.content?.descripcion_corta && (
              <p className="text-[8px] text-[#786E64] italic truncate mt-1">
                {block.content.descripcion_corta}
              </p>
            )}
          </div>
        )}

        {block.type === 'curiosity' && (
          <div className="space-y-0.5 py-0.5">
            {block.content?.cifra_destacada && (
              <div className="text-xs font-bold text-[#8C6B3D] font-serif">
                {block.content.cifra_destacada}
              </div>
            )}
            {block.content?.explicacion && (
              <p className="text-[8.5px] text-[#5A5043] line-clamp-2 leading-tight">
                {block.content.explicacion}
              </p>
            )}
          </div>
        )}

        {(block.type === 'text' || block.type === 'sticky') && (
          <div className="text-[8.5px] text-[#5A5043] line-clamp-3 leading-tight">
            {typeof block.content === 'string'
              ? block.content
              : block.content?.markdown || block.content?.texto || ''}
          </div>
        )}
      </div>
    );
  }

  const isHorizontal = node.direction === 'horizontal';
  const ratio = Math.max(0.2, Math.min(0.8, node.ratio || 0.5));

  return (
    <div
      className={`w-full h-full flex ${
        isHorizontal ? 'flex-row' : 'flex-col'
      } gap-1.5 overflow-hidden`}
    >
      <div style={{ flex: `${ratio} ${ratio} 0%` }} className="overflow-hidden">
        <MiniTilingPreview node={node.firstChild} blocks={blocks} />
      </div>
      <div style={{ flex: `${1 - ratio} ${1 - ratio} 0%` }} className="overflow-hidden">
        <MiniTilingPreview node={node.secondChild} blocks={blocks} />
      </div>
    </div>
  );
}

export default function PageThumbnailsDrawer({
  isOpen,
  onClose,
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
}: PageThumbnailsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex font-sans select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/35 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-88 sm:w-[420px] max-w-full bg-[#FAF7F2] border-r border-[#DFD8CB] text-[#2E2822] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#DFD8CB] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#8C6B3D]" />
            <h3 className="font-semibold text-[#2E2822] text-base">Hojas del Cuaderno</h3>
            <span className="text-xs bg-[#EFEAE1] text-[#685F54] border border-[#DFD8CB] px-2 py-0.5 rounded-full font-mono">
              {pages.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#786E64] hover:text-[#2E2822] hover:bg-[#EFEAE1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: Add Page */}
        <div className="p-3 border-b border-[#DFD8CB] bg-[#F5F2EB]">
          <button
            onClick={onAddPage}
            className="w-full py-2.5 px-3 rounded-lg bg-[#8C6B3D] hover:bg-[#78592E] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nueva Hoja Marfil</span>
          </button>
        </div>

        {/* List of Pages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {pages.map((page, index) => {
            const isActive = index === activePageIndex;
            const patternClass =
              page.paperPattern === 'dots'
                ? 'notebook-paper-dots'
                : page.paperPattern === 'ruled'
                ? 'notebook-paper-ruled'
                : page.paperPattern === 'plain'
                ? 'notebook-paper-plain'
                : 'notebook-paper-grid';

            return (
              <div
                key={page.id}
                onClick={() => onSelectPage(index)}
                className={`group relative rounded-2xl p-3 border cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F0ECE4] border-[#8C6B3D] ring-2 ring-[#8C6B3D]/30 shadow-md'
                    : 'bg-[#FAF7F2] border-[#DFD8CB] hover:bg-[#F5F1E8] hover:border-[#C8BFB0] shadow-xs'
                }`}
              >
                {/* 1. TÍTULO ENCIMA DE LA PÁGINA */}
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded shadow-xs shrink-0 ${
                        isActive
                          ? 'bg-[#8C6B3D] text-white'
                          : 'bg-[#EFEAE1] text-[#685F54] border border-[#DFD8CB]'
                      }`}
                    >
                      Hoja #{index + 1}
                    </span>

                    <h4
                      className="text-xs sm:text-sm font-bold text-[#2E2822] truncate"
                      title={page.subjectTopic}
                    >
                      {page.subjectTopic || `Hoja #${index + 1}`}
                    </h4>

                    {isActive && (
                      <span className="text-[10px] text-[#8C6B3D] font-semibold bg-[#8C6B3D]/10 px-1.5 py-0.5 rounded border border-[#8C6B3D]/25 shrink-0">
                        Activa
                      </span>
                    )}
                  </div>

                  {/* Acciones: Duplicar y Eliminar */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onDuplicatePage(index)}
                      title="Duplicar hoja"
                      className="p-1 rounded text-[#8A7F73] hover:text-[#2E2822] hover:bg-[#EFEAE1] transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={() => onDeletePage(index)}
                        title="Eliminar hoja"
                        className="p-1 rounded text-[#8A7F73] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. LA PÁGINA COMPLETA */}
                <div
                  className={`w-full min-h-[300px] sm:min-h-[330px] rounded-xl ${patternClass} border border-[#DDD6C9] p-3 flex flex-col justify-between overflow-hidden shadow-xs relative transition-all group-hover:border-[#8C6B3D]/50`}
                >
                  {/* Pliegue de encuadernación realista a la izquierda */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-stone-400/20 via-stone-300/10 to-transparent pointer-events-none rounded-l-xl" />

                  {/* Cabecera interna de la hoja */}
                  <div className="border-b border-[#EAE4D8] pb-1.5 mb-2 flex items-center justify-between shrink-0 pl-1.5">
                    <span className="text-[10px] font-bold tracking-tight text-[#2E2822] truncate max-w-[180px]">
                      {page.subjectTopic || 'Hoja de apuntes'}
                    </span>

                    {/* Stickers dock en miniatura */}
                    {page.stickers && page.stickers.length > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        {page.stickers.map((stk) => (
                          <span
                            key={stk.id}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8px] font-bold border ${stk.color}`}
                          >
                            <span>{stk.emoji}</span>
                            <span className="hidden sm:inline">{stk.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cuerpo Completo con Tiling Adaptable */}
                  <div className="flex-1 min-h-[210px] flex flex-col overflow-hidden pl-1">
                    {page.tilingRoot && page.blocks && Object.keys(page.blocks).length > 0 ? (
                      <MiniTilingPreview node={page.tilingRoot} blocks={page.blocks} />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center border border-dashed border-[#DDD6C9] rounded-lg">
                        <FileText className="w-6 h-6 text-[#9E9589] mb-1" />
                        <span className="text-[10px] font-medium text-[#786E64]">Hoja en blanco</span>
                      </div>
                    )}
                  </div>

                  {/* Pie de página del cuaderno */}
                  <div className="border-t border-[#EAE4D8] pt-1.5 mt-2 flex items-center justify-between text-[8px] font-mono text-[#8A7F73] shrink-0 pl-1.5">
                    <span>Sirbook</span>
                    <span>Pág. {page.pageNumber} de {pages.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#DFD8CB] text-[11px] text-[#786E64] text-center font-mono bg-[#F5F2EB]">
          Total de hojas: {pages.length} · Vista completa de hojas
        </div>
      </div>
    </div>
  );
}
