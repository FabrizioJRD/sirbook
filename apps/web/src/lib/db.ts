import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://sirbook:sirbook_password@localhost:5432/sirbook';

// Singleton pool pattern para evitar agotar conexiones en recargas de Next.js
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  pool = global.__pgPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && duration > 200) {
      console.warn(`[db-query] Consulta lenta (${duration}ms):`, text.slice(0, 100));
    }
    return res;
  } catch (error) {
    console.error('[db-error] Error ejecutando consulta SQL:', {
      text: text.slice(0, 120),
      params,
      error,
    });
    throw error;
  }
}

export default pool;
