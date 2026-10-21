import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'sirbook_super_secret_jwt_key_2026_dev_secure';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
}

/**
 * Genera un token JWT firmado válido por 30 días para sesión persistente.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
  });
}

/**
 * Valida y decodifica un token JWT. Retorna null si es inválido o expiró.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extrae y valida el usuario desde el header Authorization o Cookie de la petición.
 */
export function getUserFromRequest(request: Request): TokenPayload | null {
  // 1. Intentar desde Header Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifyToken(token);
    if (verified) return verified;
  }

  // 2. Intentar desde Cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/sirbook_auth_token=([^;]+)/);
  if (match && match[1]) {
    const verified = verifyToken(match[1].trim());
    if (verified) return verified;
  }

  return null;
}
