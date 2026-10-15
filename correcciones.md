# 📋 Informe de Auditoría Técnica y Correcciones Arquitectónicas: Proyecto Sirbook (v2.0)

> **Propósito del Documento:** Este anexo técnico actualiza y corrige la propuesta original de **Sirbook**, resolviendo cuellos de botella críticos en la viabilidad financiera (Unit Economics), la arquitectura de búsqueda web e Inteligencia Artificial, el rendimiento de la base de datos y la experiencia de usuario multiplataforma.

---

## 1. Arquitectura de Búsqueda e IA: Desacoplamiento del Motor RAG

### 🔴 Problema en Propuesta v1.0

El uso directo de **Google Search Grounding nativo** dentro de la API de Gemini presenta dos problemas graves:

1. **Inviabilidad Financiera:** Tiene un costo de **$14.00 a $35.00 USD por cada 1,000 búsquedas** (según el tier de API), lo cual destruye el margen de ganancia de una suscripción Pro de $6.99 USD/mes.
2. **Incompatibilidad Técnica:** Forzar esquemas JSON estrictos (`responseSchema` con Zod) simultáneamente con la herramienta nativa `googleSearch` provoca fallos de validación o degradación en los metadatos de las URLs citadas.

### 🟢 Corrección Adoptada (v2.0): Pipeline Modular *Search-First + Structured LLM*

Se desacopla la **Recuperación Web (Search Provider)** de la **Síntesis Estructurada (LLM Provider)** mediante el patrón de diseño *Strategy* en `packages/shared`.

| Entorno | Motor de Búsqueda (Retrieval) | Motor de IA (Síntesis JSON) | Costo por 1,000 Bloques |
| --- | --- | --- | --- |
| **Desarrollo Local (Dev)** | **SearXNG** (Contenedor Docker local) + **Crawl4AI / Jina Reader** | **Ollama** (Llama 3 / Qwen 2.5 local) o Gemini Tier Gratuito | **$0.00 USD** |
| **Producción (Prod)** | **Serper.dev** ($1/1k) o **Brave Search API** ($5/1k) + Caché en Supabase | **Gemini 2.5 Flash** (Solo tokens de entrada/salida, sin Grounding nativo) | **~$1.20 - $1.50 USD** *(Reducción de costos > 90%)* |

**Flujo de Ejecución Corregido:**

1. **Consulta de Caché Semántico:** Antes de buscar en internet, el backend verifica en Supabase si `hash(keyword + mode + context)` ya fue generado en los últimos 30 días. Si existe, se entrega en `<100ms` a **costo $0**.
2. **Búsqueda Externa Rápida (~300ms):** Si no está en caché, el `SearchProvider` obtiene los 5 mejores resultados web reales (títulos, URLs verificadas y fragmentos limpios).
3. **Generación Estructurada Garantizada:** Se inyectan los resultados web en el prompt del LLM y se fuerza `Structured Outputs` (Zod JSON Schema). Como el LLM no ejecuta herramientas externas en este paso, la generación del JSON es **100% determinista y libre de alucinaciones en las URLs**.

---

## 2. Optimización del Modelo de Negocio y Unit Economics

### 🔴 Problema en Propuesta v1.0

Ofrecer *"Generaciones ilimitadas con búsqueda en tiempo real por $6.99/mes"* expone al proyecto a pérdidas operativas por usuarios intensivos (*power users*) y no contempla el recorte del 15%-30% de **Google Play Billing** en Android.

### 🟢 Corrección Adoptada (v2.0): Enrutamiento Inteligente y Políticas de Uso Justo

* **Enrutamiento Condicional de Búsqueda (Smart Routing):** No todos los bloques requieren consultar internet en vivo. Conceptos académicos consolidados (ej. *"Segunda Guerra Mundial"*, *"Mitosis"*, *"Ley de Ohm"*) son resueltos directamente por el conocimiento base del LLM a una fracción del costo, activando el `SearchProvider` únicamente cuando el tema requiere datos actuales, estadísticas verificadas o enlaces externos.
* **Redefinición del Plan Pro ($6.99 USD/mes o $59 USD/año):**
* **Generación Estándar Ilimitada** (Conceptos, Gráficos y Datos asistidos por IA + Caché Global).
* **300 Búsquedas Web en Vivo (Deep Web Search) / mes** incluidas (suficiente para el 99% de los usuarios, protegiendo el margen operativo por encima del 80%).


* **Estrategia de Pagos Multiplataforma:**
* Se utilizará **Stripe / LemonSqueezy** en la aplicación Web.
* Para cumplir con las políticas de Google Play Store sin perder el 30% en cada transacción web, se integrará **RevenueCat** para sincronizar el estado de suscripción entre Web y Android, o se gestionará el alta de suscripción desde la plataforma Web (modelo *Reader App*).



---

## 3. Corrección del Esquema de Base de Datos (Supabase PostgreSQL)

### 🔴 Problema en Propuesta v1.0

1. **Cuello de botella en RLS (Row Level Security):** Las políticas de seguridad de `sections` y `blocks` dependían de subconsultas `EXISTS` con `JOIN` hacia la tabla `notebooks`. En cuadernos con cientos de bloques, esto degrada severamente el tiempo de respuesta.
2. **Ausencia de Tabla de Caché Global:** Sin una tabla dedicada al caché de respuestas de IA, múltiples usuarios consultando el mismo concepto pagarían API repetidamente.

### 🟢 Corrección Adoptada (v2.0): Esquema Desnormalizado + Índices + Caché Global

```sql
-- 1. Cuadernos principales
CREATE TABLE notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_color TEXT DEFAULT '#4F46E5',
    icon TEXT DEFAULT 'book',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Secciones (Desnormalizado con user_id para RLS instantáneo)
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bloques inteligentes (Desnormalizado con user_id)
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('concept', 'graphic', 'curiosity', 'free')),
    keyword TEXT,
    context_path TEXT, -- Ej: "Bioquímica > Enzimas" para evitar ambigüedad
    content JSONB NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NUEVO: Caché Semántico Global para reducir costos de IA y Búsqueda a $0
CREATE TABLE ai_global_cache (
    cache_key TEXT PRIMARY KEY, -- Hash SHA-256 de (normalized_keyword + mode + normalized_context)
    mode TEXT NOT NULL,
    keyword TEXT NOT NULL,
    response_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Índices de Rendimiento
CREATE INDEX idx_notebooks_user ON notebooks(user_id);
CREATE INDEX idx_sections_notebook ON sections(notebook_id);
CREATE INDEX idx_sections_user ON sections(user_id);
CREATE INDEX idx_blocks_section ON blocks(section_id);
CREATE INDEX idx_blocks_user ON blocks(user_id);
CREATE INDEX idx_cache_expires ON ai_global_cache(expires_at);

-- Habilitar RLS
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS Optimizadas (O(1) sin JOINs costosos)
CREATE POLICY "Manage own notebooks" ON notebooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own sections" ON sections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own blocks" ON blocks FOR ALL USING (auth.uid() = user_id);

```

---

## 4. Mejoras de Producto, UX y Resiliencia Técnica

### 4.1. Resolución de Polisemia mediante Herencia de Contexto

* **Problema:** Si el usuario escribe solo la palabra clave *"Mercurio"*, la IA no sabe si se refiere al planeta, al elemento químico o al dios mitológico.
* **Solución:** El endpoint de generación ya no recibe únicamente `{ keyword, mode }`, sino `{ keyword, mode, notebookTitle, sectionTitle }`. El prompt del sistema inyecta automáticamente: *"Analiza el término [keyword] estrictamente dentro del contexto académico/profesional de: [notebookTitle] > [sectionTitle]"*.

### 4.2. Sanitizer y UX para Diagramas Mermaid (Modo Gráfico)

* **Problema:** Los LLMs suelen introducir caracteres no escapados (como paréntesis o comillas dentro de nodos Mermaid) que rompen el compilador visual, y los gráficos grandes son ilegibles en pantallas verticales de Android.
* **Solución:**
1. Se añade un **Mermaid Linter/Sanitizer** en `packages/shared` que limpia caracteres conflictivos antes de guardar el JSON.
2. En la app Android (Expo), el componente `MermaidViewer` se envuelve en un lienzo interactivo con soporte para **Pan & Zoom (pellizcar para acercar)** y botón de visualización a pantalla completa en modo horizontal.



### 4.3. Modo Repaso Activo (Retención para Estudiantes)

* **Problema:** La generación 100% automática disminuye la retención cognitiva a largo plazo.
* **Solución:** Se incorpora un interruptor de **"Modo Estudio / Flashcard"** en la interfaz de las secciones. Al activarlo, el contenido de los bloques (`definicion_corta`, `puntos_clave`, `explicacion`) se difumina (*blur*) mostrando únicamente el título o palabra clave hasta que el usuario toque la tarjeta para verificar si recordaba el concepto.

### 4.4. Estrategia Offline Realista en Android

* **Problema:** `AsyncStorage` no es apto para sincronización relacional bidireccional y puede corromper estados si se edita en móvil y web simultáneamente.
* **Solución:** En el MVP, el almacenamiento local en Android utilizará **`expo-sqlite` ( o caché persistente de TanStack Query)** enfocado en **Lectura y Repaso Offline Instantáneo**, encolando únicamente la creación de notas en *Modo Libre* y requiriendo conexión activa para invocar nuevas generaciones de IA.

---

## 5. Estructura Actualizada del Paquete Compartido (`packages/shared`)

Se actualiza la arquitectura del monorepo para incluir la capa de abstracción de búsqueda e IA:

```text
packages/shared/
├── src/
│   ├── types/               # Interfaces de Notebook, Section, Block y Cache
│   ├── schemas/             # Validadores Zod estrictos para los 4 modos
│   ├── prompts/             # Templates contextualizados (Keyword + Notebook + Section)
│   ├── utils/
│   │   ├── mermaid-sanitizer.ts  # Limpieza de sintaxis Mermaid antes de renderizar
│   │   └── cache-hash.ts         # Generador de claves únicas para ai_global_cache
│   └── services/
│       ├── search/          # Patrón Strategy para buscadores web
│       │   ├── index.ts     # Interfaz ISearchProvider
│       │   ├── searxng.ts   # Adaptador gratuito local (Docker)
│       │   └── serper.ts    # Adaptador económico para producción ($1/1k)
│       └── llm/             # Patrón Strategy para modelos de IA
│           ├── index.ts     # Interfaz ILLMProvider
│           ├── ollama.ts    # Adaptador local para pruebas a costo $0
│           └── gemini.ts    # Adaptador Gemini Flash con Structured Outputs
└── package.json

```

---

## 6. Cronograma Maestro Ajustado (MVP Realista sin Deuda Técnica)

Para garantizar el éxito del lanzamiento dentro de la ventana de 5 semanas, se prioriza una arquitectura **Web + PWA instalable primero**, seguida de la compilación nativa en Expo reutilizando el 100% de la lógica de negocio:

| Fase | Duración | Hitos Clave Corregidos |
| --- | --- | --- |
| **Fase 1: Fundación & Entorno Local $0** | Días 1 - 4 | Setup del Monorepo, migraciones SQL optimizadas (con `user_id` desnormalizado y tabla `ai_global_cache`) y contenedor Docker de **SearXNG** funcionando en local. |
| **Fase 2: Motor Híbrido Search + IA** | Días 5 - 9 | Implementación de `ISearchProvider` (SearXNG/Serper) + `ILLMProvider` (Gemini/Ollama), validadores Zod con herencia de contexto (`notebook > section`) y *Mermaid Sanitizer*. |
| **Fase 3: Aplicación Web Completa + PWA** | Días 10 - 19 | UI de Cuadernos en Next.js, renderizado de los 4 modos, **Modo Estudio (Blur/Flashcards)**, sincronización Realtime y configuración PWA para pruebas inmediatas en móvil. |
| **Fase 4: App Nativa Android (Expo)** | Días 20 - 28 | Creación de `apps/mobile` consumiendo `packages/shared`, visor Mermaid con *Pan & Zoom* nativo y caché de **Lectura Offline** con `expo-sqlite` / TanStack Query. |
| **Fase 5: Monetización, QA & Despliegue** | Días 29 - 33 | Integración de pagos (Plan Pro con cuotas de *Smart Routing*), exportación a PDF y despliegue en producción (Vercel + APK de Android). |