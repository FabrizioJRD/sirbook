import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-jwt';

function mapDbRowToLooseNote(row: any) {
  return {
    id: row.id,
    title: row.title,
    folderId: row.folder_id,
    subject: row.subject || '',
    isFavorite: Boolean(row.is_favorite),
    created_at: row.created_at,
    updated_at: row.updated_at,
    page: {
      id: row.id,
      pageNumber: row.page_number || 1,
      subjectTopic: row.subject || row.title || '',
      paperPattern: row.paper_pattern || 'grid',
      pageFormat: row.page_format || 'a4',
      stickers: row.stickers || [],
      tilingRoot: row.tiling_root || { id: 'root', type: 'leaf', blockId: 'default' },
      blocks: row.blocks || {},
      shapes: row.shapes || [],
      drawingStrokes: row.drawing_strokes || [],
      textElements: row.text_elements || [],
      shapeElements: row.shape_elements || [],
    },
  };
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const all = searchParams.get('all');

    let sql = `
      SELECT id, user_id, folder_id, title, subject, page_number,
             paper_pattern, page_format, stickers, tiling_root, blocks,
             shapes, drawing_strokes, text_elements, shape_elements,
             is_favorite, created_at, updated_at
      FROM notes
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [user.userId];

    if (folderId) {
      sql += ` AND folder_id = $2`;
      params.push(folderId);
    } else if (all !== 'true') {
      // Por defecto notas sueltas (folder_id es NULL)
      sql += ` AND folder_id IS NULL`;
    }

    sql += ` ORDER BY updated_at DESC`;

    const res = await query(sql, params);
    const notes = res.rows.map(mapDbRowToLooseNote);

    return NextResponse.json({ success: true, notes });
  } catch (error: any) {
    console.error('Error en GET /api/notes:', error);
    return NextResponse.json(
      { error: 'Error al obtener notas de la base de datos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      folderId = null,
      subject = '',
      isFavorite = false,
      page,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    const pageData = page || {};

    const res = await query(
      `INSERT INTO notes (
         user_id, folder_id, title, subject, page_number,
         paper_pattern, page_format, stickers, tiling_root, blocks,
         shapes, drawing_strokes, text_elements, shape_elements, is_favorite
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id, user_id, folder_id, title, subject, page_number,
                 paper_pattern, page_format, stickers, tiling_root, blocks,
                 shapes, drawing_strokes, text_elements, shape_elements,
                 is_favorite, created_at, updated_at`,
      [
        user.userId,
        folderId || null,
        title.trim(),
        subject || null,
        pageData.pageNumber || 1,
        pageData.paperPattern || 'grid',
        pageData.pageFormat || 'a4',
        JSON.stringify(pageData.stickers || []),
        JSON.stringify(pageData.tilingRoot || { id: 'root', type: 'leaf', blockId: 'default' }),
        JSON.stringify(pageData.blocks || {}),
        JSON.stringify(pageData.shapes || []),
        JSON.stringify(pageData.drawingStrokes || []),
        JSON.stringify(pageData.textElements || []),
        JSON.stringify(pageData.shapeElements || []),
        Boolean(isFavorite),
      ]
    );

    const note = mapDbRowToLooseNote(res.rows[0]);
    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/notes:', error);
    return NextResponse.json(
      { error: 'Error al crear la nota en la base de datos' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      folderId,
      subject,
      isFavorite,
      page,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de la nota requerido' }, { status: 400 });
    }

    const pageData = page || {};

    const res = await query(
      `UPDATE notes
       SET title = COALESCE($1, title),
           folder_id = CASE WHEN $2::text IS NOT NULL THEN $3::uuid ELSE folder_id END,
           subject = COALESCE($4, subject),
           is_favorite = COALESCE($5, is_favorite),
           paper_pattern = COALESCE($6, paper_pattern),
           page_format = COALESCE($7, page_format),
           stickers = CASE WHEN $8::jsonb IS NOT NULL THEN $8::jsonb ELSE stickers END,
           tiling_root = CASE WHEN $9::jsonb IS NOT NULL THEN $9::jsonb ELSE tiling_root END,
           blocks = CASE WHEN $10::jsonb IS NOT NULL THEN $10::jsonb ELSE blocks END,
           shapes = CASE WHEN $11::jsonb IS NOT NULL THEN $11::jsonb ELSE shapes END,
           drawing_strokes = CASE WHEN $12::jsonb IS NOT NULL THEN $12::jsonb ELSE drawing_strokes END,
           text_elements = CASE WHEN $13::jsonb IS NOT NULL THEN $13::jsonb ELSE text_elements END,
           shape_elements = CASE WHEN $14::jsonb IS NOT NULL THEN $14::jsonb ELSE shape_elements END,
           updated_at = NOW()
       WHERE id = $15 AND user_id = $16
       RETURNING id, user_id, folder_id, title, subject, page_number,
                 paper_pattern, page_format, stickers, tiling_root, blocks,
                 shapes, drawing_strokes, text_elements, shape_elements,
                 is_favorite, created_at, updated_at`,
      [
        title || null,
        folderId !== undefined ? 'set' : null,
        folderId || null,
        subject || null,
        isFavorite !== undefined ? isFavorite : null,
        pageData.paperPattern || null,
        pageData.pageFormat || null,
        pageData.stickers ? JSON.stringify(pageData.stickers) : null,
        pageData.tilingRoot ? JSON.stringify(pageData.tilingRoot) : null,
        pageData.blocks ? JSON.stringify(pageData.blocks) : null,
        pageData.shapes ? JSON.stringify(pageData.shapes) : null,
        pageData.drawingStrokes ? JSON.stringify(pageData.drawingStrokes) : null,
        pageData.textElements ? JSON.stringify(pageData.textElements) : null,
        pageData.shapeElements ? JSON.stringify(pageData.shapeElements) : null,
        id,
        user.userId,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Nota no encontrada o no autorizada' }, { status: 404 });
    }

    const updatedNote = mapDbRowToLooseNote(res.rows[0]);
    return NextResponse.json({ success: true, note: updatedNote });
  } catch (error: any) {
    console.error('Error en PUT /api/notes:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la nota en la base de datos' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de la nota requerido' }, { status: 400 });
    }

    const res = await query(
      `DELETE FROM notes
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, user.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Nota no encontrada o no autorizada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Nota eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error en DELETE /api/notes:', error);
    return NextResponse.json(
      { error: 'Error al eliminar nota de la base de datos' },
      { status: 500 }
    );
  }
}
