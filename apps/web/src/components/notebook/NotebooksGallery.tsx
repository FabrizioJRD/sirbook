'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DigitalNotebook, LooseNote, SortOption } from '@/types/notebook-engine';
import {
  Home,
  Star,
  FileText,
  Folder,
  FolderPlus,
  Trash2,
  Search,
  Plus,
  Sparkles,
  Edit2,
  ChevronDown,
  LayoutGrid,
  List,
  Menu,
  X,
  StickyNote,
  SlidersHorizontal,
  RotateCcw,
  Check,
  BookOpen,
  ArrowUpDown,
  BookMarked,
  FolderOpen,
  LogOut,
  Shuffle,
  Pencil,
  ArrowLeft,
  MoreHorizontal,
} from 'lucide-react';

interface NotebooksGalleryProps {
  notebooks: DigitalNotebook[];
  looseNotes: LooseNote[];
  currentUser?: { id: string; fullName: string; email: string } | null;
  onLogout?: () => void;
  onSelectNotebook: (id: string) => void;
  onSelectLooseNote: (note: LooseNote) => void;
  onCreateNotebook: (notebook: Omit<DigitalNotebook, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateNotebook: (notebook: DigitalNotebook) => void;
  onDeleteNotebook: (id: string) => void;
  onCreateLooseNote: (note: Omit<LooseNote, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateLooseNote: (note: LooseNote) => void;
  onDeleteLooseNote: (id: string) => void;
  onMoveNoteToFolder: (noteId: string, folderId: string | null) => void;
}

const PRESET_COVER_COLORS = [
  '#059669', // Verde Esmeralda
  '#2563EB', // Azul Real
  '#7C3AED', // Púrpura
  '#D97706', // Ámbar Cálido
  '#DC2626', // Rubí
  '#4B5563', // Grafito
  '#0D9488', // Turquesa
  '#9333EA', // Violeta
  '#E11D48', // Rosa Intenso
  '#0891B2', // Cian
  '#4F46E5', // Índigo
  '#10B981', // Menta
  '#F59E0B', // Miel
  '#6366F1', // Lavanda
];

function getRandomColor(): string {
  return PRESET_COVER_COLORS[Math.floor(Math.random() * PRESET_COVER_COLORS.length)];
}

const PRESET_ICONS = ['📁', '📓', '🧬', '💻', '📐', '🧠', '📊', '🎨', '📚', '⚡'];

function getNotebookExcerpt(nb: DigitalNotebook): string {
  if (nb.description) return nb.description;
  const firstPage = nb.pages?.[0];
  if (!firstPage || !firstPage.blocks) return 'Sin contenido aún';
  const blockKeys = Object.keys(firstPage.blocks);
  for (const key of blockKeys) {
    const b = firstPage.blocks[key];
    if (typeof b.content === 'string' && b.content.trim()) return b.content.slice(0, 85);
    if (b.content && typeof b.content === 'object') {
      const obj = b.content as Record<string, unknown>;
      if (typeof obj.definicion_corta === 'string' && obj.definicion_corta.trim()) {
        return obj.definicion_corta.slice(0, 85);
      }
      if (typeof obj.titulo === 'string') return obj.titulo;
    }
    if (b.title) return b.title;
  }
  return 'Cuaderno de notas y conceptos';
}

function getNoteExcerpt(note: LooseNote): string {
  const p = note.page;
  if (!p || !p.blocks) return 'Nota en blanco';
  const keys = Object.keys(p.blocks);
  for (const k of keys) {
    const b = p.blocks[k];
    if (typeof b.content === 'string' && b.content.trim()) return b.content.slice(0, 85);
  }
  return 'Apunte rápido';
}

function getRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  } catch {
    return 'Just now';
  }
}

function NoteVisualPreview({ page }: { page?: any }) {
  if (!page) {
    return (
      <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center text-stone-300">
        <FileText className="w-7 h-7 opacity-40" />
      </div>
    );
  }

  const patternBgClass =
    page.paperPattern === 'dots'
      ? 'bg-[radial-gradient(#d6d3cb_1px,transparent_1px)] [background-size:12px_12px] bg-[#FAF8F5]'
      : page.paperPattern === 'ruled'
      ? 'bg-[linear-gradient(transparent_21px,#e7e5df_22px)] [background-size:100%_22px] bg-[#FAF8F5]'
      : page.paperPattern === 'grid'
      ? 'bg-[linear-gradient(to_right,#e7e5df_1px,transparent_1px),linear-gradient(to_bottom,#e7e5df_1px,transparent_1px)] [background-size:13px_13px] bg-[#FAF8F5]'
      : 'bg-[#FFFDF9]';

  const hasDrawing = Array.isArray(page.drawingStrokes) && page.drawingStrokes.length > 0;
  const hasShapes = Array.isArray(page.shapeElements) && page.shapeElements.length > 0;
  const hasTexts = Array.isArray(page.textElements) && page.textElements.length > 0;
  const blocksList = page.blocks ? Object.values(page.blocks) : [];
  const firstBlock: any = blocksList[0];

  return (
    <div className={`w-full h-full relative overflow-hidden select-none ${patternBgClass} p-2.5 sm:p-3 flex flex-col justify-between`}>
      {/* 1. Mini SVG Layer para Trazos y Figuras con la proporción original de la hoja */}
      {(hasDrawing || hasShapes) && (
        <svg
          viewBox={page?.orientation === 'horizontal' ? '0 0 1040 735' : '0 0 740 1046'}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
          preserveAspectRatio="xMidYMid meet"
        >
          {page.drawingStrokes?.map((stroke: any) => {
            if (!stroke.points || stroke.points.length === 0) return null;
            const d = stroke.points.reduce(
              (acc: string, pt: any, i: number) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
              ''
            );
            return (
              <path
                key={stroke.id}
                d={d}
                fill="none"
                stroke={stroke.color || '#2E2822'}
                strokeWidth={Math.max(4, (stroke.size || 3) * 2)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {page.shapeElements?.map((shape: any) => {
            if (shape.type === 'rectangle') {
              return (
                <rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill || 'transparent'}
                  stroke={shape.color || '#2E2822'}
                  strokeWidth={shape.strokeWidth ? shape.strokeWidth * 2 : 4}
                  rx="6"
                />
              );
            }
            if (shape.type === 'ellipse') {
              return (
                <ellipse
                  key={shape.id}
                  cx={shape.x + shape.width / 2}
                  cy={shape.y + shape.height / 2}
                  rx={Math.abs(shape.width / 2)}
                  ry={Math.abs(shape.height / 2)}
                  fill={shape.fill || 'transparent'}
                  stroke={shape.color || '#2E2822'}
                  strokeWidth={shape.strokeWidth ? shape.strokeWidth * 2 : 4}
                />
              );
            }
            return null;
          })}
        </svg>
      )}

      {/* 2. Textos libres dibujados */}
      {hasTexts && (
        <div className="relative z-10 space-y-1">
          {page.textElements?.slice(0, 3).map((txt: any) => (
            <div
              key={txt.id}
              className="text-[9px] font-sans text-stone-800 line-clamp-1 max-w-[90%]"
              style={{ color: txt.color || '#2E2822' }}
            >
              {txt.text}
            </div>
          ))}
        </div>
      )}

      {/* 3. Bloques de concepto/apunte */}
      {!hasTexts && firstBlock && (
        <div className="relative z-10 w-full bg-white/85 backdrop-blur-xs border border-stone-200/60 rounded-md p-1.5 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-900 truncate mb-0.5">
            {firstBlock.title || 'Apunte'}
          </div>
          <div className="text-[8px] text-stone-500 leading-tight line-clamp-3">
            {typeof firstBlock.content === 'string'
              ? firstBlock.content
              : firstBlock.content?.definicion_corta || firstBlock.content?.texto || 'Contenido del apunte...'}
          </div>
        </div>
      )}

      {/* Si la nota no tiene trazos ni bloques aún (ej. nueva nota) */}
      {!hasDrawing && !hasShapes && !hasTexts && !firstBlock && (
        <div className="relative z-10 w-full bg-white/90 backdrop-blur-xs border border-stone-200/70 rounded-md p-2 shadow-2xs">
          <div className="text-[10px] font-bold text-stone-800 truncate mb-0.5">
            {page.subjectTopic || 'Apunte rápido'}
          </div>
          <div className="text-[8px] text-stone-400 italic leading-snug line-clamp-2">
            Escribe tus apuntes o genera conceptos con IA...
          </div>
        </div>
      )}

      {/* Mini Sticker Badge si existe */}
      {page.stickers && page.stickers.length > 0 && (
        <div className="absolute bottom-1.5 right-1.5 z-20">
          <span className="text-xs">{page.stickers[0].emoji || '📌'}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Convierte cualquier color hexadecimal en una paleta armónica pastel
 * estilo File Manager (solapa delantera pastel suave + solapa trasera viva).
 */
function getFolderColorStyles(hexColor: string) {
  let r = 5, g = 150, b = 105;
  if (hexColor && hexColor.startsWith('#') && hexColor.length === 7) {
    r = parseInt(hexColor.slice(1, 3), 16) || 5;
    g = parseInt(hexColor.slice(3, 5), 16) || 150;
    b = parseInt(hexColor.slice(5, 7), 16) || 105;
  }

  // Gradiente frontal luminoso y suave pastel
  const lr = Math.round(r * 0.14 + 255 * 0.86);
  const lg = Math.round(g * 0.14 + 255 * 0.86);
  const lb = Math.round(b * 0.14 + 255 * 0.86);

  const dr = Math.round(r * 0.38 + 255 * 0.62);
  const dg = Math.round(g * 0.38 + 255 * 0.62);
  const db = Math.round(b * 0.38 + 255 * 0.62);

  // Solapa trasera más viva y definida
  const tr = Math.round(r * 0.70 + 255 * 0.30);
  const tg = Math.round(g * 0.70 + 255 * 0.30);
  const tb = Math.round(b * 0.70 + 255 * 0.30);

  return {
    pastelLight: `rgb(${lr}, ${lg}, ${lb})`,
    pastelDark: `rgb(${dr}, ${dg}, ${db})`,
    vibrantTab: `rgb(${tr}, ${tg}, ${tb})`,
  };
}

/**
 * Tarjeta 'Add new' compacta y minimalista con borde punteado estilo File Manager
 */
function AddNewFolderCard({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div
      onClick={onOpenModal}
      className="group relative aspect-[4/3.1] w-full rounded-2xl border-2 border-dashed border-[#82D99E] bg-[#F2FAF5]/50 hover:bg-[#EBF7EF] p-3 sm:p-3.5 flex flex-col justify-between cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-98"
    >
      <div>
        <h3 className="text-xs sm:text-[13px] font-bold text-[#1F8A4C] tracking-tight">
          Add new
        </h3>
        <p className="text-[10px] text-stone-400 font-medium mt-0.5">
          Tap to get started
        </p>
      </div>

      <div className="flex justify-end">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2BB656] text-white flex items-center justify-center shadow-2xs group-hover:scale-105 group-hover:bg-[#259F4B] transition-transform">
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de Carpeta estilo File Manager Minimalista:
 * - Altura compacta y proporción minimalista (aspect-[4/3.1])
 * - Cuando tiene notas (noteCount > 0), se muestran hojas de apuntes blancas asomándose de la solapa
 * - Cuando está vacía (noteCount === 0), la carpeta luce limpia y despejada
 * - Gradientes pastel luminosos y solapa trasera viva
 */
function FolderTabCard({
  notebook,
  totalCount,
  onOpenFolder,
  onEditFolder,
  onToggleFavorite,
  onTrashFolder,
}: {
  notebook: DigitalNotebook;
  totalCount?: number;
  onOpenFolder: (id: string) => void;
  onEditFolder: (e: React.MouseEvent, nb: DigitalNotebook) => void;
  onToggleFavorite: (e: React.MouseEvent, nb: DigitalNotebook) => void;
  onTrashFolder: (e: React.MouseEvent, id: string) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const noteCount = totalCount !== undefined ? totalCount : (notebook.pages?.length || 0);
  const { pastelLight, pastelDark, vibrantTab } = useMemo(
    () => getFolderColorStyles(notebook.coverColor || '#059669'),
    [notebook.coverColor]
  );

  const gradId = useMemo(
    () => `grad-${notebook.id.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    [notebook.id]
  );

  return (
    <div
      onClick={() => onOpenFolder(notebook.id)}
      className="group relative aspect-[4/3.1] w-full rounded-2xl cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-98 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
    >
      {/* 1. Silueta Vectorial de Carpeta con Escote Superior y Hojas si está Llena */}
      <svg
        viewBox="0 -10 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full overflow-visible drop-shadow-2xs"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={pastelLight} />
            <stop offset="100%" stopColor={pastelDark} />
          </linearGradient>
        </defs>

        {/* Solapa Trasera con Color de Acento */}
        <rect x="0" y="0" width="200" height="150" rx="18" fill={vibrantTab} />

        {/* HOJAS INTERIORES ASOMÁNDOSE: Sólo cuando la carpeta contiene notas */}
        {noteCount > 0 && (
          <g className="folder-sheets pointer-events-none">
            {/* Hoja 1 (posterior, rotada hacia la derecha) */}
            <g transform="rotate(4 125 10)">
              <rect
                x="98"
                y="-6"
                width="56"
                height="46"
                rx="3.5"
                fill="#FFFFFF"
                stroke="#D1D5DB"
                strokeWidth="1.2"
                opacity="0.95"
              />
              <line x1="105" y1="2" x2="146" y2="2" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="105" y1="7" x2="138" y2="7" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Hoja 2 (frontal, rotada hacia la izquierda con líneas de apunte) */}
            <g transform="rotate(-3 88 12)">
              <rect
                x="80"
                y="-4"
                width="58"
                height="46"
                rx="3.5"
                fill="#FFFFFF"
                stroke="#9CA3AF"
                strokeWidth="1.2"
              />
              <line x1="87" y1="4" x2="130" y2="4" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
              <line x1="87" y1="9" x2="122" y2="9" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
              <line x1="87" y1="14" x2="128" y2="14" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
            </g>

            {/* Hoja 3 adicional si la carpeta tiene 3 o más notas */}
            {noteCount >= 3 && (
              <g transform="rotate(2 145 12)">
                <rect
                  x="132"
                  y="-3"
                  width="46"
                  height="44"
                  rx="3"
                  fill="#F8FAFC"
                  stroke="#CBD5E1"
                  strokeWidth="1"
                  opacity="0.9"
                />
              </g>
            )}
          </g>
        )}

        {/* Solapa Delantera con Gradiente Pastel y Escote Curvo Superior Derecho */}
        <path
          d="M 0 18 Q 0 0 18 0 L 72 0 Q 88 0 96 9 Q 102 16 114 16 L 180 16 Q 200 16 200 36 L 200 132 Q 200 150 180 150 L 18 150 Q 0 150 0 132 Z"
          fill={`url(#${gradId})`}
        />

        {/* Borde sutil de brillo en la solapa frontal */}
        <path
          d="M 2 18 Q 2 2 18 2 L 72 2 Q 87 2 95 10 Q 101 17 113 17 L 180 17 Q 198 17 198 36"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        />
      </svg>

      {/* 2. Capa de Contenido y Acciones Minimalista */}
      <div className="relative z-10 w-full h-full p-3 sm:p-3.5 flex flex-col justify-between">
        {/* Fila Superior: Botón de Opciones y Favorito */}
        <div className="flex items-center justify-between">
          {notebook.isFavorite ? (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 drop-shadow-xs" />
          ) : (
            <div />
          )}

          {/* Menú de 3 puntos (...) */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-full text-stone-600/70 hover:text-stone-900 hover:bg-white/60 transition-colors"
              title="Opciones"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white border border-stone-200 rounded-2xl shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100 text-xs font-sans">
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    onToggleFavorite(e, notebook);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-stone-50 text-stone-700 text-left"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      notebook.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-400'
                    }`}
                  />
                  <span>{notebook.isFavorite ? 'Quitar favorito' : 'Favorito'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    onEditFolder(e, notebook);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-stone-50 text-stone-700 text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    onTrashFolder(e, notebook.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fila Inferior: Título y Contador de Archivos (Estilo File Manager) */}
        <div className="pt-1">
          <h3 className="text-xs sm:text-[13px] font-bold text-stone-900 group-hover:text-black transition-colors line-clamp-1 tracking-tight">
            {notebook.title}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-medium text-stone-500/90 mt-0.5">
            Files: {noteCount}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de Nota con Previsualización Real en Proporción Original (Imagen 3):
 * - Cuadro superior con miniatura real del contenido con la proporción vertical original de la hoja (A4 210/297)
 * - Título y metadatos debajo del cuadro como un archivo de sistema operativo
 */
function NoteFilePreviewCard({
  title,
  updated_at,
  page,
  subject,
  isFavorite,
  onOpen,
  actions,
}: {
  title: string;
  updated_at: string;
  page?: any;
  subject?: string;
  isFavorite?: boolean;
  onOpen: () => void;
  actions?: React.ReactNode;
}) {
  const isHorizontal = page?.orientation === 'horizontal';
  const aspectClass = isHorizontal ? 'aspect-[297/210]' : 'aspect-[210/297]';

  return (
    <div onClick={onOpen} className="group flex flex-col cursor-pointer select-none">
      {/* 1. Caja de Previsualización Visual (Thumbnail Superior con Proporción Original de la Hoja) */}
      <div className={`relative ${aspectClass} w-full bg-white rounded-xl border border-stone-200/90 group-hover:border-emerald-600/70 shadow-2xs group-hover:shadow-md transition-all overflow-hidden flex flex-col justify-between`}>
        <NoteVisualPreview page={page} />

        {/* Acciones flotantes en la esquina superior derecha */}
        {actions && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs p-1 rounded-lg shadow-2xs z-20"
          >
            {actions}
          </div>
        )}

        {isFavorite && (
          <div className="absolute top-2 left-2 z-20">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 drop-shadow-xs" />
          </div>
        )}
      </div>

      {/* 2. Título debajo del cuadro como un archivo (Imagen 3) */}
      <div className="mt-2 px-0.5 space-y-0.5">
        <div className="flex items-center justify-between gap-1.5">
          <h4 className="text-xs sm:text-[13px] font-semibold text-stone-800 group-hover:text-emerald-800 transition-colors truncate">
            {title}
          </h4>
          {subject && (
            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
              {subject}
            </span>
          )}
        </div>
        <span className="text-[10px] text-stone-400 block">
          {getRelativeTime(updated_at)}
        </span>
      </div>
    </div>
  );
}

export default function NotebooksGallery({
  notebooks,
  looseNotes,
  currentUser,
  onLogout,
  onSelectNotebook,
  onSelectLooseNote,
  onCreateNotebook,
  onUpdateNotebook,
  onDeleteNotebook,
  onCreateLooseNote,
  onUpdateLooseNote,
  onDeleteLooseNote,
  onMoveNoteToFolder,
}: NotebooksGalleryProps) {
  const [activeNav, setActiveNav] = useState<'home' | 'loose' | 'folders' | 'favorites' | 'trash'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('updated_desc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [scratchpadText, setScratchpadText] = useState('');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null);

  // Modales
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [editingFolder, setEditingFolder] = useState<DigitalNotebook | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderSubject, setFolderSubject] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState(PRESET_COVER_COLORS[0]);
  const [folderIcon, setFolderIcon] = useState('📁');
  const [folderAsNotebook, setFolderAsNotebook] = useState(true);

  // Modal para mover nota a carpeta
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null);

  // Cargar scratchpad desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sirbook_scratchpad_content');
      if (saved) setScratchpadText(saved);
    } catch {
      // ignore
    }
  }, []);

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScratchpadText(val);
    try {
      localStorage.setItem('sirbook_scratchpad_content', val);
    } catch {
      // ignore
    }
  };

  // Extraer todas las materias únicas para filtros
  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    notebooks.forEach((nb) => nb.subject && set.add(nb.subject));
    looseNotes.forEach((n) => n.subject && set.add(n.subject));
    return Array.from(set);
  }, [notebooks, looseNotes]);

  // Cuadernos y Notas activos vs eliminados
  const activeNotebooks = useMemo(() => notebooks.filter((nb) => !nb.deleted_at), [notebooks]);
  const trashedNotebooks = useMemo(() => notebooks.filter((nb) => !!nb.deleted_at), [notebooks]);

  const activeLooseNotes = useMemo(() => looseNotes.filter((n) => !n.deleted_at), [looseNotes]);
  const trashedLooseNotes = useMemo(() => looseNotes.filter((n) => !!n.deleted_at), [looseNotes]);

  // Conteo total de notas sueltas organizadas por carpeta
  const folderLooseNotesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeLooseNotes.forEach((n) => {
      if (n.folderId) {
        map[n.folderId] = (map[n.folderId] || 0) + 1;
      }
    });
    return map;
  }, [activeLooseNotes]);

  // Carpeta activa y sus notas correspondientes para la vista interior
  const openedFolder = useMemo(() => {
    if (!openedFolderId) return null;
    return notebooks.find((nb) => nb.id === openedFolderId && !nb.deleted_at) || null;
  }, [openedFolderId, notebooks]);

  const folderNotes = useMemo(() => {
    if (!openedFolder) return [];

    const items: {
      id: string;
      title: string;
      page: any;
      updated_at: string;
      subject?: string;
      isFavorite?: boolean;
      isLoose: boolean;
      looseNoteRef?: LooseNote;
    }[] = [];

    // 1. Notas sueltas asociadas a esta carpeta
    looseNotes
      .filter((n) => n.folderId === openedFolder.id && !n.deleted_at)
      .forEach((n) => {
        items.push({
          id: n.id,
          title: n.title,
          page: n.page,
          subject: n.subject || openedFolder.subject,
          updated_at: n.updated_at,
          isFavorite: n.isFavorite,
          isLoose: true,
          looseNoteRef: n,
        });
      });

    // 2. Páginas del cuaderno/carpeta
    if (openedFolder.pages && openedFolder.pages.length > 0) {
      openedFolder.pages.forEach((p, idx) => {
        items.push({
          id: p.id || `page-${idx}`,
          title: p.subjectTopic || `${openedFolder.title} - Hoja ${p.pageNumber || idx + 1}`,
          page: p,
          subject: openedFolder.subject,
          updated_at: openedFolder.updated_at,
          isFavorite: openedFolder.isFavorite,
          isLoose: false,
        });
      });
    }

    return items;
  }, [openedFolder, looseNotes]);

  // Filtrado y Ordenación genérica
  const sortItems = <T extends { title: string; updated_at: string; created_at: string; pages?: unknown[] }>(
    items: T[]
  ): T[] => {
    return [...items].sort((a, b) => {
      switch (sortOption) {
        case 'updated_asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'pages_desc':
          return (b.pages?.length || 1) - (a.pages?.length || 1);
        case 'pages_asc':
          return (a.pages?.length || 1) - (b.pages?.length || 1);
        case 'updated_desc':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  };

  // Cuadernos filtrados según pestaña activa
  const displayNotebooks = useMemo(() => {
    let list = activeNav === 'trash' ? trashedNotebooks : activeNotebooks;

    if (activeNav === 'favorites') {
      list = list.filter((nb) => nb.isFavorite);
    }

    if (selectedSubject !== 'all') {
      list = list.filter((nb) => nb.subject === selectedSubject);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (nb) =>
          nb.title.toLowerCase().includes(q) ||
          nb.subject?.toLowerCase().includes(q) ||
          nb.description?.toLowerCase().includes(q)
      );
    }

    return sortItems(list);
  }, [activeNotebooks, trashedNotebooks, activeNav, selectedSubject, searchQuery, sortOption]);

  // Notas sueltas filtradas
  const displayLooseNotes = useMemo(() => {
    let list = activeNav === 'trash' ? trashedLooseNotes : activeLooseNotes;

    if (activeNav === 'favorites') {
      list = list.filter((n) => n.isFavorite);
    }

    if (selectedSubject !== 'all') {
      list = list.filter((n) => n.subject === selectedSubject);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.subject?.toLowerCase().includes(q));
    }

    return sortItems(list);
  }, [activeLooseNotes, trashedLooseNotes, activeNav, selectedSubject, searchQuery, sortOption]);

  // Manejo de creación rápida de Nota Suelta
  const handleCreateQuickNote = () => {
    const newNote: Omit<LooseNote, 'id' | 'created_at' | 'updated_at'> = {
      title: `Nota Rápida ${displayLooseNotes.length + 1}`,
      folderId: null,
      subject: selectedSubject !== 'all' ? selectedSubject : 'General',
      isFavorite: false,
      page: {
        id: `page-loose-${Date.now()}`,
        pageNumber: 1,
        subjectTopic: 'Apunte',
        paperPattern: 'grid',
        stickers: [],
        tilingRoot: { id: `root-${Date.now()}`, type: 'leaf', blockId: 'blk-1' },
        blocks: {},
        shapes: [],
        drawingStrokes: [],
      },
    };
    onCreateLooseNote(newNote);
  };

  // Crear una nueva nota directamente dentro de la carpeta abierta actualmente
  const handleCreateNoteInOpenedFolder = () => {
    if (!openedFolder) return;
    const newNote: Omit<LooseNote, 'id' | 'created_at' | 'updated_at'> = {
      title: `Nota ${folderNotes.length + 1}`,
      folderId: openedFolder.id,
      subject: openedFolder.subject || openedFolder.title,
      isFavorite: false,
      page: {
        id: `page-loose-${Date.now()}`,
        pageNumber: 1,
        subjectTopic: openedFolder.title,
        paperPattern: 'ruled',
        stickers: [],
        tilingRoot: { id: `root-${Date.now()}`, type: 'leaf', blockId: 'blk-1' },
        blocks: {},
        shapes: [],
        drawingStrokes: [],
      },
    };
    onCreateLooseNote(newNote);
  };

  // Abrir modal de carpeta
  const openCreateFolderModal = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderColor(getRandomColor());
    setIsFolderModalOpen(true);
  };

  const openEditFolderModal = (e: React.MouseEvent, nb: DigitalNotebook) => {
    e.stopPropagation();
    setEditingFolder(nb);
    setFolderName(nb.title);
    setFolderColor(nb.coverColor || getRandomColor());
    setIsFolderModalOpen(true);
  };

  const handleRandomizeColor = () => {
    let nextColor = getRandomColor();
    while (nextColor.toLowerCase() === folderColor.toLowerCase() && PRESET_COVER_COLORS.length > 1) {
      nextColor = getRandomColor();
    }
    setFolderColor(nextColor);
  };

  const handleSubmitFolderModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    if (editingFolder) {
      onUpdateNotebook({
        ...editingFolder,
        title: folderName.trim(),
        coverColor: folderColor,
        updated_at: new Date().toISOString(),
      });
    } else {
      onCreateNotebook({
        title: folderName.trim(),
        subject: 'General',
        description: '',
        coverColor: folderColor,
        coverTheme: 'emerald-study',
        icon: '📁',
        asNotebook: true,
        orientation: 'vertical',
        lastActivePageIndex: 0,
        pages: [
          {
            id: `page-${Date.now()}-1`,
            pageNumber: 1,
            subjectTopic: 'Hoja 1',
            paperPattern: 'grid',
            tilingRoot: { id: 'root-1', type: 'leaf', blockId: 'blk-1' },
            blocks: {},
            stickers: [],
            shapes: [],
            drawingStrokes: [],
          },
        ],
      });
    }
    setIsFolderModalOpen(false);
  };

  // Favoritos toggle
  const toggleNotebookFavorite = (e: React.MouseEvent, nb: DigitalNotebook) => {
    e.stopPropagation();
    onUpdateNotebook({
      ...nb,
      isFavorite: !nb.isFavorite,
      updated_at: new Date().toISOString(),
    });
  };

  const toggleLooseNoteFavorite = (e: React.MouseEvent, note: LooseNote) => {
    e.stopPropagation();
    onUpdateLooseNote({
      ...note,
      isFavorite: !note.isFavorite,
      updated_at: new Date().toISOString(),
    });
  };

  // Papelera y Restaurar
  const handleTrashNotebook = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const target = notebooks.find((n) => n.id === id);
    if (!target) return;
    onUpdateNotebook({
      ...target,
      deleted_at: new Date().toISOString(),
    });
  };

  const handleRestoreNotebook = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const target = notebooks.find((n) => n.id === id);
    if (!target) return;
    onUpdateNotebook({
      ...target,
      deleted_at: null,
    });
  };

  const handleTrashLooseNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const target = looseNotes.find((n) => n.id === id);
    if (!target) return;
    onUpdateLooseNote({
      ...target,
      deleted_at: new Date().toISOString(),
    });
  };

  const handleRestoreLooseNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const target = looseNotes.find((n) => n.id === id);
    if (!target) return;
    onUpdateLooseNote({
      ...target,
      deleted_at: null,
    });
  };

  const sortLabel = {
    updated_desc: 'Más recientes',
    updated_asc: 'Más antiguos',
    title_asc: 'Nombre (A - Z)',
    title_desc: 'Nombre (Z - A)',
    pages_desc: 'Páginas (Mayor a menor)',
    pages_asc: 'Páginas (Menor a mayor)',
  }[sortOption];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F7F8] text-[#1E1E1E] font-sans select-none">
      {/* 1. SIDEBAR IZQUIERDO: 100% FUNCIONAL Y ENFOCADO */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#ECECEC] border-r border-[#E0E0E0] flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col p-3 space-y-3">
          {/* Buscador Superior */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar notas o carpetas..."
              className="w-full bg-[#E2E2E2] hover:bg-[#DDD] focus:bg-white border border-transparent focus:border-stone-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#2E2822] placeholder-stone-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Botones de Acción Inmediata: + Nota Suelta y + Carpeta */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCreateQuickNote}
              title="Crear una nota suelta en blanco instantánea"
              className="flex-1 bg-[#00A82D] hover:bg-[#009227] text-white rounded-full py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs transition-all active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nota</span>
            </button>
            <button
              onClick={openCreateFolderModal}
              title="Crear nueva carpeta o cuaderno organizador"
              className="bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-full py-1.5 px-2.5 flex items-center justify-center gap-1 text-xs font-semibold shadow-2xs transition-all active:scale-98"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Carpeta</span>
            </button>
          </div>

          {/* Menú de Navegación Esencial y Real */}
          <nav className="flex flex-col space-y-0.5 pt-2 text-xs font-medium text-stone-700">
            <button
              onClick={() => {
                setActiveNav('home');
                setOpenedFolderId(null);
                setIsSidebarOpenMobile(false);
              }}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                activeNav === 'home'
                  ? 'bg-[#DCDCDC] text-stone-900 font-semibold'
                  : 'hover:bg-black/5 text-stone-700'
              }`}
            >
              <Home className="w-4 h-4 text-stone-600" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => {
                setActiveNav('loose');
                setOpenedFolderId(null);
                setIsSidebarOpenMobile(false);
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                activeNav === 'loose'
                  ? 'bg-[#DCDCDC] text-stone-900 font-semibold'
                  : 'hover:bg-black/5 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-stone-600" />
                <span>Notas Sueltas</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">
                {activeLooseNotes.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveNav('folders');
                setOpenedFolderId(null);
                setIsSidebarOpenMobile(false);
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                activeNav === 'folders'
                  ? 'bg-[#DCDCDC] text-stone-900 font-semibold'
                  : 'hover:bg-black/5 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-4 h-4 text-stone-600" />
                <span>Carpetas / Cuadernos</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">
                {activeNotebooks.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveNav('favorites');
                setOpenedFolderId(null);
                setIsSidebarOpenMobile(false);
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                activeNav === 'favorites'
                  ? 'bg-[#DCDCDC] text-stone-900 font-semibold'
                  : 'hover:bg-black/5 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Favoritos</span>
              </div>
              <span className="text-[10px] text-stone-500 font-mono">
                {activeNotebooks.filter((n) => n.isFavorite).length +
                  activeLooseNotes.filter((n) => n.isFavorite).length}
              </span>
            </button>

            <div className="pt-2 pb-1 border-t border-[#DFDFDF] mt-1" />

            <button
              onClick={() => {
                setActiveNav('trash');
                setOpenedFolderId(null);
                setIsSidebarOpenMobile(false);
              }}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                activeNav === 'trash'
                  ? 'bg-[#DCDCDC] text-stone-900 font-semibold'
                  : 'hover:bg-black/5 text-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-stone-500" />
                <span>Papelera</span>
              </div>
              {(trashedNotebooks.length > 0 || trashedLooseNotes.length > 0) && (
                <span className="text-[10px] text-rose-600 font-mono font-bold">
                  {trashedNotebooks.length + trashedLooseNotes.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Perfil del Usuario en la Base con Sesión Persistente */}
        <div className="p-3 border-t border-[#E0E0E0] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
              {(currentUser?.fullName || currentUser?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs text-stone-800 font-medium truncate block">
                {currentUser?.fullName || currentUser?.email || 'Usuario'}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL Activo
              </span>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-stone-200/60 rounded-md transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* Overlay para móvil */}
      {isSidebarOpenMobile && (
        <div onClick={() => setIsSidebarOpenMobile(false)} className="fixed inset-0 z-30 bg-black/20 md:hidden" />
      )}

      {/* 2. ÁREA PRINCIPAL LIMPIA */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F7F7F8]">
        {/* Header Superior */}
        <header className="w-full max-w-6xl mx-auto px-6 sm:px-10 pt-7 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden p-2 rounded-lg hover:bg-stone-200 text-stone-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              {activeNav === 'folders' && openedFolder && (
                <button
                  type="button"
                  onClick={() => setOpenedFolderId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors mb-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Carpetas</span>
                </button>
              )}
              <div className="flex items-center gap-2.5">
                {activeNav === 'folders' && openedFolder && (
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: openedFolder.coverColor || '#059669' }}
                  />
                )}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A]">
                  {activeNav === 'home'
                    ? 'Inicio'
                    : activeNav === 'loose'
                    ? 'Notas Sueltas'
                    : activeNav === 'folders'
                    ? openedFolder
                      ? openedFolder.title
                      : 'Carpetas y Cuadernos'
                    : activeNav === 'favorites'
                    ? 'Favoritos'
                    : 'Papelera'}
                </h1>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {activeNav === 'home'
                  ? 'Resumen de notas, cuadernos y apuntes rápidos'
                  : activeNav === 'loose'
                  ? 'Hojas sueltas listas para clasificar o editar'
                  : activeNav === 'folders'
                  ? openedFolder
                    ? openedFolder.description || `${folderNotes.length} notas organizadas en esta carpeta`
                    : 'Carpetas de apuntes con hojas enumeradas'
                  : activeNav === 'favorites'
                  ? 'Elementos destacados con estrella'
                  : 'Cuadernos y notas eliminadas'}
              </p>
            </div>
          </div>

          {/* Filtros, Ordenación y Vista (Componente minimalista estilo shadcn) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Dropdown de Ordenación */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 shadow-2xs transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
                <span>{sortLabel}</span>
                <ChevronDown className="w-3 h-3 text-stone-400 ml-0.5" />
              </button>

              {isSortDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-white border border-stone-200 rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100 font-sans text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Ordenar por
                  </div>
                  {[
                    { key: 'updated_desc', label: 'Más recientes primero' },
                    { key: 'updated_asc', label: 'Más antiguos primero' },
                    { key: 'title_asc', label: 'Nombre (A - Z)' },
                    { key: 'title_desc', label: 'Nombre (Z - A)' },
                    { key: 'pages_desc', label: 'Mayor número de hojas' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSortOption(opt.key as SortOption);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                        sortOption === opt.key ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'hover:bg-stone-100'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortOption === opt.key && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alternador de Vista (Cuadrícula / Lista) */}
            <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-stone-900 font-semibold' : 'text-stone-500'
                }`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-2xs text-stone-900 font-semibold' : 'text-stone-500'
                }`}
                title="Vista Lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Chips de Filtro por Materia / Tags (si existen materias) */}
        {allSubjects.length > 0 && (
          <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 pb-3 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSubject === 'all'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              Todas las materias
            </button>
            {allSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedSubject === sub
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 pb-20 space-y-6">
          {activeNav === 'home' ? (
            <>
              {/* FILA 1: WIDGET NOTES (Izquierda) + WIDGET SCRATCH PAD (Derecha) 50/50 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WIDGET 1: CARPETAS Y CUADERNOS */}
                <div className="flex flex-col space-y-2.5 min-w-0">
                  <div className="flex items-center justify-between text-xs text-stone-700 px-1">
                    <span className="font-bold text-[#1A1A1A] text-sm">Carpetas y Cuadernos</span>
                    <button
                      onClick={() => setActiveNav('folders')}
                      className="text-stone-500 hover:text-stone-800 text-[11px] font-semibold"
                    >
                      Ver todos →
                    </button>
                  </div>

                  {/* Tarjetas de Carpetas: Horizontal con scrollbar oculta */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {/* Tarjeta '+ Add new' */}
                    <div className="w-[130px] sm:w-[142px] shrink-0">
                      <AddNewFolderCard onOpenModal={openCreateFolderModal} />
                    </div>

                    {/* Carpetas existentes */}
                    {displayNotebooks.map((nb) => (
                      <div key={nb.id} className="w-[130px] sm:w-[142px] shrink-0">
                        <FolderTabCard
                          notebook={nb}
                          totalCount={(nb.pages?.length || 0) + (folderLooseNotesCountMap[nb.id] || 0)}
                          onOpenFolder={(id) => {
                            setOpenedFolderId(id);
                            setActiveNav('folders');
                          }}
                          onEditFolder={openEditFolderModal}
                          onToggleFavorite={toggleNotebookFavorite}
                          onTrashFolder={handleTrashNotebook}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* WIDGET 2: SCRATCH PAD */}
                <div className="flex flex-col space-y-2.5 min-w-0">
                  <div className="flex items-center justify-between text-xs text-stone-700 px-1">
                    <span className="font-bold text-[#1A1A1A] text-sm">Scratch pad</span>
                    <StickyNote className="w-3.5 h-3.5 text-stone-400" />
                  </div>

                  <div className="h-[148px] sm:h-[155px] bg-[#FEF7CD] border border-[#F5E698]/80 rounded-xl p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col">
                    <textarea
                      value={scratchpadText}
                      onChange={handleScratchpadChange}
                      placeholder="Start writing..."
                      className="w-full h-full bg-transparent border-none outline-none resize-none text-xs text-stone-800 placeholder-stone-500/80 font-sans leading-relaxed selection:bg-amber-200"
                    />
                    <div className="flex items-center justify-between pt-1 text-[10px] text-stone-400 select-none">
                      <span>Autoguardado</span>
                      {scratchpadText && (
                        <button
                          onClick={() => {
                            setScratchpadText('');
                            try {
                              localStorage.removeItem('sirbook_scratchpad_content');
                            } catch {
                              // ignore
                            }
                          }}
                          className="hover:text-stone-700 text-[10px]"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* FILA 2: NOTAS SUELTAS RECIENTES */}
              <div className="flex flex-col space-y-2.5 pt-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-bold text-[#1A1A1A] text-sm">Notas Sueltas Recientes</span>
                  <button
                    onClick={() => setActiveNav('loose')}
                    className="text-stone-500 hover:text-stone-800 text-[11px] font-semibold"
                  >
                    Ver todas ({activeLooseNotes.length}) →
                  </button>
                </div>

                {displayLooseNotes.length === 0 ? (
                  <div className="w-full bg-white border border-stone-200/90 rounded-2xl p-8 text-center space-y-2">
                    <p className="text-xs text-stone-600">No tienes notas sueltas en este momento.</p>
                    <button
                      onClick={handleCreateQuickNote}
                      className="px-4 py-1.5 rounded-lg bg-[#00A82D] hover:bg-[#009227] text-white text-xs font-semibold shadow-2xs"
                    >
                      + Crear Primera Nota Suelta
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {displayLooseNotes.slice(0, 6).map((note) => (
                      <NoteFilePreviewCard
                        key={note.id}
                        title={note.title}
                        updated_at={note.updated_at}
                        page={note.page}
                        subject={note.subject}
                        isFavorite={note.isFavorite}
                        onOpen={() => onSelectLooseNote(note)}
                        actions={
                          <>
                            <button
                              type="button"
                              onClick={(e) => toggleLooseNoteFavorite(e, note)}
                              className="p-1 text-stone-400 hover:text-amber-500"
                              title="Favorito"
                            >
                              <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovingNoteId(note.id);
                              }}
                              title="Mover a una carpeta"
                              className="p-1 rounded text-stone-400 hover:text-stone-800"
                            >
                              <Folder className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleTrashLooseNote(e, note.id)}
                              title="Enviar a papelera"
                              className="p-1 rounded text-stone-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeNav === 'loose' ? (
            /* VISTA DE NOTAS SUELTAS */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500 font-medium">
                  {displayLooseNotes.length} notas sueltas encontradas
                </span>
                <button
                  onClick={handleCreateQuickNote}
                  className="px-3.5 py-1.5 bg-[#00A82D] hover:bg-[#009227] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Nota Suelta</span>
                </button>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayLooseNotes.map((note) => (
                    <NoteFilePreviewCard
                      key={note.id}
                      title={note.title}
                      updated_at={note.updated_at}
                      page={note.page}
                      subject={note.subject}
                      isFavorite={note.isFavorite}
                      onOpen={() => onSelectLooseNote(note)}
                      actions={
                        <>
                          <button
                            type="button"
                            onClick={(e) => toggleLooseNoteFavorite(e, note)}
                            className="p-1 text-stone-400 hover:text-amber-500"
                            title="Favorito"
                          >
                            <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMovingNoteId(note.id);
                            }}
                            title="Mover a una carpeta"
                            className="p-1 rounded text-stone-400 hover:text-stone-800"
                          >
                            <Folder className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleTrashLooseNote(e, note.id)}
                            title="Enviar a papelera"
                            className="p-1 rounded text-stone-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {displayLooseNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onSelectLooseNote(note)}
                      className="group bg-white border border-stone-200/90 hover:border-[#00A82D] rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-stone-900 truncate group-hover:text-emerald-800">
                            {note.title}
                          </h3>
                          <p className="text-[11px] text-stone-500 truncate">
                            {note.subject || 'General'} · {getNoteExcerpt(note)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs text-stone-400">
                        <span className="text-[11px]">{getRelativeTime(note.updated_at)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingNoteId(note.id);
                          }}
                          className="p-1 rounded text-stone-400 hover:text-stone-800"
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleTrashLooseNote(e, note.id)}
                          className="p-1 rounded text-stone-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeNav === 'folders' ? (
            /* VISTA DE CARPETAS / CUADERNOS O INTERIOR DE CARPETA SELECCIONADA */
            openedFolder ? (
              /* VISTA INTERIOR DE LA CARPETA (Estilo Imagen 2 + Imagen 3) */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 font-medium">
                      {folderNotes.length} {folderNotes.length === 1 ? 'nota encontrada' : 'notas encontradas'}
                    </span>
                    {openedFolder.subject && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {openedFolder.subject}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleCreateNoteInOpenedFolder}
                    className="px-3.5 py-1.5 bg-[#00A82D] hover:bg-[#009227] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Nueva Nota</span>
                  </button>
                </div>

                {folderNotes.length === 0 ? (
                  <div className="bg-white border border-stone-200/90 rounded-2xl p-10 text-center space-y-3">
                    <div
                      className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-xl shadow-2xs border border-stone-100"
                      style={{ backgroundColor: `${openedFolder.coverColor || '#059669'}18` }}
                    >
                      <span>{openedFolder.icon || '📁'}</span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-800">Esta carpeta no tiene notas todavía</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Comienza creando una nueva nota dentro de &ldquo;{openedFolder.title}&rdquo;.
                    </p>
                    <button
                      onClick={handleCreateNoteInOpenedFolder}
                      className="px-4 py-2 bg-[#00A82D] hover:bg-[#009227] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear primera nota</span>
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* Galería de notas con previsualización en su proporción original de página */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {folderNotes.map((item) => (
                      <NoteFilePreviewCard
                        key={item.id}
                        title={item.title}
                        updated_at={item.updated_at}
                        page={item.page}
                        subject={item.subject}
                        isFavorite={item.isFavorite}
                        onOpen={() => {
                          if (item.isLoose && item.looseNoteRef) {
                            onSelectLooseNote(item.looseNoteRef);
                          } else {
                            onSelectNotebook(openedFolder.id);
                          }
                        }}
                        actions={
                          item.isLoose && item.looseNoteRef ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => toggleLooseNoteFavorite(e, item.looseNoteRef!)}
                                className="p-1 text-stone-400 hover:text-amber-500"
                                title="Favorito"
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    item.isFavorite ? 'text-amber-500 fill-amber-500' : ''
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovingNoteId(item.id);
                                }}
                                title="Mover a otra carpeta"
                                className="p-1 rounded text-stone-400 hover:text-stone-800"
                              >
                                <Folder className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleTrashLooseNote(e, item.id)}
                                title="Enviar a papelera"
                                className="p-1 rounded text-stone-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {folderNotes.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.isLoose && item.looseNoteRef) {
                            onSelectLooseNote(item.looseNoteRef);
                          } else {
                            onSelectNotebook(openedFolder.id);
                          }
                        }}
                        className="group bg-white border border-stone-200/90 hover:border-[#00A82D] rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-10 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                            <NoteVisualPreview page={item.page} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-stone-900 truncate group-hover:text-emerald-800">
                              {item.title}
                            </h3>
                            <p className="text-[10px] text-stone-400">
                              {getRelativeTime(item.updated_at)} ·{' '}
                              {item.isLoose ? 'Nota en carpeta' : 'Hoja de cuaderno'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 group-hover:underline shrink-0">
                          Abrir apunte →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* LISTADO DE CARPETAS (Estilo Imagen 1) */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-medium">
                    {displayNotebooks.length} carpetas y cuadernos
                  </span>
                  <button
                    onClick={openCreateFolderModal}
                    className="px-3.5 py-1.5 bg-[#00A82D] hover:bg-[#009227] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Nueva Carpeta / Cuaderno</span>
                  </button>
                </div>

                {displayNotebooks.length === 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    <AddNewFolderCard onOpenModal={openCreateFolderModal} />
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {/* Tarjeta 'Add new' con borde punteado según imagen de referencia */}
                    <AddNewFolderCard onOpenModal={openCreateFolderModal} />

                    {displayNotebooks.map((nb) => (
                      <FolderTabCard
                        key={nb.id}
                        notebook={nb}
                        totalCount={(nb.pages?.length || 0) + (folderLooseNotesCountMap[nb.id] || 0)}
                        onOpenFolder={(id) => setOpenedFolderId(id)}
                        onEditFolder={openEditFolderModal}
                        onToggleFavorite={toggleNotebookFavorite}
                        onTrashFolder={handleTrashNotebook}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {displayNotebooks.map((nb) => (
                      <div
                        key={nb.id}
                        onClick={() => setOpenedFolderId(nb.id)}
                        className="group bg-white border border-stone-200/90 hover:border-[#00A82D] rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 border border-stone-200/60"
                            style={{ backgroundColor: `${nb.coverColor}18` }}
                          >
                            <span>{nb.icon || '📁'}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-stone-900 truncate group-hover:text-emerald-800">
                              {nb.title}
                            </h3>
                            <p className="text-[11px] text-stone-500 truncate">
                              {nb.subject || 'General'} · {nb.pages.length} hojas
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs text-stone-400">
                          <button
                            type="button"
                            onClick={(e) => toggleNotebookFavorite(e, nb)}
                            className="p-1 text-stone-300 hover:text-amber-500"
                          >
                            <Star className={`w-3.5 h-3.5 ${nb.isFavorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => openEditFolderModal(e, nb)}
                            className="p-1 rounded text-stone-400 hover:text-stone-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleTrashNotebook(e, nb.id)}
                            className="p-1 rounded text-stone-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : activeNav === 'favorites' ? (
            /* VISTA DE FAVORITOS (NOTAS Y CARPETAS DESTACADAS) */
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Carpetas Favoritas</h3>
                {displayNotebooks.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No tienes carpetas en favoritos.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {displayNotebooks.map((nb) => (
                      <FolderTabCard
                        key={nb.id}
                        notebook={nb}
                        totalCount={(nb.pages?.length || 0) + (folderLooseNotesCountMap[nb.id] || 0)}
                        onOpenFolder={(id) => {
                          setOpenedFolderId(id);
                          setActiveNav('folders');
                        }}
                        onEditFolder={openEditFolderModal}
                        onToggleFavorite={toggleNotebookFavorite}
                        onTrashFolder={handleTrashNotebook}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Notas Sueltas Favoritas</h3>
                {displayLooseNotes.length === 0 ? (
                  <p className="text-xs text-stone-400 italic">No tienes notas sueltas en favoritos.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {displayLooseNotes.map((n) => (
                      <NoteFilePreviewCard
                        key={n.id}
                        title={n.title}
                        updated_at={n.updated_at}
                        page={n.page}
                        subject={n.subject}
                        isFavorite={n.isFavorite}
                        onOpen={() => onSelectLooseNote(n)}
                        actions={
                          <button
                            type="button"
                            onClick={(e) => toggleLooseNoteFavorite(e, n)}
                            className="p-1 text-stone-400 hover:text-amber-500"
                            title="Quitar de favoritos"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          </button>
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VISTA DE PAPELERA */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <span className="text-xs text-stone-500 font-medium">Elementos en la papelera</span>
              </div>

              {displayNotebooks.length === 0 && displayLooseNotes.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
                  La papelera está vacía.
                </div>
              ) : (
                <div className="space-y-4">
                  {displayNotebooks.map((nb) => (
                    <div
                      key={nb.id}
                      className="bg-white border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-stone-400" />
                        <div>
                          <h4 className="text-xs font-bold text-stone-800">{nb.title} (Carpeta)</h4>
                          <span className="text-[10px] text-stone-400">{nb.pages.length} hojas</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleRestoreNotebook(e, nb.id)}
                          className="px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          onClick={() => onDeleteNotebook(nb.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}

                  {displayLooseNotes.map((n) => (
                    <div
                      key={n.id}
                      className="bg-white border border-stone-200 rounded-xl p-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-stone-400" />
                        <div>
                          <h4 className="text-xs font-bold text-stone-800">{n.title} (Nota Suelta)</h4>
                          <span className="text-[10px] text-stone-400">{n.subject || 'General'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleRestoreLooseNote(e, n.id)}
                          className="px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          onClick={() => onDeleteLooseNote(n.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. BOTÓN FLOTANTE NEGRO INFERIOR DERECHO */}
      <button
        onClick={handleCreateQuickNote}
        title="Crear nueva nota suelta instantánea"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-[#1A1A1A] hover:bg-black text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <Sparkles className="w-5 h-5 fill-white stroke-white" />
      </button>

      {/* 4. MODAL SHADCN STYLE: CREAR / EDITAR CARPETA */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative font-sans animate-in zoom-in-95 duration-150">
            {/* Botón Cerrar (X) */}
            <button
              onClick={() => setIsFolderModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Encabezado Dialog */}
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                {editingFolder ? 'Editar Carpeta' : 'Nueva Carpeta'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Escribe el nombre de la carpeta y elige un color característico.
              </p>
            </div>

            <form onSubmit={handleSubmitFolderModal} className="space-y-5">
              {/* Campo Nombre + Círculo Aleatorio + Lápiz RGB */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                  Nombre de la carpeta
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Ej: Biología Celular, Matemáticas..."
                    className="flex-1 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none transition-all shadow-xs"
                  />

                  {/* Grupo de Color: Círculo con Shuffle + Botón Lápiz RGB */}
                  <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/80 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700/60 shrink-0">
                    {/* Círculo con color aleatorio y símbolo medio transparente encima */}
                    <button
                      type="button"
                      onClick={handleRandomizeColor}
                      title="Color aleatorio (Clic para cambiar)"
                      className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-white dark:ring-neutral-900"
                      style={{ backgroundColor: folderColor }}
                    >
                      <Shuffle className="w-4 h-4 text-white/75 drop-shadow-sm transition-transform active:rotate-180" />
                    </button>

                    {/* Lápiz para abrir selector de paleta RGB completa */}
                    <button
                      type="button"
                      onClick={() => colorInputRef.current?.click()}
                      title="Elegir color de toda la paleta RGB"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Input nativo HTML5 que contiene toda la paleta RGB con espectro, cuentagotas y HEX */}
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={folderColor}
                      onChange={(e) => setFolderColor(e.target.value)}
                      className="sr-only"
                    />
                  </div>
                </div>

                {/* Badge con vista previa de código Hexadecimal */}
                <div className="flex items-center gap-2 mt-2 px-0.5">
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">Color:</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60">
                    <span className="w-2 h-2 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: folderColor }} />
                    {folderColor.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Botones Cancelar y Crear Carpeta */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {editingFolder ? 'Guardar Cambios' : 'Crear Carpeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL PARA MOVER NOTA A UNA CARPETA */}
      {movingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative font-sans">
            <button
              onClick={() => setMovingNoteId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-stone-900 mb-3">Mover Nota a Carpeta</h3>
            <p className="text-xs text-stone-500 mb-4">
              Selecciona a qué carpeta o cuaderno deseas añadir esta hoja:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  onMoveNoteToFolder(movingNoteId, null);
                  setMovingNoteId(null);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-100 text-left text-xs text-stone-700 font-medium transition-colors"
              >
                <FileText className="w-4 h-4 text-stone-400" />
                <span>Dejar como Nota Suelta (Sin carpeta)</span>
              </button>

              {activeNotebooks.map((nb) => (
                <button
                  key={nb.id}
                  type="button"
                  onClick={() => {
                    onMoveNoteToFolder(movingNoteId, nb.id);
                    setMovingNoteId(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-50 text-left text-xs text-stone-800 font-medium transition-colors border border-transparent hover:border-emerald-200"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{nb.icon || '📁'}</span>
                    <span className="truncate">{nb.title}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">{nb.pages.length}h</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
