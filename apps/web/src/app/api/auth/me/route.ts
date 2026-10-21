import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-jwt';

export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json(
        { error: 'No autenticado o token expirado' },
        { status: 401 }
      );
    }

    const result = await query(
      `SELECT id, email, full_name as "fullName", avatar_url as "avatarUrl", created_at as "createdAt"
       FROM users
       WHERE id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error en /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Error interno al validar sesión' },
      { status: 500 }
    );
  }
}
