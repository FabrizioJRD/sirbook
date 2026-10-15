export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchQueryOptions {
  query: string;
  limit?: number;
  language?: string;
}

export interface ISearchProvider {
  readonly name: string;
  search(options: SearchQueryOptions): Promise<SearchResultItem[]>;
}
