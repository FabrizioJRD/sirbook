/**
 * Sanea y valida código Mermaid generado por LLMs para prevenir fallos de compilación.
 */
export function sanitizeMermaidCode(rawCode: string): string {
  if (!rawCode || typeof rawCode !== 'string') {
    return 'graph TD;\n  A["Sin datos"] --> B["Error"];';
  }

  let code = rawCode.trim();

  // 1. Eliminar bloques de código markdown si vinieron incluidos (```mermaid ... ```)
  code = code.replace(/^```(?:mermaid)?\s*/i, '').replace(/```\s*$/, '').trim();

  // 2. Limpiar saltos de línea excesivos
  code = code.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  // 3. Proteger etiquetas de nodos con corchetes [Texto con (paréntesis) o comillas]
  // Si un nodo contiene caracteres especiales como (), [], {}, o comillas sin envolver en "", lo envolvemos en comillas dobles
  code = code.replace(/\[([^"\]]+)\]/g, (match, innerText) => {
    // Si contiene caracteres que rompen Mermaid y no tiene comillas ya
    if (/[\(\)\{\}\<\>\:\;\"']/.test(innerText)) {
      const escaped = innerText.replace(/"/g, "'").trim();
      return `["${escaped}"]`;
    }
    return match;
  });

  // 4. Si el código no empieza con una declaración válida de Mermaid, añadir un encabezado por defecto
  const validStarters = ['graph', 'flowchart', 'mindmap', 'sequencediagram', 'timeline', 'classdiagram', 'erdiagram', 'gantt'];
  const firstLine = code.split('\n')[0]?.trim().toLowerCase() || '';
  const startsValid = validStarters.some(starter => firstLine.startsWith(starter));

  if (!startsValid) {
    code = `graph TD;\n${code}`;
  }

  return code;
}
