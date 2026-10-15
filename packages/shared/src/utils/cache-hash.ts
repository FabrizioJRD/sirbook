/**
 * Normaliza y genera una clave de caché determinista SHA-256 para ai_global_cache.
 * Compatible con Node.js, Next.js Edge y navegadores modernos (Web Crypto API).
 */

export function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos para maximizar reuso de caché
    .replace(/\s+/g, ' ');
}

export async function generateCacheKey(
  keyword: string,
  mode: string,
  contextPath?: string | null
): Promise<string> {
  const normKeyword = normalizeText(keyword);
  const normMode = normalizeText(mode);
  const normContext = normalizeText(contextPath);

  const rawString = `${normMode}:${normKeyword}:${normContext}`;

  // Uso de Web Crypto API nativo
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simple por si se ejecuta en entornos antiguos sin subtle crypto
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fallback_${Math.abs(hash).toString(16)}`;
}
