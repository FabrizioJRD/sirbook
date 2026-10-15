export type GenerationMode = 'concept' | 'graphic' | 'curiosity' | 'free';

export type AIMode = Exclude<GenerationMode, 'free'>;

export interface ModeMeta {
  mode: GenerationMode;
  label: string;
  description: string;
  icon: string;
}

export const MODES_META: Record<GenerationMode, ModeMeta> = {
  concept: {
    mode: 'concept',
    label: 'Conceptos',
    description: 'Definición estructurada, puntos clave y aplicaciones prácticas',
    icon: 'book-open'
  },
  graphic: {
    mode: 'graphic',
    label: 'Gráficos',
    description: 'Diagramas de flujo, mapas mentales y visualizaciones Mermaid',
    icon: 'network'
  },
  curiosity: {
    mode: 'curiosity',
    label: 'Dato o Curiosidad',
    description: 'Píldora impactante, métricas y datos insólitos verificados',
    icon: 'sparkles'
  },
  free: {
    mode: 'free',
    label: 'Libre',
    description: 'Editor de texto manual sin sugerencias de IA',
    icon: 'pencil'
  }
};
