import { ISearchProvider, SearchQueryOptions, SearchResultItem } from '../../types/search.js';

export interface SearxngConfig {
  baseUrl?: string;
}

export class SearxngSearchProvider implements ISearchProvider {
  readonly name = 'searxng';
  private baseUrl: string;

  constructor(config: SearxngConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.SEARXNG_BASE_URL || 'http://localhost:8080';
  }

  async search(options: SearchQueryOptions): Promise<SearchResultItem[]> {
    const limit = options.limit || 5;
    const url = new URL('/search', this.baseUrl);
    url.searchParams.set('q', options.query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('language', options.language || 'es');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SearXNG error: HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as {
        results?: Array<{
          title?: string;
          url?: string;
          content?: string;
        }>;
      };

      const results = (data.results || []).slice(0, limit).map(item => ({
        title: item.title || 'Sin título',
        url: item.url || '',
        snippet: item.content || ''
      }));

      return results;
    } catch (err: unknown) {
      console.warn(`[SearxngSearchProvider] Falló la búsqueda: ${(err as Error).message}`);
      return [];
    }
  }
}
