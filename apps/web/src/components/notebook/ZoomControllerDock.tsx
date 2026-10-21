'use client';

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';

interface ZoomControllerDockProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToWidth?: () => void;
}

export const ZoomControllerDock: React.FC<ZoomControllerDockProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToWidth,
}) => {
  const percentage = Math.round(zoomLevel * 100);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-1 bg-[#FAF7F2]/95 backdrop-blur-md border border-[#DFD8CB] px-2 py-1.5 rounded-full shadow-lg text-[#2E2822] select-none text-xs font-sans">
      {/* Botón Reducir Zoom (Ctrl -) */}
      <button
        type="button"
        onClick={onZoomOut}
        className="p-1.5 rounded-full hover:bg-black/5 text-[#5A5043] hover:text-[#2E2822] transition-colors"
        title="Alejar (Ctrl -)"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Porcentaje actual (Clic para resetear a 100% / Ctrl 0) */}
      <button
        type="button"
        onClick={onResetZoom}
        className="px-2 py-1 rounded-full font-mono font-bold text-xs hover:bg-black/5 text-[#8C6B3D] transition-colors min-w-[50px] text-center"
        title="Restablecer al 100% (Ctrl 0)"
      >
        {percentage}%
      </button>

      {/* Botón Aumentar Zoom (Ctrl +) */}
      <button
        type="button"
        onClick={onZoomIn}
        className="p-1.5 rounded-full hover:bg-black/5 text-[#5A5043] hover:text-[#2E2822] transition-colors"
        title="Acercar (Ctrl +)"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      {onFitToWidth && (
        <>
          <div className="h-3.5 w-px bg-[#D5CDBD] mx-0.5" />
          <button
            type="button"
            onClick={onFitToWidth}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#5A5043] hover:text-[#2E2822] transition-colors"
            title="Ajustar al ancho de pantalla"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

export default ZoomControllerDock;
