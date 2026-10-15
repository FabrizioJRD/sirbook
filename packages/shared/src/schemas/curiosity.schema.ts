import { z } from 'zod';
import { SourceLinkSchema } from './source-link.schema.js';

export const CuriosityBlockContentSchema = z.object({
  modo: z.literal('dato'),
  titular: z.string().min(5, 'El titular debe tener al menos 5 caracteres'),
  contexto: z.string().optional(),
  cifra_destacada: z.string().optional(),
  explicacion: z.string().min(15, 'La explicación del dato debe tener al menos 15 caracteres'),
  fuente_verificada: SourceLinkSchema
});

export type CuriosityBlockContentSchemaType = z.infer<typeof CuriosityBlockContentSchema>;
