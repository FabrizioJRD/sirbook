'use client';

import React, { useState } from 'react';
import { FreeBlockContent } from '@sirbook/shared';
import { PenLine, Trash2, Edit3, Eye } from 'lucide-react';

interface FreeBlockProps {
  content: FreeBlockContent;
  onUpdate?: (newContent: FreeBlockContent) => void;
  onDelete?: () => void;
}

export const FreeBlock: React.FC<FreeBlockProps> = ({
  content,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(!content.markdown);
  const [title, setTitle] = useState(content.titulo || '');
  const [markdown, setMarkdown] = useState(content.markdown || '');

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate({
        modo: 'libre',
        titulo: title.trim() || undefined,
        markdown: markdown.trim()
      });
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500 relative group transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PenLine className="w-3 h-3" /> Nota Libre
            </span>
          </div>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la nota (opcional)..."
              className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-base font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          ) : (
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {title || 'Nota Personal'}
            </h3>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isEditing ? 'Vista Previa' : 'Editar Nota'}
          >
            {isEditing ? <Eye className="w-4 h-4 text-emerald-400" /> : <Edit3 className="w-4 h-4" />}
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

      {/* Content Editor / Preview */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={5}
            placeholder="Escribe tus apuntes libres aquí en texto plano o Markdown..."
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
            >
              Guardar Nota
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm md:text-base text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {markdown || (
            <span className="text-zinc-500 italic">Nota vacía. Haz clic en el lápiz para editar.</span>
          )}
        </div>
      )}
    </div>
  );
};
