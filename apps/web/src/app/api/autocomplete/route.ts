import { NextRequest, NextResponse } from 'next/server';
import { executeAutocompletePipeline } from '@/lib/engine';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { keyword, context, prefixText, apiKey } = json;

    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return NextResponse.json(
        { success: false, error: 'Palabra clave requerida' },
        { status: 400 }
      );
    }

    const result = await executeAutocompletePipeline(keyword, context, apiKey);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: unknown) {
    console.error('[API /api/autocomplete] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message || 'Error en autocompletado'
      },
      { status: 500 }
    );
  }
}
