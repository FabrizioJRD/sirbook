'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '@sirbook/shared';
import {
  Sparkles,
  Menu,
  Check,
  Copy,
  Trash2,
  X,
  Loader2,
  Zap
} from 'lucide-react';

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (updated: Partial<Note>) => void;
  onDeleteNote: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

interface GhostSuggestion {
  keyword: string;
  completionText: string;
  insertPosition: number;
}

const STOPWORDS = new Set([
  'que', 'los', 'las', 'por', 'con', 'para', 'una', 'uno', 'del', 'el', 'la', 'y', 'o', 'de', 'en', 'a', 'al', 'se', 'es', 'un'
]);

export function NoteEditor({
  note,
  onUpdateNote,
  onDeleteNote,
  onToggleSidebar,
  isSidebarOpen,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [suggestion, setSuggestion] = useState<GhostSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Guardado');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedKeywordRef = useRef<string>('');

  // Sincronizar estado local al cambiar de nota
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setSuggestion(null);
  }, [note.id]);

  // Manejar guardado automático con debounce
  const triggerAutoSave = useCallback(
    (newTitle: string, newContent: string) => {
      setStatusMessage('Guardando...');
      onUpdateNote({
        title: newTitle,
        content: newContent,
        updated_at: new Date().toISOString(),
      });
      setTimeout(() => {
        setStatusMessage('Guardado');
      }, 300);
    },
    [onUpdateNote]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content);
  };

  // Extraer término candidato antes del cursor con precisión
  const extractCandidateKeyword = (text: string, cursorPosition: number): string | null => {
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastLine = textBeforeCursor.split('\n').pop() || '';
    const trimmedLine = lastLine.trim();

    if (!trimmedLine || trimmedLine.length < 3) return null;

    // 1. Si termina con dos puntos (ej: "Fotosíntesis:" o "- Mitocondria:"), extraer la palabra antes de los dos puntos
    const colonMatch = trimmedLine.match(/(?:^|[#*•\->\s])([A-Za-zÀ-ÿ0-9\s_-]{3,35}):$/);
    if (colonMatch && colonMatch[1]) {
      const kw = colonMatch[1].trim();
      if (kw.length >= 3 && !STOPWORDS.has(kw.toLowerCase())) {
        return kw;
      }
    }

    // 2. Si no termina en dos puntos, extraer las últimas 1 a 3 palabras
    const trailingMatch = trimmedLine.match(/(?:^|[#*•\->:,;]|\b)([A-Za-zÀ-ÿ0-9_-]+(?:\s+[A-Za-zÀ-ÿ0-9_-]+){0,2})$/);
    if (trailingMatch && trailingMatch[1]) {
      const kw = trailingMatch[1].trim();
      if (kw.length >= 3 && !STOPWORDS.has(kw.toLowerCase())) {
        return kw;
      }
    }

    return null;
  };

  // Consultar autocompletado con IA
  const fetchAutocomplete = async (keyword: string, cursorPosition: number) => {
    if (lastFetchedKeywordRef.current === keyword) return;
    lastFetchedKeywordRef.current = keyword;

    setIsLoading(true);
    try {
      const res = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          context: title || 'Apuntes Generales',
        }),
      });

      if (!res.ok) throw new Error('Error en autocompletado');
      const data = await res.json();

      if (data.success && data.completionText) {
        setSuggestion({
          keyword,
          completionText: data.completionText,
          insertPosition: cursorPosition,
        });
      } else {
        setSuggestion(null);
      }
    } catch {
      setSuggestion(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);
    triggerAutoSave(title, val);

    // Cancelar debounce previo
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si el usuario borró o cambió, ocultar sugerencia actual
    setSuggestion(null);

    // Detectar palabra clave al pausar la escritura (~350ms)
    debounceTimerRef.current = setTimeout(() => {
      const candidate = extractCandidateKeyword(val, cursorPos);
      if (candidate) {
        fetchAutocomplete(candidate, cursorPos);
      }
    }, 350);
  };

  // Aceptar sugerencia (con Tab en teclado o con tap en móviles)
  const acceptSuggestion = useCallback(() => {
    if (!suggestion || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const before = content.slice(0, cursorPos);
    const after = content.slice(cursorPos);

    let textToInsert = suggestion.completionText;
    // Evitar duplicar dos puntos "::" si el usuario ya escribió ":"
    if (before.trimEnd().endsWith(':') && textToInsert.startsWith(':')) {
      textToInsert = textToInsert.replace(/^:\s*/, ' ');
    }

    const newContent = before + textToInsert + after;
    const newCursorPos = cursorPos + textToInsert.length;

    setContent(newContent);
    setSuggestion(null);
    lastFetchedKeywordRef.current = '';
    triggerAutoSave(title, newContent);

    // Restaurar foco y posición del cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 20);
  }, [suggestion, content, title, triggerAutoSave]);

  const dismissSuggestion = () => {
    setSuggestion(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Capturar tecla TAB y ESCAPE en computadoras de escritorio
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestion) {
      if (e.key === 'Tab') {
        e.preventDefault();
        acceptSuggestion();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        dismissSuggestion();
        return;
      }
    }

    // Permitir tabular sangría si no hay sugerencia activa
    if (e.key === 'Tab' && !suggestion) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      triggerAutoSave(title, newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleCopyNote = () => {
    const fullText = `${title}\n\n${content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0C0E] text-zinc-100 overflow-hidden relative font-sans">
      {/* Barra superior limpia estilo bloc de notas */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-[#0e0f13]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center space-x-3">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              title="Mostrar notas"
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/5 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {statusMessage}
            </span>

            {isLoading && (
              <span className="flex items-center gap-1 text-[11px] text-violet-400 font-mono animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Buscando concepto...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyNote}
            title="Copiar texto completo"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={onDeleteNote}
            title="Eliminar nota"
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Lienzo tradicional del Bloc de Notas */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-12 pt-6 sm:pt-8 pb-32 sm:pb-24 overflow-y-auto relative">
        {/* Título de la nota */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Título del cuaderno o tema..."
          className="text-2xl sm:text-3xl font-bold tracking-tight text-white placeholder-zinc-600 bg-transparent outline-none border-none mb-4 w-full font-sans"
        />

        {/* Área de texto limpia */}
        <div className="relative flex-1 flex flex-col min-h-[450px]">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe en tu cuaderno inteligente aquí... Al escribir un concepto como 'Fotosíntesis', 'Mitocondria' o 'Dijkstra', la IA sugerirá la continuación automáticamente."
            className="w-full flex-1 bg-transparent text-zinc-200 text-base sm:text-lg leading-relaxed placeholder-zinc-700 outline-none resize-none font-sans select-text scrollbar-thin"
            spellCheck={false}
          />
        </div>
      </main>

      {/* Tarjeta Flotante de Autocompletado (Desktop + Móviles) */}
      {suggestion && (
        <div className="fixed sm:absolute bottom-12 sm:bottom-14 left-4 right-4 sm:left-12 sm:right-12 z-30 max-w-4xl sm:mx-auto">
          <div
            onClick={acceptSuggestion}
            className="p-3.5 rounded-2xl bg-[#151322]/95 border border-violet-500/50 shadow-2xl shadow-violet-950/70 backdrop-blur-xl animate-fade-in cursor-pointer hover:border-violet-400 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="p-1.5 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4 text-violet-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">
                      Sugerencia para "{suggestion.keyword}"
                    </span>
                    {/* Indicación para Desktop */}
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                      Pulsa <kbd className="px-1.5 py-0.5 bg-violet-900/60 text-violet-200 border border-violet-500/40 rounded font-bold">Tab ⇥</kbd> para aceptar
                    </span>
                    {/* Indicación para Móviles */}
                    <span className="sm:hidden text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Toca aquí para insertar
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                    <span className="text-violet-400 font-semibold">{suggestion.keyword}</span>
                    <span className="text-zinc-300 font-normal">{suggestion.completionText}</span>
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={acceptSuggestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all"
                >
                  <span>Insertar</span>
                  <span className="hidden sm:inline font-mono text-[10px] bg-violet-800/80 px-1 py-0.5 rounded">Tab ⇥</span>
                  <span className="sm:hidden text-xs">⇥</span>
                </button>
                <button
                  onClick={dismissSuggestion}
                  title="Descartar (Esc)"
                  className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de estado inferior discreta */}
      <footer className="px-4 sm:px-6 py-2.5 border-t border-white/5 bg-[#0e0f13]/90 backdrop-blur-sm flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
        <div className="flex items-center space-x-3">
          <span>{wordCount} palabras</span>
          <span>•</span>
          <span>{charCount} caracteres</span>
        </div>

        <div className="flex items-center space-x-2 text-zinc-400">
          <span className="hidden sm:inline text-zinc-400">
            Escribe un término clave y pulsa <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/10 rounded font-mono text-[10px] text-zinc-200">Tab ⇥</kbd> para autocompletar
          </span>
          <span className="sm:hidden text-zinc-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-violet-400" /> Autocompletado con IA activo
          </span>
        </div>
      </footer>
    </div>
  );
}
