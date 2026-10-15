'use client';

import React, { useState, useEffect } from 'react';
import { Notebook, Section, Block, GenerationMode, BlockContent } from '@sirbook/shared';
import { Sidebar } from '@/components/Sidebar';
import { SectionTabs } from '@/components/SectionTabs';
import { SmartInputBar } from '@/components/SmartInputBar';
import { StudyModeToggle } from '@/components/StudyModeToggle';
import { BlockList } from '@/components/BlockList';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';

const INITIAL_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-bio',
    user_id: 'user-demo',
    title: 'Bioquímica Celular',
    description: 'Rutas metabólicas y ciclo celular',
    cover_color: '#4F46E5',
    icon: 'book',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'nb-ai',
    user_id: 'user-demo',
    title: 'Inteligencia Artificial',
    description: 'Arquitecturas LLM y algoritmos de optimización',
    cover_color: '#7C3AED',
    icon: 'book',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const INITIAL_SECTIONS: Section[] = [
  {
    id: 'sec-krebs',
    notebook_id: 'nb-bio',
    user_id: 'user-demo',
    title: 'Ciclo de Krebs',
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-mitosis',
    notebook_id: 'nb-bio',
    user_id: 'user-demo',
    title: 'Mitosis y Meiosis',
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-transformers',
    notebook_id: 'nb-ai',
    user_id: 'user-demo',
    title: 'Mecanismo de Atención',
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const INITIAL_BLOCKS: Block[] = [
  {
    id: 'blk-1',
    section_id: 'sec-krebs',
    notebook_id: 'nb-bio',
    user_id: 'user-demo',
    mode: 'concept',
    keyword: 'Ciclo de Krebs',
    context_path: 'Bioquímica Celular > Ciclo de Krebs',
    position: 0,
    content: {
      modo: 'concepto',
      titulo: 'Ciclo del Ácido Cítrico (Krebs)',
      contexto: 'Bioquímica Celular > Ciclo de Krebs',
      definicion_corta: 'Ruta metabólica aeróbica central que oxida acetil-CoA para producir ATP, NADH y FADH2 en la matriz mitocondrial.',
      puntos_clave: [
        'Condensación de oxalacetato con acetil-CoA para formar citrato.',
        'Genera 3 NADH, 1 FADH2 y 1 GTP/ATP por vuelta.',
        'Es una ruta anfibólica (catabólica y anabólica).'
      ],
      aplicaciones: ['Generación de energía celular', 'Precursores de aminoácidos'],
      fuentes: [
        {
          title: 'Nature Education - Krebs Cycle',
          url: 'https://www.nature.com/scitable/topicpage/the-citric-acid-cycle-mitochondria-and-14197880/'
        }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'blk-2',
    section_id: 'sec-krebs',
    notebook_id: 'nb-bio',
    user_id: 'user-demo',
    mode: 'graphic',
    keyword: 'Ruta de Krebs',
    context_path: 'Bioquímica Celular > Ciclo de Krebs',
    position: 1,
    content: {
      modo: 'grafico',
      tipo_grafico: 'mermaid_flowchart',
      titulo: 'Fases Centrales del Ciclo de Krebs',
      contexto: 'Bioquímica Celular > Ciclo de Krebs',
      codigo_render: `graph TD;
  A["Oxalacetato + Acetil-CoA"] --> B["Citrato"];
  B --> C["Isocitrato"];
  C --> D["Alfa-Cetoglutarato (NADH)"];
  D --> E["Succinil-CoA (NADH)"];
  E --> F["Succinato (GTP)"];
  F --> G["Fumarato (FADH2)"];
  G --> H["Malato"];
  H --> A;`,
      descripcion_corta: 'Circuito continuo de reacciones enzimáticas en la matriz mitocondrial.',
      fuentes: [
        {
          title: 'Khan Academy - Ciclo de Krebs',
          url: 'https://es.khanacademy.org/science/biology/cellular-respiration-and-fermentation/pyruvate-oxidation-and-the-citric-acid-cycle/a/the-citric-acid-cycle'
        }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'blk-3',
    section_id: 'sec-krebs',
    notebook_id: 'nb-bio',
    user_id: 'user-demo',
    mode: 'curiosity',
    keyword: 'Hans Krebs Nobel',
    context_path: 'Bioquímica Celular > Ciclo de Krebs',
    position: 2,
    content: {
      modo: 'dato',
      titular: 'El rechazo inicial del Premio Nobel',
      contexto: 'Bioquímica Celular > Ciclo de Krebs',
      cifra_destacada: 'Premio Nobel 1953',
      explicacion: 'En 1937, la prestigiosa revista Nature rechazó el manuscrito original de Hans Krebs por falta de espacio. 16 años más tarde recibió el Premio Nobel de Medicina por ese mismo descubrimiento.',
      fuente_verificada: {
        title: 'Nobel Prize Official Biography',
        url: 'https://www.nobelprize.org/prizes/medicine/1953/krebs/biographical/'
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export default function HomePage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(INITIAL_NOTEBOOKS);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>('nb-bio');
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState<string | null>('sec-krebs');
  const [blocks, setBlocks] = useState<Block[]>(INITIAL_BLOCKS);

  const [studyMode, setStudyMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Carga inicial de LocalStorage (si existe)
  useEffect(() => {
    const savedNb = localStorage.getItem('sirbook_notebooks');
    const savedSec = localStorage.getItem('sirbook_sections');
    const savedBlk = localStorage.getItem('sirbook_blocks');

    if (savedNb) setNotebooks(JSON.parse(savedNb));
    if (savedSec) setSections(JSON.parse(savedSec));
    if (savedBlk) setBlocks(JSON.parse(savedBlk));
  }, []);

  // Guardado automático en LocalStorage
  useEffect(() => {
    localStorage.setItem('sirbook_notebooks', JSON.stringify(notebooks));
  }, [notebooks]);

  useEffect(() => {
    localStorage.setItem('sirbook_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    localStorage.setItem('sirbook_blocks', JSON.stringify(blocks));
  }, [blocks]);

  // Selección actual
  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId) || notebooks[0] || null;
  const currentSections = sections.filter((s) => s.notebook_id === activeNotebook?.id);
  const activeSection = currentSections.find((s) => s.id === activeSectionId) || currentSections[0] || null;
  const currentBlocks = blocks.filter((b) => b.section_id === activeSection?.id);

  const activeContextPath = [activeNotebook?.title, activeSection?.title].filter(Boolean).join(' > ');

  // Crear Cuaderno
  const handleCreateNotebook = (title: string, color: string, icon: string) => {
    const newNb: Notebook = {
      id: `nb-${Date.now()}`,
      user_id: 'user-demo',
      title,
      description: null,
      cover_color: color,
      icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const defaultSec: Section = {
      id: `sec-${Date.now()}`,
      notebook_id: newNb.id,
      user_id: 'user-demo',
      title: 'General',
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setNotebooks((prev) => [...prev, newNb]);
    setSections((prev) => [...prev, defaultSec]);
    setActiveNotebookId(newNb.id);
    setActiveSectionId(defaultSec.id);
  };

  // Crear Sección
  const handleCreateSection = (title: string) => {
    if (!activeNotebook) return;
    const newSec: Section = {
      id: `sec-${Date.now()}`,
      notebook_id: activeNotebook.id,
      user_id: 'user-demo',
      title,
      position: currentSections.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSections((prev) => [...prev, newSec]);
    setActiveSectionId(newSec.id);
  };

  // Generar Bloque con IA o Modo Libre
  const handleGenerate = async (keyword: string, mode: GenerationMode, forceRefresh: boolean) => {
    if (!activeNotebook || !activeSection) return;

    if (mode === 'free') {
      const freeBlock: Block = {
        id: `blk-${Date.now()}`,
        section_id: activeSection.id,
        notebook_id: activeNotebook.id,
        user_id: 'user-demo',
        mode: 'free',
        keyword,
        context_path: activeContextPath,
        position: currentBlocks.length,
        content: {
          modo: 'libre',
          titulo: keyword,
          markdown: ''
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBlocks((prev) => [freeBlock, ...prev]);
      return;
    }

    setIsLoading(true);
    setNotification({ message: `Sintetizando "${keyword}" en modo ${mode}...`, type: 'info' });

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          mode,
          notebookTitle: activeNotebook.title,
          sectionTitle: activeSection.title,
          forceRefresh
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al generar contenido');
      }

      const newBlock: Block = {
        id: `blk-${Date.now()}`,
        section_id: activeSection.id,
        notebook_id: activeNotebook.id,
        user_id: 'user-demo',
        mode,
        keyword,
        context_path: activeContextPath,
        position: 0,
        content: data.content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setBlocks((prev) => [newBlock, ...prev]);
      setNotification({
        message: data.cached
          ? `✓ Entregado desde Caché Global (<100ms a costo $0)`
          : `✓ Generado con IA y ${data.sourcesCount} fuentes verificadas`,
        type: 'success'
      });

      setTimeout(() => setNotification(null), 3500);
    } catch (err: unknown) {
      setNotification({ message: (err as Error).message, type: 'error' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateBlockContent = (id: string, newContent: BlockContent) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: newContent, updated_at: new Date().toISOString() } : b))
    );
  };

  return (
    <div className="flex h-screen bg-[#0C0D0E] overflow-hidden notebook-grid">
      {/* Sidebar de Cuadernos */}
      <Sidebar
        notebooks={notebooks}
        activeNotebookId={activeNotebook?.id || null}
        onSelectNotebook={(id) => {
          setActiveNotebookId(id);
          const firstSec = sections.find((s) => s.notebook_id === id);
          if (firstSec) setActiveSectionId(firstSec.id);
        }}
        onCreateNotebook={handleCreateNotebook}
      />

      {/* Área Principal de Trabajo */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="px-8 py-4 border-b border-white/5 glass-panel flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full shadow-md"
              style={{ backgroundColor: activeNotebook?.cover_color || '#4F46E5' }}
            />
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{activeNotebook?.title || 'Selecciona un cuaderno'}</span>
                {activeSection && (
                  <span className="text-zinc-500 font-normal">/ {activeSection.title}</span>
                )}
              </h1>
              <p className="text-xs text-zinc-400">
                {activeNotebook?.description || 'Cuaderno estructurado con síntesis multimodal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StudyModeToggle
              studyMode={studyMode}
              onToggle={() => setStudyMode((prev) => !prev)}
            />
          </div>
        </header>

        {/* Section Tabs */}
        {activeNotebook && (
          <SectionTabs
            sections={currentSections}
            activeSectionId={activeSection?.id || null}
            onSelectSection={(id) => setActiveSectionId(id)}
            onCreateSection={handleCreateSection}
          />
        )}

        {/* Notificaciones flotantes */}
        {notification && (
          <div className="fixed top-16 right-8 z-50 animate-fade-in">
            <div
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border ${
                notification.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
                  : notification.type === 'error'
                  ? 'bg-red-950/90 text-red-300 border-red-500/30'
                  : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/30'
              }`}
            >
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
              )}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Scrollable Notebook Content */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {activeNotebook && activeSection ? (
            <>
              {/* Barra Inteligente de Entrada */}
              <SmartInputBar
                onGenerate={handleGenerate}
                isLoading={isLoading}
                activeContextPath={activeContextPath}
              />

              {/* Lista de Bloques */}
              <BlockList
                blocks={currentBlocks}
                studyMode={studyMode}
                onDeleteBlock={handleDeleteBlock}
                onUpdateBlockContent={handleUpdateBlockContent}
              />
            </>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h2 className="text-base font-semibold text-zinc-300">Ningún cuaderno seleccionado</h2>
              <p className="text-xs text-zinc-500 mt-1">Selecciona o crea un cuaderno en la barra lateral.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
