import { AIMode } from '../types/mode.js';
import { SearchResultItem } from '../types/search.js';

export interface PromptContext {
  keyword: string;
  mode: AIMode;
  notebookTitle?: string;
  sectionTitle?: string;
  searchResults?: SearchResultItem[];
}

export function buildSystemPrompt(context: PromptContext): string {
  const contextHierarchy = [context.notebookTitle, context.sectionTitle]
    .filter(Boolean)
    .join(' > ');

  const contextInstruction = contextHierarchy
    ? `\nIMPORTANTE (Herencia de Contexto): Interpreta el término '${context.keyword}' estrictamente dentro del marco temático de: [${contextHierarchy}]. Evita cualquier ambigüedad o polisemia que no corresponda a este contexto.`
    : '';

  let modeSpecificInstruction = '';

  switch (context.mode) {
    case 'concept':
      modeSpecificInstruction = `
Genera una síntesis conceptual estructurada en formato JSON estricto con los siguientes campos:
- modo: "concepto"
- titulo: Nombre claro del concepto o tema
- contexto: Jerarquía temática (ej. "${contextHierarchy || 'General'}")
- definicion_corta: Una definición ejecutiva de 2 a 4 oraciones precisas.
- puntos_clave: Array de 3 a 5 puntos clave indispensables.
- aplicaciones: Array de 2 a 4 aplicaciones prácticas o ejemplos en el mundo real.
- fuentes: Array de objetos { title, url, snippet } tomados de los resultados de búsqueda web provistos.
`;
      break;

    case 'graphic':
      modeSpecificInstruction = `
Genera un diagrama visual utilizando sintaxis MERMAID.JS válida en formato JSON estricto con los siguientes campos:
- modo: "grafico"
- tipo_grafico: Uno de ["mermaid_flowchart", "mermaid_mindmap", "mermaid_sequence", "mermaid_timeline"]
- titulo: Título del diagrama
- contexto: Jerarquía temática (ej. "${contextHierarchy || 'General'}")
- codigo_render: Código Mermaid.js listo para compilar. REGLAS MERMAID:
  * Si usas texto en nodos con caracteres como ()[]{} o comillas, SIEMPRE usa comillas dobles ej: A["Texto (ejemplo)"] --> B["Otro nodo"]
  * NO uses bloques de markdown con tres comillas en este campo.
- descripcion_corta: Explicación breve de 1 a 2 oraciones de lo que representa el diagrama.
- fuentes: Array de objetos { title, url, snippet } tomados de los resultados web.
`;
      break;

    case 'curiosity':
      modeSpecificInstruction = `
Genera una cápsula de impacto o dato curioso verificado en formato JSON estricto con los siguientes campos:
- modo: "dato"
- titular: Título o gancho de alto impacto (máx 10 palabras).
- contexto: Jerarquía temática (ej. "${contextHierarchy || 'General'}")
- cifra_destacada: Si aplica, una métrica destacada (ej. "60% de similitud", "3,800 millones de años").
- explicacion: Explicación fascinante y verificada del dato (2 a 3 oraciones).
- fuente_verificada: Objeto { title, url, snippet } con la fuente web que corrobora el dato.
`;
      break;
  }

  return `Eres el motor de conocimiento especializado de Sirbook.
Tu objetivo es sintetizar información veraz, estructurada y educativa a partir de palabras clave y fuentes web en tiempo real.
${contextInstruction}
${modeSpecificInstruction}
REGLAS CRÍTICAS:
1. Responde ÚNICAMENTE con el objeto JSON válido, sin texto introductorio ni explicaciones fuera del JSON.
2. Si se suministran resultados de búsqueda web, UTILIZA ÚNICAMENTE esas URLs y datos verificados. No inventes URLs ficticias.
3. El idioma de salida debe ser español neutral y claro.
`;
}

export function buildUserPrompt(context: PromptContext): string {
  let searchSection = 'No se requirieron búsquedas web externas. Utiliza conocimiento académico verificado.';

  if (context.searchResults && context.searchResults.length > 0) {
    searchSection = 'RESULTADOS DE BÚSQUEDA WEB REALES EN TIEMPO REAL:\n' +
      context.searchResults
        .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nFragmento: ${r.snippet}`)
        .join('\n\n');
  }

  return `Palabra clave / Tema solicitado: "${context.keyword}"
Modo solicitado: ${context.mode}
Contexto: ${[context.notebookTitle, context.sectionTitle].filter(Boolean).join(' > ') || 'General'}

${searchSection}

Genera el JSON estructurado correspondiente.`;
}
