export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export type CreateNotebookInput = Omit<Notebook, 'id' | 'created_at' | 'updated_at'>;
export type UpdateNotebookInput = Partial<Omit<Notebook, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
