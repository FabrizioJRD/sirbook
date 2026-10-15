import { NextRequest, NextResponse } from 'next/server';
import { GenerateBlockRequestSchema } from '@sirbook/shared';
import { executeGenerationPipeline } from '@/lib/engine';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = GenerateBlockRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetros inválidos',
          details: parsed.error.format()
        },
        { status: 400 }
      );
    }

    const result = await executeGenerationPipeline(parsed.data);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: unknown) {
    console.error('[API /api/generate] Error fatal:', err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Error interno al generar contenido'
      },
      { status: 500 }
    );
  }
}
