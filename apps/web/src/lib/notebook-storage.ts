import { DigitalNotebook, NotebookPage, LooseNote } from '../types/notebook-engine';

export const STORAGE_NOTEBOOKS_KEY = 'sirbook_digital_notebooks_v5';
export const STORAGE_LOOSE_NOTES_KEY = 'sirbook_loose_notes_v6';
export const AUTH_TOKEN_KEY = 'sirbook_auth_token';

// 100% CERO DATOS MOCKEADOS: Listas iniciales vacías
export const INITIAL_DIGITAL_NOTEBOOKS: DigitalNotebook[] = [];
export const INITIAL_LOOSE_NOTES: LooseNote[] = [];

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==========================================
// CLIENT API: CARPETAS Y CUADERNOS
// ==========================================

export async function fetchFoldersFromDB(): Promise<DigitalNotebook[]> {
  try {
    const res = await fetch('/api/folders', {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error(`Error ${res.status} al cargar carpetas`);
    }
    const data = await res.json();
    return data.folders || [];
  } catch (error) {
    console.error('Error al consultar carpetas de la BD:', error);
    throw error;
  }
}

export async function saveFolderToDB(
  folder: Partial<DigitalNotebook> & { id?: string; title: string }
): Promise<DigitalNotebook> {
  const isUpdate = Boolean(folder.id && !folder.id.startsWith('temp-'));
  const url = '/api/folders';
  const method = isUpdate ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(folder),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al persistir carpeta en la base de datos');
  }

  const data = await res.json();
  return data.folder;
}

export async function deleteFolderFromDB(folderId: string): Promise<void> {
  const res = await fetch(`/api/folders?id=${encodeURIComponent(folderId)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar carpeta de la base de datos');
  }
}

// ==========================================
// CLIENT API: NOTAS SUELTAS
// ==========================================

export async function fetchLooseNotesFromDB(): Promise<LooseNote[]> {
  try {
    const res = await fetch('/api/notes', {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error(`Error ${res.status} al cargar notas`);
    }
    const data = await res.json();
    return data.notes || [];
  } catch (error) {
    console.error('Error al consultar notas de la BD:', error);
    throw error;
  }
}

export async function saveLooseNoteToDB(
  note: Partial<LooseNote> & { id?: string; title: string }
): Promise<LooseNote> {
  const isUpdate = Boolean(note.id && !note.id.startsWith('temp-'));
  const url = '/api/notes';
  const method = isUpdate ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(note),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al persistir nota en la base de datos');
  }

  const data = await res.json();
  return data.note;
}

export async function deleteLooseNoteFromDB(noteId: string): Promise<void> {
  const res = await fetch(`/api/notes?id=${encodeURIComponent(noteId)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al eliminar nota de la base de datos');
  }
}

// ==========================================
// FALLBACK / CACHE LOCAL OFFLINE
// ==========================================

export function loadStoredNotebooks(): DigitalNotebook[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_NOTEBOOKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error al leer caché local de cuadernos:', e);
  }
  return [];
}

export function saveStoredNotebooks(notebooks: DigitalNotebook[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_NOTEBOOKS_KEY, JSON.stringify(notebooks));
  } catch (e) {
    console.warn('Error al guardar caché local de cuadernos:', e);
  }
}

export function loadStoredLooseNotes(): LooseNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_LOOSE_NOTES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error al leer caché local de notas:', e);
  }
  return [];
}

export function saveStoredLooseNotes(notes: LooseNote[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_LOOSE_NOTES_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('Error al guardar caché local de notas:', e);
  }
}
