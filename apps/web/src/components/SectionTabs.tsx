'use client';

import React, { useState } from 'react';
import { Section } from '@sirbook/shared';
import { Plus, Hash } from 'lucide-react';

interface SectionTabsProps {
  sections: Section[];
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
  onCreateSection: (title: string) => void;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({
  sections,
  activeSectionId,
  onSelectSection,
  onCreateSection,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateSection(title.trim());
    setTitle('');
    setIsAdding(false);
  };

  return (
    <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-white/5 bg-black/20 overflow-x-auto select-none">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1 mr-2 shrink-0">
        <Hash className="w-3.5 h-3.5" /> Secciones:
      </span>

      {sections.map((sec) => {
        const isActive = sec.id === activeSectionId;
        return (
          <button
            key={sec.id}
            onClick={() => onSelectSection(sec.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all duration-150 ${
              isActive
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {sec.title}
          </button>
        );
      })}

      {isAdding ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de sección..."
            className="bg-zinc-900 border border-indigo-500/50 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none"
            autoFocus
            onBlur={() => !title.trim() && setIsAdding(false)}
          />
          <button
            type="submit"
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-medium"
          >
            Añadir
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Nueva Sección
        </button>
      )}
    </div>
  );
};
