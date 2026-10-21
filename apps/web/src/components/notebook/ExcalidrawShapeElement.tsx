'use client';

import React, { useState, useRef } from 'react';
import {
  Trash2,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
} from 'lucide-react';
import { ShapeElement, ExcalidrawShapeType } from '@/types/notebook-engine';

interface ExcalidrawShapeElementProps {
  shape: ShapeElement;
  zoomLevel?: number;
  isSelected?: boolean;
  isPendingDelete?: boolean;
  isStudyMode?: boolean;
  isHandActive?: boolean;
  dragTransform?: string;
  onSelect: () => void;
  onUpdate: (updated: Partial<ShapeElement>) => void;
  onDelete: () => void;
  onStartDrag: (e: React.PointerEvent) => void;
}

const INK_PRESETS = [
  { id: '#2E2822', name: 'Carbón' },
  { id: '#1E3A5F', name: 'Azul Real' },
  { id: '#784315', name: 'Sepia' },
  { id: '#14532D', name: 'Verde' },
  { id: '#7F1D1D', name: 'Rojo' },
];

export const ExcalidrawShapeElement: React.FC<ExcalidrawShapeElementProps> = ({
  shape,
  zoomLevel = 1.0,
  isSelected = false,
  isPendingDelete = false,
  isStudyMode = false,
  isHandActive = false,
  dragTransform,
  onSelect,
  onUpdate,
  onDelete,
  onStartDrag,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Manejador interactivo para redimensionar con cualquiera de las manijas
  const handleResizePointerDown = (
    e: React.PointerEvent,
    direction: 'nw' | 'ne' | 'se' | 'sw' | 'e' | 's' | 'w' | 'n'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startElemX = shape.x;
    const startElemY = shape.y;
    const startWidth = shape.width;
    const startHeight = shape.height;
    const zoom = zoomLevel || 1.0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;

      let newX = startElemX;
      let newY = startElemY;
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('e')) {
        newWidth = Math.max(20, startWidth + dx);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(16, startHeight + dy);
      }
      if (direction.includes('w')) {
        const potentialWidth = startWidth - dx;
        if (potentialWidth >= 20) {
          newX = startElemX + dx;
          newWidth = potentialWidth;
        }
      }
      if (direction.includes('n')) {
        const potentialHeight = startHeight - dy;
        if (potentialHeight >= 16) {
          newY = startElemY + dy;
          newHeight = potentialHeight;
        }
      }

      onUpdate({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const { width, height, color = '#2E2822', strokeWidth = 2, fill = 'transparent' } = shape;
  const arrowMarkerId = `arrowhead-${shape.id}`;

  return (
    <div
      ref={containerRef}
      data-element-id={shape.id}
      style={{
        position: 'absolute',
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: dragTransform,
        willChange: dragTransform ? 'transform' : 'auto',
      }}
      onPointerDown={(e) => {
        if (isHandActive) return; // Allow bubbling to canvas pan
        e.preventDefault();
        e.stopPropagation();
        window.getSelection()?.removeAllRanges();
        onSelect();
        onStartDrag(e);
      }}
      className={`group select-none cursor-move ${
        isPendingDelete
          ? 'opacity-25 filter grayscale blur-[0.5px]'
          : isSelected
          ? 'border border-[#854cd6] bg-[#854cd6]/[0.02]'
          : 'border border-transparent hover:border-[#854cd6]/30'
      }`}
    >
      {/* 1. Barra Flotante de Herramientas Excalidraw */}
      {!isStudyMode && isSelected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -top-11 left-0 z-40 flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DFD8CB] rounded-full px-2.5 py-1 shadow-lg text-xs text-[#2E2822] animate-in fade-in duration-100 select-none font-sans"
        >
          {/* Selector de Tipo de Forma */}
          <div className="flex items-center gap-0.5 bg-black/5 rounded-full p-0.5">
            {[
              { type: 'rectangle' as ExcalidrawShapeType, icon: Square, label: 'Rectángulo' },
              { type: 'ellipse' as ExcalidrawShapeType, icon: Circle, label: 'Elipse' },
              { type: 'diamond' as ExcalidrawShapeType, icon: Diamond, label: 'Rombo' },
              { type: 'arrow' as ExcalidrawShapeType, icon: ArrowRight, label: 'Flecha' },
              { type: 'line' as ExcalidrawShapeType, icon: Minus, label: 'Línea' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onUpdate({ type: item.type })}
                  className={`p-1 rounded-full transition-colors ${
                    shape.type === item.type
                      ? 'bg-[#8C6B3D] text-white shadow-2xs'
                      : 'text-[#685F54] hover:bg-black/5'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>

          <span className="text-[#D5CDBD]">|</span>

          {/* Color de Trazo */}
          <div className="flex items-center gap-1">
            {INK_PRESETS.map((ink) => (
              <button
                key={ink.id}
                type="button"
                onClick={() => onUpdate({ color: ink.id })}
                className={`w-3.5 h-3.5 rounded-full border border-black/20 transition-transform ${
                  color === ink.id ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: ink.id }}
                title={ink.name}
              />
            ))}
          </div>

          <span className="text-[#D5CDBD]">|</span>

          {/* Grosor de Línea */}
          <div className="flex items-center gap-0.5 bg-black/5 rounded-full p-0.5">
            {[2, 4, 6].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => onUpdate({ strokeWidth: sz })}
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  strokeWidth === sz ? 'bg-[#8C6B3D] text-white' : 'text-[#685F54]'
                }`}
              >
                {sz === 2 ? 'Fino' : sz === 4 ? 'Med' : 'Grueso'}
              </button>
            ))}
          </div>

          {/* Eliminar */}
          <button
            type="button"
            onClick={onDelete}
            className="p-1 rounded-full hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
            title="Eliminar forma (Supr)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Manijas y Rotación estilo Excalidraw */}
      {!isStudyMode && isSelected && (
        <>
          {/* Manija de rotación superior con vástago */}
          <div className="w-[1.5px] h-3 bg-[#854cd6] absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="w-2 h-2 rounded-full bg-white border border-[#854cd6] absolute -top-[18px] left-1/2 -translate-x-1/2 pointer-events-none shadow-2xs" />

          {/* Esquina Superior Izquierda (NW) */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
            className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -top-1 -left-1 shadow-2xs z-30 cursor-nwse-resize hover:scale-125 transition-transform"
            title="Redimensionar esquina superior izquierda"
          />
          {/* Esquina Superior Derecha (NE) */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
            className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -top-1 -right-1 shadow-2xs z-30 cursor-nesw-resize hover:scale-125 transition-transform"
            title="Redimensionar esquina superior derecha"
          />
          {/* Esquina Inferior Izquierda (SW) */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
            className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -bottom-1 -left-1 shadow-2xs z-30 cursor-nesw-resize hover:scale-125 transition-transform"
            title="Redimensionar esquina inferior izquierda"
          />
          {/* Esquina Inferior Derecha (SE) */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            className="w-2 h-2 bg-white border border-[#854cd6] rounded-[1px] absolute -bottom-1 -right-1 shadow-2xs z-30 cursor-nwse-resize hover:scale-125 transition-transform"
            title="Redimensionar esquina inferior derecha"
          />

          {/* Borde Derecho (E) */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'e')}
            className="w-1.5 h-3 bg-white border border-[#854cd6] rounded-[1px] absolute top-1/2 -right-1 -translate-y-1/2 shadow-2xs z-30 cursor-ew-resize hover:scale-125 transition-transform"
            title="Ajustar ancho derecho"
          />
          {/* Borde Inferior (S) */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 's')}
            className="w-3 h-1.5 bg-white border border-[#854cd6] rounded-[1px] absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-2xs z-30 cursor-ns-resize hover:scale-125 transition-transform"
            title="Ajustar alto inferior"
          />
        </>
      )}

      {/* 4. Renderizado SVG según el tipo de forma Excalidraw */}
      <svg className="w-full h-full overflow-visible pointer-events-none">
        <defs>
          <marker
            id={arrowMarkerId}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={color} />
          </marker>
        </defs>

        {shape.type === 'rectangle' && (
          <rect
            x={strokeWidth}
            y={strokeWidth}
            width={Math.max(4, width - strokeWidth * 2)}
            height={Math.max(4, height - strokeWidth * 2)}
            rx={8}
            ry={8}
            fill={fill}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {shape.type === 'ellipse' && (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={Math.max(4, width / 2 - strokeWidth)}
            ry={Math.max(4, height / 2 - strokeWidth)}
            fill={fill}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {shape.type === 'diamond' && (
          <polygon
            points={`${width / 2},${strokeWidth} ${width - strokeWidth},${height / 2} ${width / 2},${height - strokeWidth} ${strokeWidth},${height / 2}`}
            fill={fill}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {shape.type === 'arrow' && (
          <line
            x1={strokeWidth * 2}
            y1={height / 2}
            x2={Math.max(20, width - 10)}
            y2={height / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            markerEnd={`url(#${arrowMarkerId})`}
          />
        )}

        {shape.type === 'line' && (
          <line
            x1={strokeWidth}
            y1={height / 2}
            x2={width - strokeWidth}
            y2={height / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};

export default ExcalidrawShapeElement;
