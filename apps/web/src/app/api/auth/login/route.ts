import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth-jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Buscar usuario por email
    const result = await query(
      `SELECT id, email, password_hash as "passwordHash", full_name as "fullName", avatar_url as "avatarUrl", created_at as "createdAt"
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Correo o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Comparar contraseña con bcrypt
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Correo o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    // Generar token JWT de 30 días
    const token = signToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    });

    const safeUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      token,
    });

    // Guardar en cookie segura y duradera (30 días)
    response.cookies.set('sirbook_auth_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error en /api/auth/login:', error);
    const isConnRefused =
      error?.code === 'ECONNREFUSED' ||
      error?.message?.includes('ECONNREFUSED') ||
      (error?.errors && error.errors.some((e: any) => e.code === 'ECONNREFUSED'));

    if (isConnRefused) {
      return NextResponse.json(
        {
          error:
            'No se pudo conectar a la base de datos PostgreSQL (puerto 5432). Inicia el contenedor con: sudo docker compose up -d postgres',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al iniciar sesión' },
      { status: 500 }
    );
  }
}
