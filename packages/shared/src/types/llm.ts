import { AIMode } from './mode.js';
import { BlockContent } from './block.js';
import { SearchResultItem } from './search.js';

export interface LLMGenerateOptions {
  mode: AIMode;
  keyword: string;
  notebookTitle?: string;
  sectionTitle?: string;
  searchResults?: SearchResultItem[];
}

export interface ILLMProvider {
  readonly name: string;
  generateBlockContent(options: LLMGenerateOptions): Promise<BlockContent>;
}
