export interface Section {
  id: string;
  notebook_id: string;
  user_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type CreateSectionInput = Omit<Section, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSectionInput = Partial<Omit<Section, 'id' | 'notebook_id' | 'user_id' | 'created_at' | 'updated_at'>>;
