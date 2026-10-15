import { ISearchProvider, SearchQueryOptions, SearchResultItem } from '../../types/search.js';

export interface SerperConfig {
  apiKey?: string;
}

export class SerperSearchProvider implements ISearchProvider {
  readonly name = 'serper';
  private apiKey: string;

  constructor(config: SerperConfig = {}) {
    this.apiKey = config.apiKey || process.env.SERPER_API_KEY || '';
  }

  async search(options: SearchQueryOptions): Promise<SearchResultItem[]> {
    if (!this.apiKey) {
      console.warn('[SerperSearchProvider] SERPER_API_KEY no configurada');
      return [];
    }

    const limit = options.limit || 5;

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: options.query,
          gl: 'es',
          hl: 'es',
          num: limit
        })
      });

      if (!response.ok) {
        throw new Error(`Serper error: HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as {
        organic?: Array<{
          title?: string;
          link?: string;
          snippet?: string;
        }>;
      };

      const results = (data.organic || []).slice(0, limit).map(item => ({
        title: item.title || 'Sin título',
        url: item.link || '',
        snippet: item.snippet || ''
      }));

      return results;
    } catch (err: unknown) {
      console.warn(`[SerperSearchProvider] Falló la búsqueda: ${(err as Error).message}`);
      return [];
    }
  }
}
