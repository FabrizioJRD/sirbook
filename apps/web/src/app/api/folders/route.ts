import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-jwt';

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 1. Obtener carpetas del usuario
    const foldersRes = await query(
      `SELECT id, user_id, title, subject, description, cover_color as "coverColor",
              cover_theme as "coverTheme", icon, as_notebook as "asNotebook",
              orientation, is_favorite as "isFavorite",
              last_active_page_index as "lastActivePageIndex",
              created_at, updated_at
       FROM folders
       WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY updated_at DESC`,
      [user.userId]
    );

    const folders = foldersRes.rows;

    // 2. Obtener páginas pertenecientes a estas carpetas
    if (folders.length > 0) {
      const folderIds = folders.map((f: any) => f.id);
      const notesRes = await query(
        `SELECT id, folder_id as "folderId", title, subject, page_number as "pageNumber",
                paper_pattern as "paperPattern", page_format as "pageFormat",
                stickers, tiling_root as "tilingRoot", blocks, shapes,
                drawing_strokes as "drawingStrokes", text_elements as "textElements",
                shape_elements as "shapeElements", is_favorite as "isFavorite",
                created_at, updated_at
         FROM notes
         WHERE user_id = $1 AND folder_id = ANY($2::uuid[]) AND deleted_at IS NULL
         ORDER BY page_number ASC, created_at ASC`,
        [user.userId, folderIds]
      );

      const notesByFolder: Record<string, any[]> = {};
      notesRes.rows.forEach((note: any) => {
        if (!notesByFolder[note.folderId]) {
          notesByFolder[note.folderId] = [];
        }
        notesByFolder[note.folderId].push({
          id: note.id,
          pageNumber: note.pageNumber || 1,
          subjectTopic: note.subject || note.title || '',
          paperPattern: note.paperPattern || 'grid',
          pageFormat: note.pageFormat || 'a4',
          stickers: note.stickers || [],
          tilingRoot: note.tilingRoot || { id: 'root', type: 'leaf', blockId: 'default' },
          blocks: note.blocks || {},
          shapes: note.shapes || [],
          drawingStrokes: note.drawingStrokes || [],
          textElements: note.textElements || [],
          shapeElements: note.shapeElements || [],
        });
      });

      // Ensamblar páginas en cada carpeta
      folders.forEach((f: any) => {
        f.pages = notesByFolder[f.id] || [];
      });
    }

    return NextResponse.json({ success: true, folders });
  } catch (error: any) {
    console.error('Error en GET /api/folders:', error);
    return NextResponse.json(
      { error: 'Error al obtener carpetas de la base de datos' },
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
      subject,
      description,
      coverColor = '#059669',
      coverTheme = 'emerald-study',
      icon = '📁',
      asNotebook = false,
      orientation = 'vertical',
      pages = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    // Insertar carpeta
    const res = await query(
      `INSERT INTO folders (user_id, title, subject, description, cover_color, cover_theme, icon, as_notebook, orientation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, subject, description, cover_color as "coverColor",
                 cover_theme as "coverTheme", icon, as_notebook as "asNotebook",
                 orientation, is_favorite as "isFavorite",
                 last_active_page_index as "lastActivePageIndex",
                 created_at, updated_at`,
      [
        user.userId,
        title.trim(),
        subject || null,
        description || null,
        coverColor,
        coverTheme,
        icon,
        asNotebook,
        orientation,
      ]
    );

    const newFolder = res.rows[0];
    newFolder.pages = [];

    // Si trae páginas iniciales o si es un cuaderno, crear su primera página
    const pagesToCreate = pages.length > 0 ? pages : [
      {
        id: `page-${Date.now()}`,
        pageNumber: 1,
        subjectTopic: subject || title,
        paperPattern: 'grid',
        pageFormat: 'a4',
        stickers: [],
        tilingRoot: { id: 'root', type: 'leaf', blockId: 'default' },
        blocks: {},
        shapes: [],
        drawingStrokes: [],
        textElements: [],
        shapeElements: [],
      }
    ];

    for (let i = 0; i < pagesToCreate.length; i++) {
      const p = pagesToCreate[i];
      const pageRes = await query(
        `INSERT INTO notes (
           user_id, folder_id, title, subject, page_number,
           paper_pattern, page_format, stickers, tiling_root, blocks,
           shapes, drawing_strokes, text_elements, shape_elements
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id, page_number as "pageNumber", subject as "subjectTopic",
                   paper_pattern as "paperPattern", page_format as "pageFormat",
                   stickers, tiling_root as "tilingRoot", blocks, shapes,
                   drawing_strokes as "drawingStrokes", text_elements as "textElements",
                   shape_elements as "shapeElements"`,
        [
          user.userId,
          newFolder.id,
          `${title} - Página ${i + 1}`,
          p.subjectTopic || subject || '',
          i + 1,
          p.paperPattern || 'grid',
          p.pageFormat || 'a4',
          JSON.stringify(p.stickers || []),
          JSON.stringify(p.tilingRoot || { id: 'root', type: 'leaf', blockId: 'default' }),
          JSON.stringify(p.blocks || {}),
          JSON.stringify(p.shapes || []),
          JSON.stringify(p.drawingStrokes || []),
          JSON.stringify(p.textElements || []),
          JSON.stringify(p.shapeElements || []),
        ]
      );
      newFolder.pages.push(pageRes.rows[0]);
    }

    return NextResponse.json({ success: true, folder: newFolder }, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/folders:', error);
    return NextResponse.json(
      { error: 'Error al crear la carpeta en la base de datos' },
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
      subject,
      description,
      coverColor,
      coverTheme,
      icon,
      asNotebook,
      orientation,
      isFavorite,
      lastActivePageIndex,
      pages,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de carpeta requerido' }, { status: 400 });
    }

    const res = await query(
      `UPDATE folders
       SET title = COALESCE($1, title),
           subject = COALESCE($2, subject),
           description = COALESCE($3, description),
           cover_color = COALESCE($4, cover_color),
           cover_theme = COALESCE($5, cover_theme),
           icon = COALESCE($6, icon),
           as_notebook = COALESCE($7, as_notebook),
           orientation = COALESCE($8, orientation),
           is_favorite = COALESCE($9, is_favorite),
           last_active_page_index = COALESCE($10, last_active_page_index),
           updated_at = NOW()
       WHERE id = $11 AND user_id = $12
       RETURNING id, title, subject, description, cover_color as "coverColor",
                 cover_theme as "coverTheme", icon, as_notebook as "asNotebook",
                 orientation, is_favorite as "isFavorite",
                 last_active_page_index as "lastActivePageIndex",
                 created_at, updated_at`,
      [
        title,
        subject,
        description,
        coverColor,
        coverTheme,
        icon,
        asNotebook,
        orientation,
        isFavorite,
        lastActivePageIndex,
        id,
        user.userId,
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Carpeta no encontrada o no autorizada' }, { status: 404 });
    }

    const updatedFolder = res.rows[0];

    // Si se enviaron páginas para actualizar sincronizadamente
    if (Array.isArray(pages)) {
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        if (p.id && !p.id.startsWith('page-')) {
          // Actualizar nota existente
          await query(
            `UPDATE notes
             SET page_number = $1,
                 subject = $2,
                 paper_pattern = $3,
                 page_format = $4,
                 stickers = $5,
                 tiling_root = $6,
                 blocks = $7,
                 shapes = $8,
                 drawing_strokes = $9,
                 text_elements = $10,
                 shape_elements = $11,
                 updated_at = NOW()
             WHERE id = $12 AND folder_id = $13 AND user_id = $14`,
            [
              i + 1,
              p.subjectTopic || '',
              p.paperPattern || 'grid',
              p.pageFormat || 'a4',
              JSON.stringify(p.stickers || []),
              JSON.stringify(p.tilingRoot || {}),
              JSON.stringify(p.blocks || {}),
              JSON.stringify(p.shapes || []),
              JSON.stringify(p.drawingStrokes || []),
              JSON.stringify(p.textElements || []),
              JSON.stringify(p.shapeElements || []),
              p.id,
              id,
              user.userId,
            ]
          );
        } else {
          // Insertar nueva página
          const newNoteRes = await query(
            `INSERT INTO notes (
               user_id, folder_id, title, subject, page_number,
               paper_pattern, page_format, stickers, tiling_root, blocks,
               shapes, drawing_strokes, text_elements, shape_elements
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING id`,
            [
              user.userId,
              id,
              `${updatedFolder.title} - Página ${i + 1}`,
              p.subjectTopic || '',
              i + 1,
              p.paperPattern || 'grid',
              p.pageFormat || 'a4',
              JSON.stringify(p.stickers || []),
              JSON.stringify(p.tilingRoot || {}),
              JSON.stringify(p.blocks || {}),
              JSON.stringify(p.shapes || []),
              JSON.stringify(p.drawingStrokes || []),
              JSON.stringify(p.textElements || []),
              JSON.stringify(p.shapeElements || []),
            ]
          );
          p.id = newNoteRes.rows[0].id;
        }
      }
      updatedFolder.pages = pages;
    }

    return NextResponse.json({ success: true, folder: updatedFolder });
  } catch (error: any) {
    console.error('Error en PUT /api/folders:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la carpeta en la base de datos' },
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
      return NextResponse.json({ error: 'ID de carpeta requerido' }, { status: 400 });
    }

    const res = await query(
      `DELETE FROM folders
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, user.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Carpeta no encontrada o no autorizada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Carpeta eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error en DELETE /api/folders:', error);
    return NextResponse.json(
      { error: 'Error al eliminar carpeta de la base de datos' },
      { status: 500 }
    );
  }
}
