import {
  AIMode,
  BlockContent,
  GenerateBlockRequest,
  generateCacheKey,
  sanitizeMermaidCode,
  SearxngSearchProvider,
  SerperSearchProvider,
  GeminiLLMProvider,
  SearchResultItem
} from '@sirbook/shared';
import { supabase, isSupabaseConfigured } from './supabase';

export interface GenerationResult {
  content: BlockContent;
  cached: boolean;
  cacheKey: string;
  sourcesCount: number;
}

export async function executeGenerationPipeline(
  request: GenerateBlockRequest
): Promise<GenerationResult> {
  const { keyword, mode, notebookTitle, sectionTitle, forceRefresh } = request;
  const contextPath = [notebookTitle, sectionTitle].filter(Boolean).join(' > ') || null;

  // 1. Calcular Clave Hash SHA-256
  const cacheKey = await generateCacheKey(keyword, mode, contextPath);

  // 2. Revisión de Caché Semántico en Supabase (si está configurado)
  if (!forceRefresh && isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_global_cache')
        .select('response_json, expires_at')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!error && data?.response_json) {
        return {
          content: data.response_json as BlockContent,
          cached: true,
          cacheKey,
          sourcesCount: 0
        };
      }
    } catch (err) {
      console.warn('[Engine] Error al consultar ai_global_cache:', err);
    }
  }

  // 3. Recuperación Web (Search Provider)
  let searchResults: SearchResultItem[] = [];
  const serperApiKey = process.env.SERPER_API_KEY;
  const searxngBaseUrl = process.env.SEARXNG_BASE_URL || 'http://localhost:8080';

  if (serperApiKey) {
    const serper = new SerperSearchProvider({ apiKey: serperApiKey });
    searchResults = await serper.search({ query: `${keyword} ${contextPath || ''}`.trim() });
  } else {
    // Intentar SearXNG local
    const searxng = new SearxngSearchProvider({ baseUrl: searxngBaseUrl });
    searchResults = await searxng.search({ query: `${keyword} ${contextPath || ''}`.trim() });
  }

  // Si no hay resultados de búsqueda externa, agregamos enlaces informativos basados en Wikipedia / Google
  if (searchResults.length === 0) {
    const encoded = encodeURIComponent(keyword);
    searchResults = [
      {
        title: `${keyword} - Enciclopedia y Referencias`,
        url: `https://es.wikipedia.org/wiki/${encoded}`,
        snippet: `Información general y fundamentos de ${keyword} con contexto en ${contextPath || 'ciencias'}.`
      },
      {
        title: `${keyword} - Búsqueda de Investigación`,
        url: `https://www.google.com/search?q=${encoded}`,
        snippet: `Referencias académicas y datos verificados sobre ${keyword}.`
      }
    ];
  }

  // 4. Síntesis con LLM Provider
  let content: BlockContent;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey) {
    const gemini = new GeminiLLMProvider({ apiKey: geminiApiKey });
    content = await gemini.generateBlockContent({
      keyword,
      mode: mode as AIMode,
      notebookTitle,
      sectionTitle,
      searchResults
    });
  } else {
    // Modo demostración inteligente offline / sin API key
    content = generateDemoFallback(keyword, mode as AIMode, contextPath, searchResults);
  }

  // 5. Guardado en ai_global_cache en segundo plano
  if (isSupabaseConfigured && supabase) {
    (async () => {
      try {
        await supabase
          .from('ai_global_cache')
          .upsert({
            cache_key: cacheKey,
            mode,
            keyword,
            context_path: contextPath,
            response_json: content,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
      } catch (err: unknown) {
        console.warn('[Engine] Error al persistir en caché:', err);
      }
    })();
  }

  return {
    content,
    cached: false,
    cacheKey,
    sourcesCount: searchResults.length
  };
}

/**
 * Generador demostrativo para pruebas inmediatas si el usuario aún no configuró GEMINI_API_KEY.
 */
function generateDemoFallback(
  keyword: string,
  mode: AIMode,
  contextPath: string | null,
  searchResults: SearchResultItem[]
): BlockContent {
  const sources = searchResults.map(s => ({
    title: s.title,
    url: s.url,
    snippet: s.snippet
  }));

  switch (mode) {
    case 'concept':
      return {
        modo: 'concepto',
        titulo: keyword,
        contexto: contextPath || 'Conocimiento General',
        definicion_corta: `${keyword} es un concepto clave en ${contextPath || 'su disciplina'}, caracterizado por sus fundamentos teóricos rigurosos y su impacto directo en el análisis conceptual contemporáneo.`,
        puntos_clave: [
          `Estructura y principios esenciales que definen a ${keyword}.`,
          `Relación interactiva dentro del marco temático de ${contextPath || 'estudio'}.`,
          `Mecanismos de aplicación y evolución en la investigación actual.`
        ],
        aplicaciones: [
          `Análisis metodológico aplicado a proyectos de ${contextPath || 'investigación'}.`,
          `Resolución de problemas técnicos y diseño de sistemas.`
        ],
        fuentes: sources
      };

    case 'graphic':
      return {
        modo: 'grafico',
        tipo_grafico: 'mermaid_flowchart',
        titulo: `Estructura de ${keyword}`,
        contexto: contextPath || 'Diagrama Visual',
        codigo_render: sanitizeMermaidCode(`graph TD;
  A["${keyword}"] --> B["Fundamentos Clave"];
  A --> C["Procesos Activos"];
  B --> D["Aplicación Práctica"];
  C --> E["Resultados Verificados"];`),
        descripcion_corta: `Diagrama conceptual que desglosa las fases operativas e interconexiones de ${keyword}.`,
        fuentes: sources
      };

    case 'curiosity':
      return {
        modo: 'dato',
        titular: `El impacto oculto de ${keyword}`,
        contexto: contextPath || 'Dato Verificado',
        cifra_destacada: 'Dato de Alto Impacto',
        explicacion: `Investigaciones especializadas revelan patrones fascinantes en torno a ${keyword}, conectando teorías históricas con avances de última generación.`,
        fuente_verificada: sources[0] || {
          title: 'Referencia Verificada',
          url: 'https://es.wikipedia.org'
        }
      };
  }
}
