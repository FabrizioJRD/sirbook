'use client';

import React, { useRef, useCallback } from 'react';
import { TilingNode, PageBlock } from '../../types/notebook-engine';
import { TilingBlockRenderer } from './TilingBlockRenderer';

interface TilingContainerProps {
  node: TilingNode;
  blocks: Record<string, PageBlock>;
  isStudyMode: boolean;
  onSplitRight: (blockId: string) => void;
  onSplitBottom: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updated: Partial<PageBlock>) => void;
  onUpdateRatio: (splitId: string, newRatio: number) => void;
  onAIAssistBlock?: (blockId: string) => void;
}

export const TilingContainer: React.FC<TilingContainerProps> = ({
  node,
  blocks,
  isStudyMode,
  onSplitRight,
  onSplitBottom,
  onRemoveBlock,
  onUpdateBlock,
  onUpdateRatio,
  onAIAssistBlock,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Manejo de arrastre de divisores (Resizer handles)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, splitId: string, direction: 'horizontal' | 'vertical') => {
      e.preventDefault();
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      const onMouseMove = (moveEvent: MouseEvent) => {
        let newRatio = 0.5;
        if (direction === 'horizontal') {
          const offsetX = moveEvent.clientX - rect.left;
          newRatio = offsetX / rect.width;
        } else {
          const offsetY = moveEvent.clientY - rect.top;
          newRatio = offsetY / rect.height;
        }
        onUpdateRatio(splitId, newRatio);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [onUpdateRatio]
  );

  // Si es un nodo hoja (Leaf)
  if (node.type === 'leaf') {
    const block = blocks[node.blockId];
    if (!block) {
      return (
        <div className="w-full h-full flex items-center justify-center p-4 text-xs text-zinc-400 italic">
          Bloque no encontrado ({node.blockId})
        </div>
      );
    }

    return (
      <div className="w-full h-full min-w-[220px] min-h-[140px] overflow-hidden flex flex-col">
        <TilingBlockRenderer
          block={block}
          isStudyMode={isStudyMode}
          onSplitRight={() => onSplitRight(node.blockId)}
          onSplitBottom={() => onSplitBottom(node.blockId)}
          onRemove={() => onRemoveBlock(node.blockId)}
          onUpdateBlock={(updated) => onUpdateBlock(node.blockId, updated)}
          onAIAssist={() => onAIAssistBlock && onAIAssistBlock(node.blockId)}
        />
      </div>
    );
  }

  // Si es un nodo de partición (Split)
  const isHorizontal = node.direction === 'horizontal';
  const ratio = Math.max(0.15, Math.min(0.85, node.ratio || 0.5));

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex ${isHorizontal ? 'flex-row' : 'flex-col'} overflow-auto custom-scrollbar`}
    >
      {/* Primer Hijo con límite mínimo horizontal (220px) y vertical (140px) */}
      <div
        style={{
          flex: `${ratio} ${ratio} 0%`,
          minWidth: isHorizontal ? '220px' : 'auto',
          minHeight: !isHorizontal ? '140px' : 'auto',
        }}
        className="overflow-hidden flex flex-col"
      >
        <TilingContainer
          node={node.firstChild}
          blocks={blocks}
          isStudyMode={isStudyMode}
          onSplitRight={onSplitRight}
          onSplitBottom={onSplitBottom}
          onRemoveBlock={onRemoveBlock}
          onUpdateBlock={onUpdateBlock}
          onUpdateRatio={onUpdateRatio}
          onAIAssistBlock={onAIAssistBlock}
        />
      </div>

      {/* Divisor Arrastrable (Resizer) */}
      {!isStudyMode && (
        <div
          onMouseDown={(e) => handleMouseDown(e, node.id, node.direction)}
          className={`group/resizer flex items-center justify-center relative select-none z-10 transition-colors ${
            isHorizontal
              ? 'w-2 cursor-col-resize hover:bg-stone-400/20'
              : 'h-2 cursor-row-resize hover:bg-stone-400/20'
          }`}
        >
          <div
            className={`rounded-full bg-stone-400/30 group-hover/resizer:bg-stone-600 transition-colors ${
              isHorizontal ? 'w-0.5 h-8' : 'h-0.5 w-8'
            }`}
          />
        </div>
      )}

      {/* Segundo Hijo con límite mínimo horizontal (220px) y vertical (140px) */}
      <div
        style={{
          flex: `${1 - ratio} ${1 - ratio} 0%`,
          minWidth: isHorizontal ? '220px' : 'auto',
          minHeight: !isHorizontal ? '140px' : 'auto',
        }}
        className="overflow-hidden flex flex-col"
      >
        <TilingContainer
          node={node.secondChild}
          blocks={blocks}
          isStudyMode={isStudyMode}
          onSplitRight={onSplitRight}
          onSplitBottom={onSplitBottom}
          onRemoveBlock={onRemoveBlock}
          onUpdateBlock={onUpdateBlock}
          onUpdateRatio={onUpdateRatio}
          onAIAssistBlock={onAIAssistBlock}
        />
      </div>
    </div>
  );
};
