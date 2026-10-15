'use client';

import React, { useState } from 'react';
import { Notebook } from '@sirbook/shared';
import { Book, Plus, Sparkles, Folder, Layers, Cloud, HardDrive } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SidebarProps {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  onSelectNotebook: (id: string) => void;
  onCreateNotebook: (title: string, color: string, icon: string) => void;
}

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#2563EB', // Blue
  '#DB2777', // Pink
];

export const Sidebar: React.FC<SidebarProps> = ({
  notebooks,
  activeNotebookId,
  onSelectNotebook,
  onCreateNotebook,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateNotebook(newTitle.trim(), selectedColor, 'book');
    setNewTitle('');
    setShowModal(false);
  };

  return (
    <aside className="w-72 h-screen flex flex-col glass-panel border-r border-white/5 select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">Sirbook</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.0
              </span>
            </div>
            <p className="text-xs text-zinc-400">Cuadernos Inteligentes</p>
          </div>
        </div>
      </div>

      {/* Sync Status Badge */}
      <div className="px-5 py-2.5 bg-black/20 border-b border-white/5 flex items-center justify-between text-xs">
        <span className="text-zinc-400">Almacenamiento:</span>
        <div className="flex items-center gap-1.5">
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <Cloud className="w-3.5 h-3.5" /> Supabase Cloud
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-400 font-medium" title="Almacenamiento local activo">
              <HardDrive className="w-3.5 h-3.5" /> Local Sync
            </span>
          )}
        </div>
      </div>

      {/* Notebooks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5" /> Mis Cuadernos ({notebooks.length})
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="p-1 hover:bg-white/10 rounded-md text-zinc-300 hover:text-white transition-colors"
            title="Nuevo Cuaderno"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {notebooks.map((nb) => {
          const isActive = nb.id === activeNotebookId;
          return (
            <button
              key={nb.id}
              onClick={() => onSelectNotebook(nb.id)}
              className={`w-full group text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: nb.cover_color }}
              />
              <span className="truncate text-sm font-medium flex-1">{nb.title}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </button>
          );
        })}

        {notebooks.length === 0 && (
          <div className="text-center py-10 px-4">
            <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Aún no tienes cuadernos</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              + Crear primer cuaderno
            </button>
          </div>
        )}
      </div>

      {/* Quick Tips Footer */}
      <div className="p-4 border-t border-white/5 bg-zinc-950/40">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Escribe palabras clave y la IA sintetizará el cuaderno.</span>
        </div>
      </div>

      {/* Modal Crear Cuaderno */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A1D] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-1">Nuevo Cuaderno</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Crea un espacio temático para tus notas, conceptos y gráficos.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Título del Cuaderno
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Bioquímica Celular, Macroeconomía..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Color de Portada
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        selectedColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                >
                  Crear Cuaderno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
