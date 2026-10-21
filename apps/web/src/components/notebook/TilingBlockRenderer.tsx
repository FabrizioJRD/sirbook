'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageBlock } from '../../types/notebook-engine';
import { sanitizeMermaidCode } from '@sirbook/shared';
import {
  Columns2,
  Rows2,
  Trash2,
  Sparkles,
  Edit3,
  Check,
  Lightbulb,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  X,
} from 'lucide-react';

/**
 * Auto-resizing textarea that mimics ink on notebook paper seamlessly.
 */
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, className, disabled }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(22, textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value || ''}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      disabled={disabled}
      rows={1}
      placeholder={placeholder}
      className={`resize-none overflow-hidden transition-colors ${className || ''}`}
    />
  );
};

interface TilingBlockRendererProps {
  block: PageBlock;
  isStudyMode: boolean;
  onSplitRight: () => void;
  onSplitBottom: () => void;
  onRemove: () => void;
  onUpdateBlock: (updated: Partial<PageBlock>) => void;
  onAIAssist?: () => void;
}

export const TilingBlockRenderer: React.FC<TilingBlockRendererProps> = ({
  block,
  isStudyMode,
  onSplitRight,
  onSplitBottom,
  onRemove,
  onUpdateBlock,
  onAIAssist,
}) => {
  const [textContent, setTextContent] = useState(
    typeof block.content === 'string'
      ? block.content
      : block.content?.markdown || block.content?.texto || ''
  );

  // Sincronizar contenido de texto cuando cambie desde fuera (undo/redo, cambio de página)
  useEffect(() => {
    const nextText =
      typeof block.content === 'string'
        ? block.content
        : block.content?.markdown || block.content?.texto || '';
    setTextContent(nextText);
  }, [block.content]);

  // Estados para Gráficos Mermaid: edición interactiva y zoom/escala
  const [isEditingMermaid, setIsEditingMermaid] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>(
    block.type === 'graphic' ? block.content?.codigo_render || '' : ''
  );
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [diagramScale, setDiagramScale] = useState<number>(0.85);

  // Sincronizar código cuando cambie el bloque externamente
  useEffect(() => {
    if (block.type === 'graphic') {
      setMermaidCode(block.content?.codigo_render || '');
    }
  }, [block.type, block.content?.codigo_render]);

  // Renderizar diagramas Mermaid directamente sobre el papel marfil con líneas oscuras y autoajuste
  useEffect(() => {
    if (block.type !== 'graphic') return;
    const codeToRender = isEditingMermaid ? mermaidCode : block.content?.codigo_render;
    if (!codeToRender || !codeToRender.trim()) return;

    let isMounted = true;

    async function renderMermaid() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          themeVariables: {
            darkMode: false,
            background: 'transparent',
            primaryColor: '#EBE5D8',
            primaryTextColor: '#1C1917',
            primaryBorderColor: '#78716C',
            lineColor: '#57534E',
            secondaryColor: '#E0D8C8',
            tertiaryColor: '#FAF8F2',
          },
        });

        const sanitized = sanitizeMermaidCode(codeToRender);
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, sanitized);

        if (isMounted) {
          // Ajustar SVG para que no se corte y responda limpiamente al tamaño del contenedor
          const adjustedSvg = svg
            .replace(/style="[^"]*max-width:[^"]*"/g, 'style="max-width: 100%; height: auto;"')
            .replace(/<svg\s+([^>]*?)height="[^"]*"/g, '<svg $1 height="auto"')
            .replace(/<svg\s+([^>]*?)style="/g, '<svg $1 style="max-height: 100%; object-fit: contain; ');

          setSvgHtml(adjustedSvg);
          setMermaidError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[Mermaid] Error de compilación:', err);
          setMermaidError(err?.message || 'Error de sintaxis en el diagrama.');
        }
      }
    }

    renderMermaid();
    return () => {
      isMounted = false;
    };
  }, [block.type, block.content?.codigo_render, mermaidCode, isEditingMermaid]);

  // Guardar cambios en el código Mermaid
  const handleSaveMermaid = () => {
    setIsEditingMermaid(false);
    onUpdateBlock({
      content: {
        ...block.content,
        codigo_render: mermaidCode,
      },
    });
  };

  // Controles de Zoom del Diagrama
  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDiagramScale((prev) => Math.min(2.0, Number((prev + 0.15).toFixed(2))));
  };

  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDiagramScale((prev) => Math.max(0.4, Number((prev - 0.15).toFixed(2))));
  };

  const zoomReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDiagramScale(0.85);
  };

  return (
    <div className="relative group/cell h-full w-full min-w-[200px] min-h-[140px] flex flex-col p-3 sm:p-4 bg-transparent transition-all select-text">
      {/* Barra de Acciones de Tiling Hyprland (Flotante y sutil en cálido pergamino, solo visible en hover) */}
      {!isStudyMode && (
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center gap-1 bg-[#FAF7F2]/95 backdrop-blur-md px-1.5 py-1 rounded-lg border border-[#DFD8CB] shadow-md">
          {onAIAssist && (
            <button
              onClick={onAIAssist}
              title="Sintetizar o enriquecer con IA"
              className="p-1 text-[#8C6B3D] hover:text-[#70532B] hover:bg-[#EFEAE1] rounded transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dividir a la derecha */}
          <button
            onClick={onSplitRight}
            title="Dividir ventana a la derecha (Hyprland horizontal split)"
            className="p-1 text-[#5A5043] hover:text-[#2E2822] hover:bg-[#EFEAE1] rounded transition-colors"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>

          {/* Dividir abajo */}
          <button
            onClick={onSplitBottom}
            title="Dividir ventana abajo (Hyprland vertical split)"
            className="p-1 text-[#5A5043] hover:text-[#2E2822] hover:bg-[#EFEAE1] rounded transition-colors"
          >
            <Rows2 className="w-3.5 h-3.5" />
          </button>

          {/* Eliminar bloque */}
          <button
            onClick={onRemove}
            title="Cerrar celda (el espacio se redistribuirá)"
            className="p-1 text-[#8A7F73] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* RENDERIZADO PURO DE CONTENIDO (Directo sobre el papel marfil, sin cajas/cards ni rellenos de forma) */}
      <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar break-words">
        {/* 1. MODO CONCEPTO */}
        {block.type === 'concept' && (
          <div className="space-y-3">

            {/* Título Principal del Concepto */}
            {!isStudyMode ? (
              <input
                type="text"
                value={block.content?.titulo ?? block.title ?? ''}
                onChange={(e) =>
                  onUpdateBlock({
                    title: e.target.value,
                    content: { ...block.content, titulo: e.target.value },
                  })
                }
                placeholder="Título del concepto..."
                className="w-full bg-transparent border-b border-stone-300/40 hover:border-stone-400 focus:border-[#8C6B3D] text-xl sm:text-2xl font-bold tracking-tight text-stone-900 placeholder-stone-400 pb-1 focus:outline-none transition-colors"
              />
            ) : (
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 border-b border-stone-300/40 pb-1">
                {block.content?.titulo || block.title}
              </h3>
            )}

            {/* Definición Corta */}
            {!isStudyMode ? (
              <AutoResizeTextarea
                value={block.content?.definicion_corta || ''}
                onChange={(val) =>
                  onUpdateBlock({
                    content: { ...block.content, definicion_corta: val },
                  })
                }
                placeholder="Escribe aquí la definición o explicación del concepto..."
                className="w-full bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8C6B3D] text-sm sm:text-base leading-relaxed text-stone-800 font-medium placeholder-stone-400 focus:outline-none"
              />
            ) : block.content?.definicion_corta ? (
              <p className="text-sm sm:text-base leading-relaxed text-stone-800 font-medium">
                {block.content.definicion_corta}
              </p>
            ) : null}

            {/* Puntos Clave como Lista Natural de Apuntes */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />
                  Puntos Clave
                </p>
                {!isStudyMode && (
                  <button
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(block.content?.puntos_clave)
                        ? [...block.content.puntos_clave]
                        : [];
                      onUpdateBlock({
                        content: {
                          ...block.content,
                          puntos_clave: [...current, 'Nuevo punto de apunte...'],
                        },
                      });
                    }}
                    className="text-[11px] font-semibold text-[#8C6B3D] hover:text-[#70532B] flex items-center gap-0.5 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Añadir punto
                  </button>
                )}
              </div>

              <div className="space-y-1.5 pl-3 border-l-2 border-stone-300/70">
                {(block.content?.puntos_clave || []).map((point: string, idx: number) =>
                  !isStudyMode ? (
                    <div key={idx} className="flex items-start gap-1 group/pt">
                      <span className="text-stone-400 select-none text-xs leading-5">•</span>
                      <AutoResizeTextarea
                        value={point}
                        onChange={(val) => {
                          const updated = [...(block.content?.puntos_clave || [])];
                          updated[idx] = val;
                          onUpdateBlock({
                            content: { ...block.content, puntos_clave: updated },
                          });
                        }}
                        placeholder="Escribe un punto clave..."
                        className="flex-1 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8C6B3D] text-xs sm:text-sm text-stone-700 leading-relaxed placeholder-stone-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (block.content?.puntos_clave || []).filter(
                            (_: any, i: number) => i !== idx
                          );
                          onUpdateBlock({
                            content: { ...block.content, puntos_clave: updated },
                          });
                        }}
                        title="Eliminar punto"
                        className="opacity-0 group-hover/pt:opacity-100 text-stone-400 hover:text-rose-600 p-0.5 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p key={idx} className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                      • {point}
                    </p>
                  )
                )}
                {(!block.content?.puntos_clave || block.content.puntos_clave.length === 0) &&
                  !isStudyMode && (
                    <p className="text-xs text-stone-400 italic">
                      Sin puntos clave aún. Haz clic en &quot;+ Añadir punto&quot; para escribir apuntes.
                    </p>
                  )}
              </div>
            </div>

            {/* Aplicaciones Prácticas */}
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-600" />
                  Aplicaciones
                </p>
                {!isStudyMode && (
                  <button
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(block.content?.aplicaciones)
                        ? [...block.content.aplicaciones]
                        : [];
                      onUpdateBlock({
                        content: {
                          ...block.content,
                          aplicaciones: [...current, 'Nueva aplicación'],
                        },
                      });
                    }}
                    className="text-[11px] font-semibold text-[#8C6B3D] hover:text-[#70532B] flex items-center gap-0.5 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Añadir
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(block.content?.aplicaciones || []).map((app: string, idx: number) =>
                  !isStudyMode ? (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs text-stone-700 bg-stone-200/50 border border-stone-300/60 px-2 py-0.5 rounded group/app"
                    >
                      <input
                        type="text"
                        value={app}
                        onChange={(e) => {
                          const updated = [...(block.content?.aplicaciones || [])];
                          updated[idx] = e.target.value;
                          onUpdateBlock({
                            content: { ...block.content, aplicaciones: updated },
                          });
                        }}
                        className="bg-transparent border-none focus:outline-none text-xs text-stone-700 w-auto min-w-[60px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (block.content?.aplicaciones || []).filter(
                            (_: any, i: number) => i !== idx
                          );
                          onUpdateBlock({
                            content: { ...block.content, aplicaciones: updated },
                          });
                        }}
                        className="text-stone-400 hover:text-rose-600 ml-0.5 opacity-60 hover:opacity-100"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      key={idx}
                      className="text-xs text-stone-700 bg-stone-200/50 border border-stone-300/60 px-2 py-0.5 rounded"
                    >
                      {app}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. MODO GRÁFICO (MERMAID) — Click para editar & Auto-escala sin cortes */}
        {block.type === 'graphic' && (
          <div className="space-y-2 h-full flex flex-col">
            {/* Header del Gráfico con controles de Zoom y Edición */}
            <div className="flex items-center justify-between border-b border-stone-300/40 pb-1 shrink-0 gap-2">
              {!isStudyMode ? (
                <input
                  type="text"
                  value={block.content?.titulo ?? block.title ?? ''}
                  onChange={(e) =>
                    onUpdateBlock({
                      title: e.target.value,
                      content: { ...block.content, titulo: e.target.value },
                    })
                  }
                  placeholder="Título del gráfico..."
                  className="flex-1 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8C6B3D] text-base sm:text-lg font-bold text-stone-900 placeholder-stone-400 focus:outline-none transition-colors"
                />
              ) : (
                <h4 className="text-base sm:text-lg font-bold text-stone-900 truncate">
                  {block.content?.titulo || block.title}
                </h4>
              )}

              <div className="flex items-center gap-1 shrink-0">
                {/* Controles de Zoom / Escala (Reducir o agrandar a gusto) */}
                {!isEditingMermaid && (
                  <div className="flex items-center gap-0.5 bg-[#EFEAE1] p-0.5 rounded-lg border border-[#DFD8CB] text-[#5A5043]">
                    <button
                      onClick={zoomOut}
                      title="Reducir gráfico"
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      onClick={zoomReset}
                      title="Ajustar al cuaderno (100%)"
                      className="px-1 text-[10px] font-mono font-medium hover:bg-white rounded transition-colors"
                    >
                      {Math.round(diagramScale * 100)}%
                    </button>
                    <button
                      onClick={zoomIn}
                      title="Agrandar gráfico"
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Botón Editar / Listo */}
                {!isStudyMode && (
                  <button
                    onClick={() => {
                      if (isEditingMermaid) {
                        handleSaveMermaid();
                      } else {
                        setIsEditingMermaid(true);
                      }
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                      isEditingMermaid
                        ? 'bg-[#8C6B3D] text-white shadow-xs'
                        : 'bg-[#EFEAE1] hover:bg-[#E2DDD3] text-[#4A4239] border border-[#DFD8CB]'
                    }`}
                  >
                    {isEditingMermaid ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Guardar</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3" />
                        <span>Editar Diagrama</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Vista 1: Editor interactivo de código Mermaid */}
            {isEditingMermaid ? (
              <div className="flex-1 flex flex-col space-y-2 py-1">
                <div className="flex items-center justify-between text-[11px] text-[#786E64] font-mono">
                  <span>Código del diagrama (edita y se actualiza en vivo):</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setMermaidCode((prev) => `${prev.trim()}\n  A["Nuevo Nodo"] --> B["Siguiente"]`)
                      }
                      className="px-1.5 py-0.5 rounded bg-[#EFEAE1] hover:bg-[#E2DDD3] text-[#4A4239] border border-[#DFD8CB] text-[10px] font-sans"
                    >
                      + Conexión
                    </button>
                  </div>
                </div>

                <textarea
                  value={mermaidCode}
                  onChange={(e) => setMermaidCode(e.target.value)}
                  rows={7}
                  className="w-full bg-white border border-[#D5CDBD] rounded-lg p-2.5 font-mono text-xs text-[#2E2822] leading-relaxed focus:outline-none focus:border-[#8C6B3D] shadow-xs"
                  placeholder="graph TD&#10;  A --> B"
                />

                {/* Vista previa en vivo mientras escribe */}
                <div className="flex-1 min-h-[140px] max-h-[220px] border border-[#DFD8CB] rounded-lg p-2 overflow-hidden flex items-center justify-center bg-[#FDFBF7]">
                  {svgHtml && !mermaidError ? (
                    <div
                      className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:h-auto"
                      dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />
                  ) : (
                    <p className="text-xs text-rose-600 font-mono italic">
                      {mermaidError || 'Escribe sintaxis Mermaid válida...'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Vista 2: Diagrama completo, con click para editar y auto-ajuste al cuaderno */
              <div
                onClick={() => {
                  if (!isStudyMode) setIsEditingMermaid(true);
                }}
                title={!isStudyMode ? 'Haz clic en el diagrama para editar el contenido o código' : undefined}
                className={`flex-1 w-full min-h-[180px] max-h-[460px] flex items-center justify-center overflow-hidden p-2 relative ${
                  !isStudyMode ? 'cursor-pointer hover:bg-stone-200/20 rounded-xl transition-colors' : ''
                }`}
              >
                {svgHtml ? (
                  <div
                    style={{
                      transform: `scale(${diagramScale})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    className="[&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: svgHtml }}
                  />
                ) : mermaidError ? (
                  <p className="text-xs text-rose-600 italic py-2">{mermaidError}</p>
                ) : (
                  <p className="text-xs text-stone-500 italic py-2">Compilando diagrama...</p>
                )}
              </div>
            )}

            {/* Descripción corta al pie del gráfico */}
            {!isStudyMode ? (
              <AutoResizeTextarea
                value={block.content?.descripcion_corta || ''}
                onChange={(val) =>
                  onUpdateBlock({
                    content: { ...block.content, descripcion_corta: val },
                  })
                }
                placeholder="Descripción o explicación del diagrama..."
                className="w-full bg-transparent border-t border-stone-200/60 hover:border-stone-400 focus:border-[#8C6B3D] text-xs text-stone-600 italic leading-relaxed pt-1 placeholder-stone-400 focus:outline-none"
              />
            ) : block.content?.descripcion_corta ? (
              <p className="text-xs text-stone-600 italic leading-relaxed pt-1 border-t border-stone-200/60">
                {block.content.descripcion_corta}
              </p>
            ) : null}
          </div>
        )}

        {/* 3. MODO CURIOSIDAD / DATO */}
        {block.type === 'curiosity' && (
          <div className="space-y-2">
            {!isStudyMode ? (
              <input
                type="text"
                value={block.content?.titular ?? block.title ?? ''}
                onChange={(e) =>
                  onUpdateBlock({
                    title: e.target.value,
                    content: { ...block.content, titular: e.target.value },
                  })
                }
                placeholder="Titular del dato curioso..."
                className="w-full bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8C6B3D] text-lg font-bold text-stone-900 placeholder-stone-400 focus:outline-none transition-colors"
              />
            ) : (
              <h4 className="text-lg font-bold text-stone-900">
                {block.content?.titular || block.title}
              </h4>
            )}

            {/* Cifra destacada como nota manuscrita */}
            {!isStudyMode ? (
              <input
                type="text"
                value={block.content?.cifra_destacada || ''}
                onChange={(e) =>
                  onUpdateBlock({
                    content: { ...block.content, cifra_destacada: e.target.value },
                  })
                }
                placeholder="Cifra destacada (ej: 60% de Similitud)..."
                className="w-full bg-transparent border-b border-transparent hover:border-amber-300 focus:border-amber-700 text-2xl font-extrabold text-amber-900 tracking-tight py-1 font-serif placeholder-amber-900/30 focus:outline-none transition-colors"
              />
            ) : block.content?.cifra_destacada ? (
              <div className="text-2xl font-extrabold text-amber-900 tracking-tight py-1 font-serif">
                {block.content.cifra_destacada}
              </div>
            ) : null}

            {!isStudyMode ? (
              <AutoResizeTextarea
                value={block.content?.explicacion || ''}
                onChange={(val) =>
                  onUpdateBlock({
                    content: { ...block.content, explicacion: val },
                  })
                }
                placeholder="Explicación detallada..."
                className="w-full bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8C6B3D] text-xs sm:text-sm text-stone-700 leading-relaxed placeholder-stone-400 focus:outline-none"
              />
            ) : block.content?.explicacion ? (
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {block.content.explicacion}
              </p>
            ) : null}
          </div>
        )}

        {/* 4. MODO TEXTO LIBRE / REDACCIÓN DIRECTA */}
        {block.type === 'text' && (
          <div className="space-y-2 h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-300/40 pb-1">
              {!isStudyMode ? (
                <input
                  type="text"
                  value={block.title || ''}
                  onChange={(e) => onUpdateBlock({ title: e.target.value })}
                  placeholder="Título de apuntes..."
                  className="flex-1 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-[#8C6B3D] text-base font-bold text-stone-900 placeholder-stone-400 focus:outline-none transition-colors"
                />
              ) : (
                <h4 className="text-base font-bold text-stone-900">
                  {block.title || 'Texto de Apuntes'}
                </h4>
              )}
            </div>

            {!isStudyMode ? (
              <AutoResizeTextarea
                value={textContent}
                onChange={(val) => {
                  setTextContent(val);
                  onUpdateBlock({
                    content:
                      typeof block.content === 'object'
                        ? { ...block.content, markdown: val, texto: val }
                        : val,
                  });
                }}
                placeholder="Haz clic aquí y comienza a escribir tus apuntes libremente..."
                className="w-full flex-1 bg-transparent border border-transparent hover:border-stone-300/60 focus:border-[#8C6B3D] rounded p-1 text-sm text-stone-900 focus:outline-none leading-relaxed font-sans placeholder-stone-400"
              />
            ) : (
              <div className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans flex-1">
                {textContent || 'Sin contenido redactado.'}
              </div>
            )}
          </div>
        )}

        {/* 5. MODO ANOTACIÓN / MARGINALIA */}
        {block.type === 'sticky' && (
          <div className="border-l-3 border-amber-500/80 pl-3 py-1 my-1 space-y-1.5">
            <div className="flex items-center justify-between">
              {!isStudyMode ? (
                <input
                  type="text"
                  value={block.content?.titulo ?? block.title ?? ''}
                  onChange={(e) =>
                    onUpdateBlock({
                      title: e.target.value,
                      content:
                        typeof block.content === 'object'
                          ? { ...block.content, titulo: e.target.value }
                          : { titulo: e.target.value, texto: block.content },
                    })
                  }
                  placeholder="Título de anotación..."
                  className="w-full bg-transparent border-b border-transparent hover:border-amber-300 focus:border-amber-700 text-xs font-bold uppercase tracking-wider text-amber-900 placeholder-amber-700/50 focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {block.content?.titulo || block.title || 'Anotación'}
                </p>
              )}
            </div>

            {!isStudyMode ? (
              <AutoResizeTextarea
                value={
                  typeof block.content === 'string'
                    ? block.content
                    : block.content?.texto || ''
                }
                onChange={(val) =>
                  onUpdateBlock({
                    content:
                      typeof block.content === 'object'
                        ? { ...block.content, texto: val }
                        : val,
                  })
                }
                placeholder="Escribe tu anotación rápida..."
                className="w-full bg-transparent border-b border-transparent hover:border-amber-300 focus:border-amber-700 text-xs sm:text-sm text-stone-800 leading-relaxed italic placeholder-stone-400 focus:outline-none"
              />
            ) : (
              <p className="text-xs sm:text-sm text-stone-800 leading-relaxed italic">
                {block.content?.texto ||
                  (typeof block.content === 'string' ? block.content : '')}
              </p>
            )}
          </div>
        )}

        {/* 6. FALLBACK PARA OTROS TIPOS */}
        {!['concept', 'graphic', 'curiosity', 'text', 'sticky'].includes(block.type) && (
          <div className="space-y-2">
            {!isStudyMode ? (
              <input
                type="text"
                value={block.title || ''}
                onChange={(e) => onUpdateBlock({ title: e.target.value })}
                className="w-full bg-transparent border-b border-stone-300 font-bold text-stone-900"
              />
            ) : (
              <h4 className="font-bold text-stone-900">{block.title}</h4>
            )}
            <AutoResizeTextarea
              value={typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2)}
              onChange={(val) => onUpdateBlock({ content: val })}
              disabled={isStudyMode}
              className="w-full bg-transparent text-sm text-stone-800"
            />
          </div>
        )}
      </div>
    </div>
  );
};
