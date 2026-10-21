export interface AutocompleteRequest {
  keyword: string;
  context?: string;
  prefixText?: string;
}

export interface AutocompleteResponse {
  keyword: string;
  completionText: string;
  summary?: string;
  cached?: boolean;
}
