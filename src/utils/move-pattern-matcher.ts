import { MovePatternOption, MovePatternVector } from "@/api/model/piece";

const BOARD_CENTER = { row: 4, col: 4 };

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x === 0 ? 1 : x;
}

export function vectorsFromBoardSelection(
  selectedCells: Array<{ row: number; col: number }>,
  repeatable: boolean,
): MovePatternVector[] {
  const uniq = new Map<string, MovePatternVector>();

  for (const cell of selectedCells) {
    const rawDx = cell.col - BOARD_CENTER.col;
    const rawDy = cell.row - BOARD_CENTER.row;
    if (rawDx === 0 && rawDy === 0) continue;

    if (repeatable) {
      const d = gcd(rawDx, rawDy);
      const dx = rawDx / d;
      const dy = rawDy / d;
      const key = `${dx},${dy},8`;
      uniq.set(key, { dx, dy, maxStep: 8 });
      continue;
    }

    const key = `${rawDx},${rawDy},1`;
    uniq.set(key, { dx: rawDx, dy: rawDy, maxStep: 1 });
  }

  return Array.from(uniq.values());
}

function signatureOf(vectors: MovePatternVector[]): string {
  return vectors
    .slice()
    .sort((a, b) => {
      if (a.dx !== b.dx) return a.dx - b.dx;
      if (a.dy !== b.dy) return a.dy - b.dy;
      return a.maxStep - b.maxStep;
    })
    .map((v) => `${v.dx},${v.dy},${v.maxStep}`)
    .join("|");
}

export function findMatchingMovePattern(
  movePatterns: MovePatternOption[],
  vectors: MovePatternVector[],
): MovePatternOption | null {
  if (vectors.length === 0) return null;
  const target = signatureOf(vectors);

  for (const pattern of movePatterns) {
    if (signatureOf(pattern.vectors) === target) {
      return pattern;
    }
  }

  return null;
}
