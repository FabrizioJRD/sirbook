import { Notebook, Section, Block } from '@sirbook/shared';

// Base de datos local offline para Sirbook Móvil
// En Android nativo se apoya en SQLite para lectura y repaso offline instantáneo
export interface MobileOfflineStorage {
  getNotebooks(): Promise<Notebook[]>;
  saveNotebooks(notebooks: Notebook[]): Promise<void>;
  getSections(): Promise<Section[]>;
  saveSections(sections: Section[]): Promise<void>;
  getBlocks(): Promise<Block[]>;
  saveBlocks(blocks: Block[]): Promise<void>;
}

class InMemoryOfflineStorage implements MobileOfflineStorage {
  private notebooks: Notebook[] = [];
  private sections: Section[] = [];
  private blocks: Block[] = [];

  async getNotebooks(): Promise<Notebook[]> {
    return this.notebooks;
  }
  async saveNotebooks(notebooks: Notebook[]): Promise<void> {
    this.notebooks = notebooks;
  }
  async getSections(): Promise<Section[]> {
    return this.sections;
  }
  async saveSections(sections: Section[]): Promise<void> {
    this.sections = sections;
  }
  async getBlocks(): Promise<Block[]> {
    return this.blocks;
  }
  async saveBlocks(blocks: Block[]): Promise<void> {
    this.blocks = blocks;
  }
}

export const offlineStorage: MobileOfflineStorage = new InMemoryOfflineStorage();
