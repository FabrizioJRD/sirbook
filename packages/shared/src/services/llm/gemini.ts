import { ILLMProvider, LLMGenerateOptions } from '../../types/llm.js';
import { BlockContent } from '../../types/block.js';
import { buildSystemPrompt, buildUserPrompt } from '../../prompts/context-prompts.js';
import { ConceptBlockContentSchema } from '../../schemas/concept.schema.js';
import { GraphicBlockContentSchema } from '../../schemas/graphic.schema.js';
import { CuriosityBlockContentSchema } from '../../schemas/curiosity.schema.js';
import { sanitizeMermaidCode } from '../../utils/mermaid-sanitizer.js';

export interface GeminiConfig {
  apiKey?: string;
  model?: string;
}

export class GeminiLLMProvider implements ILLMProvider {
  readonly name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(config: GeminiConfig = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = config.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  async generateBlockContent(options: LLMGenerateOptions): Promise<BlockContent> {
    if (!this.apiKey) {
      throw new Error('[GeminiLLMProvider] GEMINI_API_KEY no configurada');
    }

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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error (HTTP ${response.status}): ${errorText}`);
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJsonText) {
      throw new Error('[GeminiLLMProvider] Respuesta vacía de Gemini');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJsonText);
    } catch {
      throw new Error(`[GeminiLLMProvider] No se pudo parsear JSON: ${rawJsonText.slice(0, 150)}...`);
    }

    // Validación según el modo
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
        throw new Error(`[GeminiLLMProvider] Modo no soportado: ${options.mode}`);
    }
  }
}
