export type PageOrientation = 'vertical' | 'horizontal';

export type CoverTheme =
  | 'emerald-study'
  | 'indigo-tech'
  | 'amber-classic'
  | 'rose-journal'
  | 'dark-slate'
  | 'violet-modern';

export interface StickerItem {
  id: string;
  name: string;
  emoji: string;
  color: string; // Tailwind color class or hex
  text?: string;
  category?: 'study' | 'priority' | 'idea' | 'science' | 'custom';
}

export interface CanvasShape {
  id: string;
  type: 'arrow' | 'callout' | 'highlight' | 'rectangle';
  label?: string;
  color: string;
  fromBlockId?: string;
  toBlockId?: string;
}

export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
export type FontFamily = 'sans' | 'serif' | 'mono' | 'handwriting';

export interface PageBlock {
  id: string;
  type: 'concept' | 'graphic' | 'curiosity' | 'text' | 'sticky' | 'shape';
  title: string;
  content: any; // ConceptBlockContent | GraphicBlockContent | CuriosityBlockContent | string
  tags?: string[];
  createdAt?: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  fontSize?: FontSize;
  fontFamily?: FontFamily;
  cardColor?: string;
  textColor?: string;
}

export type TilingNode =
  | {
      id: string;
      type: 'split';
      direction: 'horizontal' | 'vertical'; // horizontal = side-by-side; vertical = stacked
      ratio: number; // 0.2 to 0.8, default 0.5
      firstChild: TilingNode;
      secondChild: TilingNode;
    }
  | {
      id: string;
      type: 'leaf';
      blockId: string;
    };

export type PaperPattern = 'grid' | 'dots' | 'ruled' | 'plain';
export type PageFormat = 'a4' | 'a3' | 'a2' | 'a1' | 'letter' | 'legal' | 'infinite';

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawingStroke {
  id: string;
  points: StrokePoint[];
  color: string;
  size: number;
  createdAt?: string;
}

export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number; // 16, 22, 30, 40
  fontFamily: 'handwriting' | 'sans';
  color: string;
  width?: number;
  createdAt?: string;
}

export type ExcalidrawShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'arrow' | 'line';

export interface ShapeElement {
  id: string;
  type: ExcalidrawShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  fill?: string;
  createdAt?: string;
}

export interface NotebookPage {
  id: string;
  pageNumber: number;
  subjectTopic: string;
  paperPattern?: PaperPattern;
  pageFormat?: PageFormat;
  stickers: StickerItem[];
  tilingRoot: TilingNode;
  blocks: Record<string, PageBlock>;
  shapes: CanvasShape[];
  drawingStrokes?: DrawingStroke[];
  textElements?: TextElement[];
  shapeElements?: ShapeElement[];
}

export type SortOption =
  | 'updated_desc'
  | 'updated_asc'
  | 'title_asc'
  | 'title_desc'
  | 'pages_desc'
  | 'pages_asc';

export interface LooseNote {
  id: string;
  title: string;
  folderId: string | null; // null = Nota suelta independiente
  subject?: string;
  page: NotebookPage;
  isFavorite?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DigitalNotebook {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  coverTheme: CoverTheme;
  coverColor: string;
  icon: string;
  orientation: PageOrientation;
  lastActivePageIndex: number;
  pages: NotebookPage[];
  asNotebook?: boolean; // true = sus hojas se enumeran como páginas de cuaderno
  isFavorite?: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

