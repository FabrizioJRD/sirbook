import { z } from 'zod';
import { SourceLinkSchema } from './source-link.schema.js';

export const ConceptBlockContentSchema = z.object({
  modo: z.literal('concepto'),
  titulo: z.string().min(1, 'El título del concepto es obligatorio'),
  contexto: z.string().optional(),
  definicion_corta: z.string().min(10, 'La definición corta debe tener al menos 10 caracteres'),
  puntos_clave: z.array(z.string().min(3)).min(1, 'Debe incluir al menos un punto clave'),
  aplicaciones: z.array(z.string().min(3)).default([]),
  fuentes: z.array(SourceLinkSchema).default([])
});

export type ConceptBlockContentSchemaType = z.infer<typeof ConceptBlockContentSchema>;
