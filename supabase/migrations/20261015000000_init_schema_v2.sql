-- Migration: 20261015000000_init_schema_v2.sql
-- Description: Schema inicial optimizado v2.0 para Sirbook (RLS O(1), Caché Global e Índices)

-- 1. Función para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tabla de Cuadernos (Notebooks)
CREATE TABLE IF NOT EXISTS notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_color TEXT DEFAULT '#4F46E5',
    icon TEXT DEFAULT 'book',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_notebooks_updated_at
BEFORE UPDATE ON notebooks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Tabla de Secciones (Sections)
-- user_id está desnormalizado intencionalmente para garantizar RLS en O(1) sin JOINs
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_sections_updated_at
BEFORE UPDATE ON sections
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Tabla de Bloques Inteligentes (Blocks)
-- user_id desnormalizado para RLS O(1) + context_path para herencia contextual
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('concept', 'graphic', 'curiosity', 'free')),
    keyword TEXT,
    context_path TEXT, -- Ej: "Bioquímica > Ciclo de Krebs"
    content JSONB NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_blocks_updated_at
BEFORE UPDATE ON blocks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Tabla de Caché Semántico Global (ai_global_cache)
-- Almacena respuestas previas para entregar en <100ms a costo $0
CREATE TABLE IF NOT EXISTS ai_global_cache (
    cache_key TEXT PRIMARY KEY, -- Hash SHA-256 de (normalized_keyword + mode + normalized_context)
    mode TEXT NOT NULL CHECK (mode IN ('concept', 'graphic', 'curiosity')),
    keyword TEXT NOT NULL,
    context_path TEXT,
    response_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- 6. Índices de Rendimiento para Búsquedas y RLS
CREATE INDEX IF NOT EXISTS idx_notebooks_user ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS idx_sections_notebook ON sections(notebook_id);
CREATE INDEX IF NOT EXISTS idx_sections_user ON sections(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_section ON blocks(section_id);
CREATE INDEX IF NOT EXISTS idx_blocks_notebook ON blocks(notebook_id);
CREATE INDEX IF NOT EXISTS idx_blocks_user ON blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON ai_global_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_mode_keyword ON ai_global_cache(mode, keyword);

-- 7. Configuración de Row Level Security (RLS)
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_global_cache ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS en O(1) sin subconsultas complejas
CREATE POLICY "Users can manage their own notebooks"
ON notebooks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sections"
ON sections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own blocks"
ON blocks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para ai_global_cache: Lectura compartida para usuarios autenticados
CREATE POLICY "Authenticated users can read global AI cache"
ON ai_global_cache FOR SELECT
TO authenticated
USING (expires_at > NOW());

-- Escritura en ai_global_cache: Permitida a usuarios autenticados
CREATE POLICY "Authenticated users can insert into global AI cache"
ON ai_global_cache FOR INSERT
TO authenticated
WITH CHECK (true);

-- Habilitar publicación en Realtime de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE notebooks;
ALTER PUBLICATION supabase_realtime ADD TABLE sections;
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
