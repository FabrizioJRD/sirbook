'use client';

import React, { useState } from 'react';
import { StickerItem } from '../../types/notebook-engine';
import { X, Sparkles, Tag, Plus, Check } from 'lucide-react';

interface StickerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSticker: (sticker: StickerItem) => void;
}

const PRESET_STICKERS: StickerItem[] = [
  { id: 'pre-1', name: 'Clave', emoji: '💡', color: 'bg-amber-400 text-amber-950 border-amber-300', text: 'Concepto fundamental' },
  { id: 'pre-2', name: 'Examen', emoji: '🎯', color: 'bg-rose-400 text-rose-950 border-rose-300', text: 'Pregunta recurrente' },
  { id: 'pre-3', name: 'Prioridad', emoji: '⭐', color: 'bg-indigo-400 text-indigo-950 border-indigo-300', text: 'Alta importancia' },
  { id: 'pre-4', name: 'Experimento', emoji: '🔬', color: 'bg-emerald-400 text-emerald-950 border-emerald-300', text: 'Comprobado en lab' },
  { id: 'pre-5', name: 'Atención', emoji: '⚠️', color: 'bg-orange-400 text-orange-950 border-orange-300', text: 'Cuidado con excepciones' },
  { id: 'pre-6', name: 'Fórmula', emoji: '📐', color: 'bg-cyan-400 text-cyan-950 border-cyan-300', text: 'Ecuación matemática' },
  { id: 'pre-7', name: 'Idea', emoji: '🚀', color: 'bg-purple-400 text-purple-950 border-purple-300', text: 'Hipótesis o proyecto' },
  { id: 'pre-8', name: 'Duda', emoji: '❓', color: 'bg-sky-400 text-sky-950 border-sky-300', text: 'Consultar en clase' },
];

const COLOR_OPTIONS = [
  { label: 'Ámbar', bg: 'bg-amber-400 text-amber-950 border-amber-300' },
  { label: 'Esmeralda', bg: 'bg-emerald-400 text-emerald-950 border-emerald-300' },
  { label: 'Rosa', bg: 'bg-rose-400 text-rose-950 border-rose-300' },
  { label: 'Índigo', bg: 'bg-indigo-400 text-indigo-950 border-indigo-300' },
  { label: 'Cian', bg: 'bg-cyan-400 text-cyan-950 border-cyan-300' },
  { label: 'Púrpura', bg: 'bg-purple-400 text-purple-950 border-purple-300' },
];

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  isOpen,
  onClose,
  onAddSticker,
}) => {
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🔖');
  const [customText, setCustomText] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].bg);

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onAddSticker({
      id: `sticker-${Date.now()}`,
      name: customName.trim(),
      emoji: customEmoji || '🔖',
      text: customText.trim() || undefined,
      color: selectedColor,
      category: 'custom',
    });

    setCustomName('');
    setCustomText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/35 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-[#FAF7F2] border border-[#DDD6C9] rounded-2xl w-full max-w-md p-5 shadow-2xl animate-fade-in text-[#2E2822]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DFD8CB] mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#EFEAE1] text-[#8C6B3D] border border-[#DFD8CB]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#2E2822]">Stickers & Sellos para tu Hoja</h3>
              <p className="text-[11px] text-[#786E64]">Añade sellos vistosos con nombre a tu cuaderno</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#786E64] hover:text-[#2E2822] hover:bg-[#EFEAE1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stickers Predeterminados */}
        <div className="mb-5">
          <span className="text-[11px] font-semibold text-[#685F54] uppercase tracking-wider block mb-2">
            Sellos Rápidos Populares
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_STICKERS.map((stk) => (
              <button
                key={stk.id}
                onClick={() => {
                  onAddSticker({ ...stk, id: `sticker-${Date.now()}-${stk.id}` });
                  onClose();
                }}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left shadow-xs transition-transform hover:scale-105 active:scale-95 ${stk.color}`}
              >
                <span className="text-lg">{stk.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold leading-none">{stk.name}</div>
                  {stk.text && (
                    <div className="text-[9px] opacity-85 truncate mt-0.5">{stk.text}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Crear Sticker Personalizado */}
        <form onSubmit={handleCreateCustom} className="pt-3 border-t border-[#DFD8CB] space-y-3">
          <span className="text-[11px] font-semibold text-[#685F54] uppercase tracking-wider block">
            Crear Sticker Personalizado
          </span>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value.slice(0, 2))}
              placeholder="🔖"
              className="w-12 text-center bg-white border border-[#D5CDBD] text-[#2E2822] rounded-xl py-2 text-base focus:outline-none focus:border-[#8C6B3D] shadow-xs"
            />
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nombre del sticker (ej: Vital, Repasar)..."
              className="flex-1 bg-white border border-[#D5CDBD] text-[#2E2822] placeholder-[#9E9589] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#8C6B3D] shadow-xs"
            />
          </div>

          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Nota o descripción breve (opcional)..."
            className="w-full bg-white border border-[#D5CDBD] text-[#2E2822] placeholder-[#9E9589] rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#8C6B3D] shadow-xs"
          />

          {/* Color selector */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {COLOR_OPTIONS.map((col, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedColor(col.bg)}
                  className={`w-5 h-5 rounded-full border border-black/20 transition-transform ${
                    selectedColor === col.bg ? 'scale-125 ring-2 ring-[#8C6B3D]' : 'hover:scale-110'
                  } ${col.bg.split(' ')[0]}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={!customName.trim()}
              className="px-3 py-1.5 rounded-xl bg-[#8C6B3D] hover:bg-[#78592E] disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
