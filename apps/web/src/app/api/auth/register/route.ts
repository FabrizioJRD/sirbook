import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth-jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre completo son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verificar si el usuario ya existe
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este correo electrónico' },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name as "fullName", created_at as "createdAt"`,
      [normalizedEmail, passwordHash, fullName.trim()]
    );

    const newUser = result.rows[0];

    // Generar token JWT de 30 días
    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
    });

    const response = NextResponse.json({
      success: true,
      user: newUser,
      token,
    });

    // Guardar en cookie segura y duradera (30 días)
    response.cookies.set('sirbook_auth_token', token, {
      httpOnly: false, // Accesible por cliente para sincronizar
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 días
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error en /api/auth/register:', error);
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
      { error: 'Error interno del servidor al procesar el registro' },
      { status: 500 }
    );
  }
}
