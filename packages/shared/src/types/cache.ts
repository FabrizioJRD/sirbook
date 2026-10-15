import { AIMode } from './mode.js';
import { BlockContent } from './block.js';

export interface AiGlobalCacheEntry {
  cache_key: string;
  mode: AIMode;
  keyword: string;
  context_path: string | null;
  response_json: BlockContent;
  created_at: string;
  expires_at: string;
}
