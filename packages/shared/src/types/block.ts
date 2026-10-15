import { GenerationMode } from './mode.js';

export interface SourceLink {
  title: string;
  url: string;
  snippet?: string;
}

export interface ConceptBlockContent {
  modo: 'concepto';
  titulo: string;
  contexto?: string;
  definicion_corta: string;
  puntos_clave: string[];
  aplicaciones: string[];
  fuentes: SourceLink[];
}

export interface GraphicBlockContent {
  modo: 'grafico';
  tipo_grafico: 'mermaid_flowchart' | 'mermaid_mindmap' | 'mermaid_sequence' | 'mermaid_timeline' | 'chart_stats';
  titulo: string;
  contexto?: string;
  codigo_render: string;
  descripcion_corta: string;
  fuentes: SourceLink[];
}

export interface CuriosityBlockContent {
  modo: 'dato';
  titular: string;
  contexto?: string;
  cifra_destacada?: string;
  explicacion: string;
  fuente_verificada: SourceLink;
}

export interface FreeBlockContent {
  modo: 'libre';
  titulo?: string;
  markdown: string;
}

export type BlockContent =
  | ConceptBlockContent
  | GraphicBlockContent
  | CuriosityBlockContent
  | FreeBlockContent;

export interface Block {
  id: string;
  section_id: string;
  notebook_id: string;
  user_id: string;
  mode: GenerationMode;
  keyword: string | null;
  context_path: string | null;
  content: BlockContent;
  position: number;
  created_at: string;
  updated_at: string;
}

export type CreateBlockInput = Omit<Block, 'id' | 'created_at' | 'updated_at'>;
export type UpdateBlockInput = Partial<Omit<Block, 'id' | 'section_id' | 'notebook_id' | 'user_id' | 'created_at' | 'updated_at'>>;
