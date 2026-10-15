import { z } from 'zod';

export const FreeBlockContentSchema = z.object({
  modo: z.literal('libre'),
  titulo: z.string().optional(),
  markdown: z.string().default('')
});

export type FreeBlockContentSchemaType = z.infer<typeof FreeBlockContentSchema>;
