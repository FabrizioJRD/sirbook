-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función de actualización de timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tabla de Usuarios (Autenticación nativa)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Tabla de Carpetas y Cuadernos (Folders)
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    cover_color TEXT DEFAULT '#059669',
    cover_theme TEXT DEFAULT 'emerald-study',
    icon TEXT DEFAULT '📁',
    as_notebook BOOLEAN DEFAULT false,
    orientation TEXT DEFAULT 'vertical' CHECK (orientation IN ('vertical', 'horizontal')),
    is_favorite BOOLEAN DEFAULT false,
    last_active_page_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TRIGGER trigger_folders_updated_at
BEFORE UPDATE ON folders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Tabla de Notas y Páginas (Notes)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    page_number INT DEFAULT 1,
    paper_pattern TEXT DEFAULT 'grid' CHECK (paper_pattern IN ('grid', 'dots', 'ruled', 'plain')),
    page_format TEXT DEFAULT 'a4' CHECK (page_format IN ('a4', 'a3', 'a2', 'a1', 'letter', 'legal', 'infinite')),
    stickers JSONB DEFAULT '[]'::jsonb,
    tiling_root JSONB DEFAULT '{"id":"root","type":"leaf","blockId":"default"}'::jsonb,
    blocks JSONB DEFAULT '{}'::jsonb,
    shapes JSONB DEFAULT '[]'::jsonb,
    drawing_strokes JSONB DEFAULT '[]'::jsonb,
    text_elements JSONB DEFAULT '[]'::jsonb,
    shape_elements JSONB DEFAULT '[]'::jsonb,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TRIGGER trigger_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(is_favorite) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_folders_favorite ON folders(is_favorite) WHERE deleted_at IS NULL;
