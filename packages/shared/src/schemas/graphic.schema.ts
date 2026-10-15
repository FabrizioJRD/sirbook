import { z } from 'zod';
import { SourceLinkSchema } from './source-link.schema.js';

export const GraphicBlockContentSchema = z.object({
  modo: z.literal('grafico'),
  tipo_grafico: z.enum([
    'mermaid_flowchart',
    'mermaid_mindmap',
    'mermaid_sequence',
    'mermaid_timeline',
    'chart_stats'
  ]),
  titulo: z.string().min(1, 'El título del gráfico es obligatorio'),
  contexto: z.string().optional(),
  codigo_render: z.string().min(5, 'El código renderizable es obligatorio'),
  descripcion_corta: z.string().min(5, 'La descripción explicativa es obligatoria'),
  fuentes: z.array(SourceLinkSchema).default([])
});

export type GraphicBlockContentSchemaType = z.infer<typeof GraphicBlockContentSchema>;
