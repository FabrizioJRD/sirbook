import { z } from 'zod';

export const SourceLinkSchema = z.object({
  title: z.string().min(1, 'El título de la fuente es requerido'),
  url: z.string().url('La URL de la fuente debe ser válida'),
  snippet: z.string().optional()
});

export type SourceLinkSchemaType = z.infer<typeof SourceLinkSchema>;
