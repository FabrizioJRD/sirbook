import { GenerateBlockRequest, BlockContent, AutocompleteResponse } from '@sirbook/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface GenerateApiResponse {
  success: boolean;
  content: BlockContent;
  cached: boolean;
  cacheKey: string;
  sourcesCount: number;
  error?: string;
}

const MOBILE_OFFLINE_DICTIONARY: Record<string, string> = {
  mitocondria: ': orgánulo celular eucariota responsable de la respiración celular y de generar la mayor parte del ATP celular.',
  fotosintesis: ': proceso biológico mediante el cual las plantas transforman energía lumínica en energía química sintetizando glucosa.',
  'ciclo de krebs': ': ruta metabólica aeróbica central que oxida acetil-CoA en la matriz mitocondrial produciendo NADH, FADH2 y ATP.',
  polimorfismo: ': principio de POO que permite a diferentes clases responder de manera específica a un mismo mensaje o método.',
  recursion: ': técnica computacional donde una función se llama a sí misma para resolver subproblemas hasta un caso base.',
  dijkstra: ': algoritmo sobre grafos ponderados que encuentra la ruta más corta desde un vértice origen hacia todos los demás.',
  transformers: ': arquitectura neuronal basada en mecanismos de atención (self-attention) que procesa lenguaje natural en paralelo.',
  entropia: ': medida del grado de desorden o energía no utilizable dentro de un sistema termodinámico.',
  adn: ': molécula que contiene las instrucciones genéticas biológicas para el desarrollo y funcionamiento de los seres vivos.'
};

export async function fetchAutocompleteMobile(
  keyword: string,
  context?: string
): Promise<AutocompleteResponse> {
  const cleanKeyword = keyword.trim();
  const normalized = cleanKeyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  try {
    const url = `${API_BASE_URL}/api/autocomplete`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: cleanKeyword, context }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.completionText) {
        return {
          keyword: cleanKeyword,
          completionText: data.completionText,
          summary: data.summary,
          cached: data.cached,
        };
      }
    }
  } catch {
    // Si no hay conexión con el backend web, usar fallback offline local
  }

  if (MOBILE_OFFLINE_DICTIONARY[normalized]) {
    const text = MOBILE_OFFLINE_DICTIONARY[normalized];
    return {
      keyword: cleanKeyword,
      completionText: text,
      summary: text.replace(/^:\s*/, ''),
      cached: true,
    };
  }

  const defaultText = `: concepto clave ${context ? `en ${context}` : 'en su disciplina'}, caracterizado por sus principios teóricos y su aplicación fundamental.`;
  return {
    keyword: cleanKeyword,
    completionText: defaultText,
    summary: defaultText.replace(/^:\s*/, ''),
    cached: false,
  };
}

export async function generateBlockContentMobile(
  request: GenerateBlockRequest
): Promise<GenerateApiResponse> {
  const url = `${API_BASE_URL}/api/generate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `HTTP error ${response.status}`);
  }

  return response.json();
}
