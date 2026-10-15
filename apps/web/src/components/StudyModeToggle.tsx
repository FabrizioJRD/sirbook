'use client';

import React from 'react';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

interface StudyModeToggleProps {
  studyMode: boolean;
  onToggle: () => void;
}

export const StudyModeToggle: React.FC<StudyModeToggleProps> = ({
  studyMode,
  onToggle,
}) => {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
        studyMode
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/20'
          : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-zinc-200 hover:border-white/10'
      }`}
      title={
        studyMode
          ? 'Modo Estudio Activo: Haz clic en las tarjetas difuminadas para revelar el contenido'
          : 'Activar Modo Estudio: Difumina definiciones y datos para repasarlos como tarjetas de memoria'
      }
    >
      <GraduationCap className={`w-4 h-4 ${studyMode ? 'text-amber-400 animate-bounce' : 'text-zinc-400'}`} />
      <span>Modo Estudio</span>
      {studyMode ? (
        <EyeOff className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
      ) : (
        <Eye className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
      )}
    </button>
  );
};
