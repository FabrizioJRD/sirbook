'use client';

import React, { useState } from 'react';
import { Notebook, Section, Block } from '@sirbook/shared';
import { Download, Copy, Check, X, FileText } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebook: Notebook;
  section?: Section;
  blocks: Block[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  notebook,
  section,
  blocks,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generar Markdown estructurado
  const markdownContent = `# ${notebook.title}
${notebook.description ? `*${notebook.description}*\n` : ''}
${section ? `## Sección: ${section.title}\n` : ''}
---

${blocks.map((b) => {
  switch (b.mode) {
    case 'concept': {
      const c = b.content as any;
      return `### 📚 Concepto: ${c.titulo}
> **Definición:** ${c.definicion_corta}

**Puntos Clave:**
${c.puntos_clave?.map((p: string) => `- ${p}`).join('\n') || ''}

${c.aplicaciones ? `**Aplicaciones:**\n${c.aplicaciones.map((a: string) => `- ${a}`).join('\n')}\n` : ''}
${c.fuentes ? `*Fuentes:* ${c.fuentes.map((f: any) => `[${f.title}](${f.url})`).join(', ')}\n` : ''}`;
    }
    case 'graphic': {
      const g = b.content as any;
      return `### 📊 Gráfico: ${g.titulo}
\`\`\`mermaid
${g.codigo_render}
\`\`\`
*${g.descripcion_corta}*\n`;
    }
    case 'curiosity': {
      const d = b.content as any;
      return `### 💡 Dato Curioso: ${d.titular}
${d.cifra_destacada ? `**[${d.cifra_destacada}]**\n` : ''}
${d.explicacion}
${d.fuente_verificada ? `*Fuente:* [${d.fuente_verificada.title}](${d.fuente_verificada.url})\n` : ''}`;
    }
    case 'free': {
      const f = b.content as any;
      return `### ✏️ ${f.titulo || 'Nota Libre'}
${f.markdown}\n`;
    }
    default:
      return '';
  }
}).join('\n\n---\n\n')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notebook.title.toLowerCase().replace(/\s+/g, '_')}_export.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121316] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exportar Cuaderno</h3>
              <p className="text-xs text-zinc-400">
                Formato Markdown estructurado compatible con Obsidian, Notion y Anki
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

        {/* Preview Area */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-zinc-300 bg-black/40 border-b border-white/5 whitespace-pre-wrap select-text">
          {markdownContent}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-xs text-zinc-500">{blocks.length} bloques exportados</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar Markdown'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar Archivo .md
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
