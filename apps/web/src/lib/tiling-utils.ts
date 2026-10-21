import { TilingNode, PageBlock } from '../types/notebook-engine';

/**
 * Inserta un nuevo bloque dividiendo el nodo objetivo al lado (horizontal) o abajo (vertical).
 */
export function splitBlockNode(
  node: TilingNode,
  targetBlockId: string,
  newBlockId: string,
  direction: 'horizontal' | 'vertical'
): TilingNode {
  if (node.type === 'leaf') {
    if (node.blockId === targetBlockId) {
      return {
        id: `split-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'split',
        direction,
        ratio: 0.5,
        firstChild: {
          id: `leaf-${Date.now()}-1`,
          type: 'leaf',
          blockId: targetBlockId,
        },
        secondChild: {
          id: `leaf-${Date.now()}-2`,
          type: 'leaf',
          blockId: newBlockId,
        },
      };
    }
    return node;
  }

  // Si es un split, buscar recursivamente en ambos hijos
  return {
    ...node,
    firstChild: splitBlockNode(node.firstChild, targetBlockId, newBlockId, direction),
    secondChild: splitBlockNode(node.secondChild, targetBlockId, newBlockId, direction),
  };
}

/**
 * Elimina un bloque del árbol de tiling.
 * El nodo hermano sobreviviente reemplaza al padre.
 */
export function removeBlockNode(
  node: TilingNode,
  blockIdToRemove: string
): TilingNode | null {
  if (node.type === 'leaf') {
    return node.blockId === blockIdToRemove ? null : node;
  }

  // Es un nodo split
  const newFirst = removeBlockNode(node.firstChild, blockIdToRemove);
  const newSecond = removeBlockNode(node.secondChild, blockIdToRemove);

  // Si se eliminó el primer hijo, el segundo asciende
  if (!newFirst && newSecond) {
    return newSecond;
  }

  // Si se eliminó el segundo hijo, el primero asciende
  if (newFirst && !newSecond) {
    return newFirst;
  }

  // Si ambos se eliminaron (caso extremo)
  if (!newFirst && !newSecond) {
    return null;
  }

  // Ambos sobrevivieron, conservar el split
  return {
    ...node,
    firstChild: newFirst!,
    secondChild: newSecond!,
  };
}

/**
 * Actualiza la proporción (ratio) de un nodo split al arrastrar el divisor.
 */
export function updateSplitRatio(
  node: TilingNode,
  splitId: string,
  newRatio: number
): TilingNode {
  const clampedRatio = Math.max(0.15, Math.min(0.85, newRatio));

  if (node.type === 'leaf') {
    return node;
  }

  if (node.id === splitId) {
    return {
      ...node,
      ratio: clampedRatio,
    };
  }

  return {
    ...node,
    firstChild: updateSplitRatio(node.firstChild, splitId, newRatio),
    secondChild: updateSplitRatio(node.secondChild, splitId, newRatio),
  };
}

/**
 * Obtiene todos los IDs de bloques presentes en el árbol.
 */
export function getAllBlockIds(node: TilingNode): string[] {
  if (node.type === 'leaf') {
    return [node.blockId];
  }
  return [...getAllBlockIds(node.firstChild), ...getAllBlockIds(node.secondChild)];
}
