'use client';

import React from 'react';
import { Block, BlockContent, ConceptBlockContent, GraphicBlockContent, CuriosityBlockContent, FreeBlockContent } from '@sirbook/shared';
import { ConceptBlock } from './blocks/ConceptBlock';
import { GraphicBlock } from './blocks/GraphicBlock';
import { CuriosityBlock } from './blocks/CuriosityBlock';
import { FreeBlock } from './blocks/FreeBlock';
import { Sparkles } from 'lucide-react';

interface BlockListProps {
  blocks: Block[];
  studyMode: boolean;
  onDeleteBlock: (id: string) => void;
  onUpdateBlockContent: (id: string, content: BlockContent) => void;
}

export const BlockList: React.FC<BlockListProps> = ({
  blocks,
  studyMode,
  onDeleteBlock,
  onUpdateBlockContent,
}) => {
  if (blocks.length === 0) {
    return (
      <div className="text-center py-16 px-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/10">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">Sección lista para sintetizar</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Escribe una palabra clave arriba y selecciona si deseas un <b>Concepto</b>, un <b>Gráfico Mermaid</b>, un <b>Dato Curioso</b> o una <b>Nota Libre</b>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {blocks.map((block) => {
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
      })}
    </div>
  );
};
