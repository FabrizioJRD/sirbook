'use client';

import React, { useState } from 'react';
import { Note } from '@sirbook/shared';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  ChevronLeft,
  Sparkles,
  Pin,
  X,
  Tag,
  Check,
  FolderOpen
} from 'lucide-react';

interface NotesSidebarProps {
  notes: Note[];
  activeNoteId: string;
  isOpen: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onTogglePinNote?: (id: string, e: React.MouseEvent) => void;
  onToggleSidebar: () => void;
}

interface NoteTheme {
  icon: string;
  tag: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  activeBorder: string;
}

export function getNoteTheme(note: Note): NoteTheme {
  const text = (note.title + ' ' + note.content).toLowerCase();

  if (
    text.includes('bio') ||
    text.includes('célula') ||
    text.includes('fotosínt') ||
    text.includes('adn') ||
    text.includes('mitocondria') ||
    text.includes('krebs')
  ) {
    return {
      icon: '🧬',
      tag: 'Biología',
      accentBg: 'bg-emerald-500/10',
      accentText: 'text-emerald-400',
      accentBorder: 'border-emerald-500/20',
      activeBorder: 'border-l-emerald-500',
    };
  }

  if (
    text.includes('algo') ||
    text.includes('code') ||
    text.includes('código') ||
    text.includes('dijkstra') ||
    text.includes('recurs') ||
    text.includes('python') ||
    text.includes('grafos') ||
    text.includes('transformer') ||
    text.includes('react')
  ) {
    return {
      icon: '💻',
      tag: 'Código',
      accentBg: 'bg-indigo-500/10',
      accentText: 'text-indigo-400',
      accentBorder: 'border-indigo-500/20',
      activeBorder: 'border-l-indigo-500',
    };
  }

  if (
    text.includes('rock') ||
    text.includes('music') ||
    text.includes('música') ||
    text.includes('guitar') ||
    text.includes('cancion') ||
    text.includes('ritmo')
  ) {
    return {
      icon: '🎸',
      tag: 'Música',
      accentBg: 'bg-rose-500/10',
      accentText: 'text-rose-400',
      accentBorder: 'border-rose-500/20',
      activeBorder: 'border-l-rose-500',
    };
  }

  if (
    text.includes('econ') ||
    text.includes('finanz') ||
    text.includes('dinero') ||
    text.includes('cripto') ||
    text.includes('bitcoin') ||
    text.includes('mercado') ||
    text.includes('inflac')
  ) {
    return {
      icon: '📈',
      tag: 'Finanzas',
      accentBg: 'bg-amber-500/10',
      accentText: 'text-amber-400',
      accentBorder: 'border-amber-500/20',
      activeBorder: 'border-l-amber-500',
    };
  }

  if (
    text.includes('fisic') ||
    text.includes('quimic') ||
    text.includes('cuantic') ||
    text.includes('atomo') ||
    text.includes('gravedad') ||
    text.includes('entropia')
  ) {
    return {
      icon: '⚛️',
      tag: 'Física',
      accentBg: 'bg-cyan-500/10',
      accentText: 'text-cyan-400',
      accentBorder: 'border-cyan-500/20',
      activeBorder: 'border-l-cyan-500',
    };
  }

  return {
    icon: '📝',
    tag: 'Apuntes',
    accentBg: 'bg-violet-500/10',
    accentText: 'text-violet-400',
    accentBorder: 'border-violet-500/20',
    activeBorder: 'border-l-violet-500',
  };
}

export function NotesSidebar({
  notes,
  activeNoteId,
  isOpen,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePinNote,
  onToggleSidebar,
}: NotesSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Formato de hora amigable estilo Apple Notes
  function formatTime(isoString: string) {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  // Snippet limpio sin símbolos de Markdown
  function getPreviewSnippet(content: string) {
    const cleaned = content
      .replace(/[#*`_>~-]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    if (!cleaned) return 'Sin contenido aún...';
    return cleaned.slice(0, 85) + (cleaned.length > 85 ? '...' : '');
  }

  // Extraer categorías dinámicas según el contenido de las notas
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      const theme = getNoteTheme(n);
      set.add(theme.tag);
    });
    return Array.from(set);
  }, [notes]);

  // Filtrar notas por texto y categoría seleccionada
  const filteredNotes = notes.filter((n) => {
    const theme = getNoteTheme(n);
    const matchesSearch =
      !searchQuery.trim() ||
      (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'pinned'
        ? Boolean(n.pinned)
        : theme.tag.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Separar en fijadas y recientes
  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned);

  const renderNoteCard = (note: Note) => {
    const isActive = note.id === activeNoteId;
    const theme = getNoteTheme(note);

    return (
      <div
        key={note.id}
        onClick={() => onSelectNote(note.id)}
        className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-150 border ${
          isActive
            ? `bg-white/[0.06] border-white/10 ${theme.activeBorder} border-l-4 shadow-lg shadow-black/40`
            : 'bg-[#15161A]/60 hover:bg-[#1A1C22] border-white/[0.04] hover:border-white/10'
        }`}
      >
        <div className="flex items-start gap-2.5">
          {/* Icono temático con pastilla suave */}
          <div
            className={`w-8 h-8 rounded-xl ${theme.accentBg} ${theme.accentText} border ${theme.accentBorder} flex items-center justify-center text-sm shrink-0 shadow-xs`}
          >
            {theme.icon}
          </div>

          {/* Contenido de la tarjeta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1.5 mb-0.5">
              <h4
                className={`text-xs font-semibold truncate ${
                  isActive ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                }`}
              >
                {note.title.trim() || 'Nota sin título'}
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                {formatTime(note.updated_at)}
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-sans">
              {getPreviewSnippet(note.content)}
            </p>

            {/* Fila de Etiquetas y Acciones Rápidas */}
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.04]">
              <span
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md ${theme.accentBg} ${theme.accentText} font-medium border ${theme.accentBorder}`}
              >
                #{theme.tag}
              </span>

              {/* Controles de pin y borrar */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onTogglePinNote && (
                  <button
                    onClick={(e) => onTogglePinNote(note.id, e)}
                    title={note.pinned ? 'Desfijar nota' : 'Fijar nota al inicio'}
                    className={`p-1 rounded-md transition-colors ${
                      note.pinned
                        ? 'text-amber-400 bg-amber-400/10'
                        : 'text-zinc-500 hover:text-amber-300 hover:bg-white/5'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                )}

                {notes.length > 1 && (
                  <button
                    onClick={(e) => onDeleteNote(note.id, e)}
                    title="Eliminar nota"
                    className="p-1 rounded-md hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col w-76 sm:w-80 bg-[#0E0F12] border-r border-white/5 transition-transform duration-200 ease-in-out md:static select-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-76 md:!-ml-80'
      }`}
    >
      {/* 1. Header con Branding Estilo Premium */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-[#121317]/60">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 shadow-md shadow-violet-600/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-sm">
                Sirbook
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium">Cuaderno Inteligente</p>
          </div>
        </div>

        <button
          onClick={onToggleSidebar}
          title="Ocultar menú"
          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Botón Principal "+ Nueva Nota" tipo Apple Notes / Bear */}
      <div className="p-3 pb-2">
        <button
          onClick={onCreateNote}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/25 transition-all active:scale-[0.98] group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Nueva Nota
          </span>
          <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono text-violet-200">
            ⌘N
          </span>
        </button>
      </div>

      {/* 3. Buscador Elegante */}
      <div className="px-3 py-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar apuntes o temas..."
            className="w-full pl-9 pr-7 py-2 text-xs bg-white/[0.04] border border-white/5 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Categorías Rápidas / Filtros con Iconos de Color */}
      <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-white/5">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all ${
            selectedCategory === 'all'
              ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          Todas ({notes.length})
        </button>

        {pinnedNotes.length > 0 && (
          <button
            onClick={() => setSelectedCategory('pinned')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 flex items-center gap-1 transition-all ${
              selectedCategory === 'pinned'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            <Pin className="w-2.5 h-2.5" /> Fijadas ({pinnedNotes.length})
          </button>
        )}

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            #{cat}
          </button>
        ))}
      </div>

      {/* 5. Lista de Notas Agrupada (Fijadas + Recientes) */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2 py-3 scrollbar-thin">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto opacity-30 text-zinc-400" />
            <p>No se encontraron notas en esta categoría.</p>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-[11px] text-violet-400 hover:text-violet-300 underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Notas Fijadas */}
            {pinnedNotes.length > 0 && selectedCategory === 'all' && (
              <div className="space-y-1.5 mb-3">
                <div className="px-1 flex items-center gap-1 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                  <Pin className="w-3 h-3" /> Fijadas
                </div>
                {pinnedNotes.map((note) => renderNoteCard(note))}
              </div>
            )}

            {/* Todas las Notas o Notas Recientes */}
            <div className="space-y-1.5">
              {pinnedNotes.length > 0 && selectedCategory === 'all' && (
                <div className="px-1 flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <FolderOpen className="w-3 h-3" /> Recientes
                </div>
              )}
              {(selectedCategory === 'all' ? unpinnedNotes : filteredNotes).map((note) =>
                renderNoteCard(note)
              )}
            </div>
          </>
        )}
      </div>

      {/* 6. Footer Discreto con Estadísticas */}
      <div className="p-3 border-t border-white/5 bg-[#121317]/50 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="font-medium text-zinc-400">
          {notes.length} {notes.length === 1 ? 'nota' : 'notas'} guardadas
        </span>
        <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
          <Check className="w-3 h-3" /> Guardado local
        </span>
      </div>
    </aside>
  );
}
