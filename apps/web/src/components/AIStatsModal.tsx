'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  TrendingDown,
  Clock,
  ShieldCheck,
  Key,
  X,
  Check,
  Trash2,
  HardDrive,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export interface AIStats {
  totalGenerations: number;
  cacheHits: number;
  totalCostSavedUSD: number;
  lastLatencyMs: number;
  lastProvider: string;
}

interface AIStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AIStats;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
  onQuickGenerate: (keyword: string, mode: 'concept' | 'graphic' | 'curiosity') => void;
}

export const AIStatsModal: React.FC<AIStatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  customApiKey,
  onSaveApiKey,
  onQuickGenerate,
}) => {
  const [inputKey, setInputKey] = useState(customApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const hitRate = stats.totalGenerations > 0
    ? Math.round((stats.cacheHits / stats.totalGenerations) * 100)
    : 100;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121316] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Motor de IA & Reducción de Costos
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Caché SHA-256 Activa
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Pipeline desacoplado Search-First + Structured LLM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Métricas Clave */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-xl p-3 border border-white/5 bg-zinc-900/50">
              <span className="text-[11px] text-zinc-400 block mb-1">Aciertos Caché</span>
              <div className="text-xl font-bold text-emerald-400 flex items-baseline gap-1">
                {hitRate}%
                <span className="text-[10px] text-zinc-500 font-normal">({stats.cacheHits}/{stats.totalGenerations})</span>
              </div>
            </div>

            <div className="glass-card rounded-xl p-3 border border-white/5 bg-zinc-900/50">
              <span className="text-[11px] text-zinc-400 block mb-1">Costo Ahorrado</span>
              <div className="text-xl font-bold text-amber-400">
                ${stats.totalCostSavedUSD.toFixed(3)}
                <span className="text-[10px] text-zinc-500 font-normal ml-0.5">USD</span>
              </div>
            </div>

            <div className="glass-card rounded-xl p-3 border border-white/5 bg-zinc-900/50">
              <span className="text-[11px] text-zinc-400 block mb-1">Última Latencia</span>
              <div className="text-xl font-bold text-indigo-400">
                {stats.lastLatencyMs}
                <span className="text-[10px] text-zinc-500 font-normal ml-0.5">ms</span>
              </div>
            </div>

            <div className="glass-card rounded-xl p-3 border border-white/5 bg-zinc-900/50">
              <span className="text-[11px] text-zinc-400 block mb-1">Almacenamiento</span>
              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1 mt-1">
                {isSupabaseConfigured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" /> Supabase
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" /> Local Sync
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cómo Sirbook reduce costos al 90% */}
          <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs space-y-2">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              ¿Cómo optimiza los costos este motor?
            </div>
            <ul className="text-zinc-400 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li><b className="text-zinc-200">Caché Hash SHA-256 en $O(1)$:</b> Consultas repetidas de temas o palabras clave devuelven el JSON en &lt; 10ms sin llamadas a la API de IA.</li>
              <li><b className="text-zinc-200">Search-First Desacoplado:</b> La búsqueda web externa se hace vía SearXNG ($0) o Serper ($0.001) en vez de pagar los $15/1k de Google Grounding.</li>
              <li><b className="text-zinc-200">Structured Output Estricto:</b> Gemini Flash solo recibe texto condensado y retorna JSON con Zod, ahorrando hasta un 80% en tokens de salida.</li>
            </ul>
          </div>

          {/* Configuración Dinámica de Gemini API Key */}
          <div className="glass-card rounded-xl p-4 border border-white/10 bg-black/40">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                API Key de Google Gemini (Opcional)
              </label>
              {customApiKey ? (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                  Activa en cliente
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  Modo Local $0 Activo
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
              Si tienes tu propia clave de Gemini Flash, puedes pegarla aquí para probar generación en vivo con internet sin reiniciar el servidor. Si no tienes una, la app usará el generador offline inteligente determinista.
            </p>

            <form onSubmit={handleSave} className="flex items-center gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1 shrink-0"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
                Guardar
              </button>
              {customApiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Eliminar clave y volver al generador offline"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>

          {/* Pruebas Rápidas con 1 Clic */}
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Pruebas Rápidas de IA (Generación Inmediata):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onQuickGenerate('Fotosíntesis', 'graphic');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">
                  🌱 Fotosíntesis
                </div>
                <div className="text-[10px] text-zinc-400">Modo Gráfico Mermaid</div>
              </button>

              <button
                onClick={() => {
                  onQuickGenerate('Mitocondria', 'concept');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-blue-300 truncate">
                  ⚡ Mitocondria
                </div>
                <div className="text-[10px] text-zinc-400">Modo Concepto y Puntos</div>
              </button>

              <button
                onClick={() => {
                  onQuickGenerate('Dijkstra', 'concept');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-blue-300 truncate">
                  🗺️ Algoritmo Dijkstra
                </div>
                <div className="text-[10px] text-zinc-400">Modo Concepto Óptimo</div>
              </button>

              <button
                onClick={() => {
                  onQuickGenerate('Transformers', 'graphic');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">
                  🤖 Transformers
                </div>
                <div className="text-[10px] text-zinc-400">Diagrama Auto-Atención</div>
              </button>

              <button
                onClick={() => {
                  onQuickGenerate('ADN Compartido Plátano', 'curiosity');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 truncate">
                  🍌 Genoma del Plátano
                </div>
                <div className="text-[10px] text-zinc-400">Modo Dato Curioso</div>
              </button>

              <button
                onClick={() => {
                  onQuickGenerate('Mecánica Cuántica', 'graphic');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-purple-300 truncate">
                  ⚛️ Mecánica Cuántica
                </div>
                <div className="text-[10px] text-zinc-400">Postulados y Medición</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span>Último proveedor: <b className="text-zinc-200">{stats.lastProvider}</b></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
