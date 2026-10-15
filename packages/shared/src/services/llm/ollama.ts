import { ILLMProvider, LLMGenerateOptions } from '../../types/llm.js';
import { BlockContent } from '../../types/block.js';
import { buildSystemPrompt, buildUserPrompt } from '../../prompts/context-prompts.js';
import { ConceptBlockContentSchema } from '../../schemas/concept.schema.js';
import { GraphicBlockContentSchema } from '../../schemas/graphic.schema.js';
import { CuriosityBlockContentSchema } from '../../schemas/curiosity.schema.js';
import { sanitizeMermaidCode } from '../../utils/mermaid-sanitizer.js';

export interface OllamaConfig {
  baseUrl?: string;
  model?: string;
}

export class OllamaLLMProvider implements ILLMProvider {
  readonly name = 'ollama';
  private baseUrl: string;
  private model: string;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = config.model || process.env.OLLAMA_MODEL || 'qwen2.5:latest';
  }

  async generateBlockContent(options: LLMGenerateOptions): Promise<BlockContent> {
    const systemPrompt = buildSystemPrompt({
      keyword: options.keyword,
      mode: options.mode,
      notebookTitle: options.notebookTitle,
      sectionTitle: options.sectionTitle,
      searchResults: options.searchResults
    });

    const userPrompt = buildUserPrompt({
      keyword: options.keyword,
      mode: options.mode,
      notebookTitle: options.notebookTitle,
      sectionTitle: options.sectionTitle,
      searchResults: options.searchResults
    });

    const endpoint = `${this.baseUrl}/api/generate`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        system: systemPrompt,
        prompt: userPrompt,
        format: 'json',
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error (HTTP ${response.status}): ${errorText}`);
    }

    const data = await response.json() as { response?: string };
    const rawJsonText = data.response;

    if (!rawJsonText) {
      throw new Error('[OllamaLLMProvider] Respuesta vacía de Ollama');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJsonText);
    } catch {
      throw new Error(`[OllamaLLMProvider] Falló parseo JSON: ${rawJsonText.slice(0, 150)}...`);
    }

    switch (options.mode) {
      case 'concept':
        return ConceptBlockContentSchema.parse(parsed);

      case 'graphic': {
        const validated = GraphicBlockContentSchema.parse(parsed);
        validated.codigo_render = sanitizeMermaidCode(validated.codigo_render);
        return validated;
      }

      case 'curiosity':
        return CuriosityBlockContentSchema.parse(parsed);

      default:
        throw new Error(`[OllamaLLMProvider] Modo no soportado: ${options.mode}`);
    }
  }
}
