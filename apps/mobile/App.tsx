import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Notebook, Section, Block, GenerationMode } from '@sirbook/shared';
import { MobileBlockList } from './src/components/MobileBlockList';
import { generateBlockContentMobile } from './src/services/api';

const SAMPLE_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-bio',
    user_id: 'user-demo',
    title: 'Bioquímica Celular',
    description: 'Metabolismo y fisiología',
    cover_color: '#4F46E5',
    icon: 'book',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'nb-ai',
    user_id: 'user-demo',
    title: 'Inteligencia Artificial',
    description: 'LLMs y Redes Neuronales',
    cover_color: '#7C3AED',
    icon: 'book',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SAMPLE_SECTIONS: Section[] = [
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
    title: 'Mitosis',
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_BLOCKS: Block[] = [
  {
    id: 'blk-mob-1',
    section_id: 'sec-krebs',
    notebook_id: 'nb-bio',
    user_id: 'user-demo',
    mode: 'concept',
    keyword: 'Ciclo de Krebs',
    context_path: 'Bioquímica Celular > Ciclo de Krebs',
    position: 0,
    content: {
      modo: 'concepto',
      titulo: 'Ciclo de Krebs (Ácido Cítrico)',
      contexto: 'Bioquímica Celular > Ciclo de Krebs',
      definicion_corta: 'Ruta metabólica aeróbica central que oxida acetil-CoA para producir ATP, NADH y FADH2 en la matriz mitocondrial.',
      puntos_clave: [
        'Condensación de oxalacetato con acetil-CoA.',
        'Genera 3 NADH, 1 FADH2 y 1 GTP/ATP.',
        'Ruta anfibólica de alta relevancia biológica.'
      ],
      aplicaciones: ['Bioenergética', 'Metabolismo celular'],
      fuentes: [
        {
          title: 'Nature Education - Citric Acid Cycle',
          url: 'https://www.nature.com'
        }
      ]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'blk-mob-2',
    section_id: 'sec-krebs',
    notebook_id: 'nb-bio',
    user_id: 'user-demo',
    mode: 'graphic',
    keyword: 'Fases de Krebs',
    context_path: 'Bioquímica Celular > Ciclo de Krebs',
    position: 1,
    content: {
      modo: 'grafico',
      tipo_grafico: 'mermaid_flowchart',
      titulo: 'Fases del Ciclo de Krebs',
      contexto: 'Bioquímica Celular > Ciclo de Krebs',
      codigo_render: `graph TD;\n  A["Oxalacetato"] --> B["Citrato"];\n  B --> C["Isocitrato"];\n  C --> D["Alfa-Cetoglutarato"];\n  D --> E["Succinil-CoA"];\n  E --> A;`,
      descripcion_corta: 'Circuito metabólico continuo con soporte de Pan & Zoom.',
      fuentes: []
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export default function App() {
  const [notebooks] = useState<Notebook[]>(SAMPLE_NOTEBOOKS);
  const [activeNotebook, setActiveNotebook] = useState<Notebook>(SAMPLE_NOTEBOOKS[0]);
  const [sections] = useState<Section[]>(SAMPLE_SECTIONS);
  const [activeSection, setActiveSection] = useState<Section>(SAMPLE_SECTIONS[0]);
  const [blocks, setBlocks] = useState<Block[]>(INITIAL_BLOCKS);

  const [keyword, setKeyword] = useState('');
  const [selectedMode, setSelectedMode] = useState<GenerationMode>('concept');
  const [studyMode, setStudyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!keyword.trim() || isLoading) return;

    if (selectedMode === 'free') {
      const freeBlock: Block = {
        id: `blk-${Date.now()}`,
        section_id: activeSection.id,
        notebook_id: activeNotebook.id,
        user_id: 'user-demo',
        mode: 'free',
        keyword,
        context_path: `${activeNotebook.title} > ${activeSection.title}`,
        position: 0,
        content: {
          modo: 'libre',
          titulo: keyword,
          markdown: ''
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBlocks((prev) => [freeBlock, ...prev]);
      setKeyword('');
      return;
    }

    setIsLoading(true);
    try {
      const res = await generateBlockContentMobile({
        keyword: keyword.trim(),
        mode: selectedMode,
        notebookTitle: activeNotebook.title,
        sectionTitle: activeSection.title,
        forceRefresh: false,
      });

      if (res.success && res.content) {
        const newBlock: Block = {
          id: `blk-${Date.now()}`,
          section_id: activeSection.id,
          notebook_id: activeNotebook.id,
          user_id: 'user-demo',
          mode: selectedMode,
          keyword,
          context_path: `${activeNotebook.title} > ${activeSection.title}`,
          position: 0,
          content: res.content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setBlocks((prev) => [newBlock, ...prev]);
        setKeyword('');
      }
    } catch (err: unknown) {
      console.warn('[Mobile] Error al generar bloque:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0C0D0E" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.coverBadge, { backgroundColor: activeNotebook.cover_color }]} />
          <View>
            <Text style={styles.appTitle}>Sirbook Móvil</Text>
            <Text style={styles.notebookSubtitle} numberOfLines={1}>
              {activeNotebook.title} • {activeSection.title}
            </Text>
          </View>
        </View>

        {/* Toggle Modo Estudio */}
        <TouchableOpacity
          style={[styles.studyToggle, studyMode ? styles.studyToggleActive : null]}
          onPress={() => setStudyMode((prev) => !prev)}
        >
          <Text style={[styles.studyToggleText, studyMode ? styles.studyToggleTextActive : null]}>
            🎓 {studyMode ? 'Estudio ON' : 'Estudio'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notebooks Selector Pills */}
      <View style={styles.selectorBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {notebooks.map((nb) => (
            <TouchableOpacity
              key={nb.id}
              style={[
                styles.pill,
                nb.id === activeNotebook.id ? styles.pillActive : null,
              ]}
              onPress={() => setActiveNotebook(nb)}
            >
              <View style={[styles.pillDot, { backgroundColor: nb.cover_color }]} />
              <Text style={[styles.pillText, nb.id === activeNotebook.id ? styles.pillTextActive : null]}>
                {nb.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sections Selector Pills */}
      <View style={styles.sectionBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {sections.map((sec) => (
            <TouchableOpacity
              key={sec.id}
              style={[
                styles.secPill,
                sec.id === activeSection.id ? styles.secPillActive : null,
              ]}
              onPress={() => setActiveSection(sec)}
            >
              <Text style={[styles.secPillText, sec.id === activeSection.id ? styles.secPillTextActive : null]}>
                # {sec.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Input Bar */}
        <View style={styles.inputCard}>
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Escribe palabra clave (ej. Glucólisis)..."
            placeholderTextColor="#71717A"
            style={styles.textInput}
          />

          {/* Mode Selector Buttons */}
          <View style={styles.modeRow}>
            {(['concept', 'graphic', 'curiosity', 'free'] as GenerationMode[]).map((m) => {
              const labels: Record<GenerationMode, string> = {
                concept: 'Concepto',
                graphic: 'Gráfico',
                curiosity: 'Dato',
                free: 'Libre',
              };
              const isSel = selectedMode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeButton, isSel ? styles.modeButtonSelected : null]}
                  onPress={() => setSelectedMode(m)}
                >
                  <Text style={[styles.modeButtonText, isSel ? styles.modeButtonTextSelected : null]}>
                    {labels[m]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.generateButton, !keyword.trim() || isLoading ? styles.generateButtonDisabled : null]}
            onPress={handleGenerate}
            disabled={!keyword.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.generateButtonText}>⚡ Sintetizar en Cuaderno</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Blocks List */}
        <MobileBlockList
          blocks={blocks}
          studyMode={studyMode}
          onDeleteBlock={(id) => setBlocks((prev) => prev.filter((b) => b.id !== id))}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0C0D0E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  coverBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notebookSubtitle: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  studyToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1C1E22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  studyToggleActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#EAB308',
  },
  studyToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  studyToggleTextActive: {
    color: '#FDE047',
  },
  selectorBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionBar: {
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1C1E22',
  },
  pillActive: {
    backgroundColor: '#312E81',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  secPillActive: {
    backgroundColor: '#27272A',
  },
  secPillText: {
    fontSize: 11,
    color: '#71717A',
  },
  secPillTextActive: {
    color: '#E4E4E7',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  inputCard: {
    backgroundColor: '#16181B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: '#0C0D0E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0C0D0E',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modeButtonSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  modeButtonText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '500',
  },
  modeButtonTextSelected: {
    color: '#A5B4FC',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
