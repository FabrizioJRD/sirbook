import { z } from 'zod';

export const GenerateBlockRequestSchema = z.object({
  keyword: z.string().min(1, 'La palabra clave o tema es requerido').max(120),
  mode: z.enum(['concept', 'graphic', 'curiosity']),
  notebookTitle: z.string().optional(),
  sectionTitle: z.string().optional(),
  forceRefresh: z.boolean().default(false)
});

export type GenerateBlockRequest = z.infer<typeof GenerateBlockRequestSchema>;
