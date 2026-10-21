import { getStroke } from 'perfect-freehand';
import { StrokePoint } from '@/types/notebook-engine';

/**
 * Converts a sequence of stroke polygon points into an SVG path 'd' string
 */
export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );

  d.push('Z');
  return d.join(' ');
}

/**
 * Generates an SVG path string from an array of StrokePoints using perfect-freehand
 */
export function pointsToSvgPath(points: StrokePoint[], size: number = 3): string {
  if (!points || points.length === 0) return '';
  
  if (points.length === 1) {
    // Single dot
    const p = points[0];
    const r = Math.max(1, size / 2);
    return `M ${p.x - r} ${p.y} A ${r} ${r} 0 1 0 ${p.x + r} ${p.y} A ${r} ${r} 0 1 0 ${p.x - r} ${p.y} Z`;
  }

  const strokePoints = points.map((p) => [p.x, p.y, p.pressure ?? 0.5]);
  const outline = getStroke(strokePoints, {
    size,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    start: { taper: 0, cap: true },
    end: { taper: 0, cap: true },
  });

  return getSvgPathFromStroke(outline);
}

/**
 * Hit test: checks if a point (x, y) is within threshold distance of any stroke point
 */
export function isPointNearStroke(
  point: { x: number; y: number },
  strokePoints: StrokePoint[],
  threshold: number = 12
): boolean {
  const tSquared = threshold * threshold;
  for (let i = 0; i < strokePoints.length; i++) {
    const sp = strokePoints[i];
    const dx = point.x - sp.x;
    const dy = point.y - sp.y;
    if (dx * dx + dy * dy <= tSquared) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if any stroke point is within or intersects the selection rectangle
 */
export function isStrokeInBox(
  box: { x: number; y: number; width: number; height: number },
  strokePoints: StrokePoint[]
): boolean {
  if (!strokePoints || strokePoints.length === 0) return false;
  const minX = box.x;
  const maxX = box.x + box.width;
  const minY = box.y;
  const maxY = box.y + box.height;

  for (let i = 0; i < strokePoints.length; i++) {
    const sp = strokePoints[i];
    if (sp.x >= minX && sp.x <= maxX && sp.y >= minY && sp.y <= maxY) {
      return true;
    }
  }
  return false;
}
