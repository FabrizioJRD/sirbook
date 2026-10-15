'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GraphicBlockContent, sanitizeMermaidCode } from '@sirbook/shared';
import { Network, Maximize2, ExternalLink, Trash2, Copy, Check, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';

interface GraphicBlockProps {
  content: GraphicBlockContent;
  onDelete?: () => void;
}

export const GraphicBlock: React.FC<GraphicBlockProps> = ({
  content,
  onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif',
          themeVariables: {
            darkMode: true,
            background: '#141618',
            primaryColor: '#6366F1',
            primaryTextColor: '#FFFFFF',
            primaryBorderColor: '#818CF8',
            lineColor: '#A1A1AA',
            secondaryColor: '#A855F7',
            tertiaryColor: '#27272A',
          }
        });

        const sanitized = sanitizeMermaidCode(content.codigo_render);
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

        const { svg } = await mermaid.render(uniqueId, sanitized);
        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('[Mermaid] Falló el renderizado:', err);
          setError('No se pudo compilar el diagrama visual.');
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [content.codigo_render]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(content.codigo_render);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card rounded-2xl p-6 border-l-4 border-l-purple-500 relative group transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Network className="w-3 h-3" /> Gráfico
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullScreen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Pantalla Completa / Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Copiar código Mermaid"
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

      {/* Explicación Corta */}
      <p className="text-xs md:text-sm text-zinc-300 mb-4 leading-relaxed">
        {content.descripcion_corta}
      </p>

      {/* Contenedor del Diagrama Mermaid */}
      <div className="bg-[#111215] border border-white/5 rounded-xl p-4 overflow-x-auto flex items-center justify-center min-h-[200px]">
        {error ? (
          <div className="text-center py-6">
            <p className="text-xs text-amber-400 mb-2">{error}</p>
            <pre className="text-[11px] text-zinc-400 bg-black/40 p-3 rounded-lg text-left max-h-40 overflow-auto font-mono">
              {content.codigo_render}
            </pre>
          </div>
        ) : svgHtml ? (
          <div
            ref={containerRef}
            className="w-full flex justify-center py-2"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="text-xs text-zinc-500 animate-pulse">
            Compilando diagrama visual...
          </div>
        )}
      </div>

      {/* Fuentes Verificadas */}
      {content.fuentes && content.fuentes.length > 0 && (
        <div className="pt-4 mt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
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

      {/* Modal Pantalla Completa con Zoom */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white">{content.titulo}</h3>
              <p className="text-xs text-zinc-400">{content.descripcion_corta}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.2))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-zinc-400 w-12 text-center font-mono">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsFullScreen(false);
                  setZoomLevel(1);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white ml-2"
                title="Cerrar"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              className="transition-transform duration-100"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
