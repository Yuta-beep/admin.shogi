export function parsePieceId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("pieceId must be a positive integer");
  }
  return id;
}

export function parseStageId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("stageId must be a positive integer");
  }
  return id;
}

export function parseGachaId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("gachaId must be a positive integer");
  }
  return id;
}

export function parseQuery(raw: string | null): string {
  return (raw ?? "").trim();
}
