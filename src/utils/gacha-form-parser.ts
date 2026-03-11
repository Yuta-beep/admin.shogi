import { GachaFormInput, GachaTargetPieceInput } from "@/types/gacha";

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asBoolOrDefault(value: unknown, defaultValue: boolean) {
  return typeof value === "boolean" ? value : defaultValue;
}

function asNonNegativeInt(value: unknown, fallback = 0) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) return fallback;
  return num;
}

function asRate(value: unknown, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num;
}

function asIsoOrNull(value: unknown) {
  const raw = asString(value).trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid datetime value");
  return date.toISOString();
}

function parseTargetPieces(value: unknown): GachaTargetPieceInput[] {
  if (!Array.isArray(value)) return [];

  const parsed: GachaTargetPieceInput[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      throw new Error("targetPieces must be an array of objects");
    }
    const row = item as Record<string, unknown>;
    const pieceId = Number(row.pieceId);
    const weight = Number(row.weight);
    const isActive = asBoolOrDefault(row.isActive, true);
    if (!Number.isInteger(pieceId) || pieceId <= 0) {
      throw new Error("targetPieces.pieceId must be a positive integer");
    }
    if (!Number.isInteger(weight) || weight <= 0) {
      throw new Error("targetPieces.weight must be a positive integer");
    }
    parsed.push({ pieceId, weight, isActive });
  }

  const unique = new Set(parsed.map((item) => item.pieceId));
  if (unique.size !== parsed.length) {
    throw new Error("targetPieces contains duplicated pieceId");
  }

  return parsed;
}

function validateRarityRate(input: {
  n: number;
  r: number;
  sr: number;
  ur: number;
  ssr: number;
}) {
  const values = [input.n, input.r, input.sr, input.ur, input.ssr];
  if (values.some((value) => value < 0 || value > 1)) {
    throw new Error("rarity rates must be between 0 and 1");
  }
  const total = input.n + input.r + input.sr + input.ur + input.ssr;
  if (Math.abs(total - 1) > 0.0001) {
    throw new Error("rarity rates total must be 1");
  }
}

export function parseGachaFormBody(
  body: Record<string, unknown>,
): GachaFormInput {
  const gachaCode = asString(body.gachaCode).trim();
  const gachaName = asString(body.gachaName).trim();
  if (!gachaCode) throw new Error("gachaCode is required");
  if (!gachaName) throw new Error("gachaName is required");

  const rarityRateN = asRate(body.rarityRateN, 0);
  const rarityRateR = asRate(body.rarityRateR, 0);
  const rarityRateSr = asRate(body.rarityRateSr, 0);
  const rarityRateUr = asRate(body.rarityRateUr, 0);
  const rarityRateSsr = asRate(body.rarityRateSsr, 0);
  validateRarityRate({
    n: rarityRateN,
    r: rarityRateR,
    sr: rarityRateSr,
    ur: rarityRateUr,
    ssr: rarityRateSsr,
  });

  const pawnCost = asNonNegativeInt(body.pawnCost, 0);
  const goldCost = asNonNegativeInt(body.goldCost, 0);
  if (pawnCost + goldCost <= 0) {
    throw new Error("pawnCost + goldCost must be greater than 0");
  }

  const imageAspectRatio = asString(body.imageAspectRatio).trim();
  if (imageAspectRatio !== "3:1") {
    throw new Error("imageAspectRatio must be 3:1");
  }

  const targetPieces = parseTargetPieces(body.targetPieces);
  if (targetPieces.length === 0) {
    throw new Error("targetPieces is required");
  }

  return {
    gachaCode,
    gachaName,
    description: asString(body.description).trim() || null,
    rarityRateN,
    rarityRateR,
    rarityRateSr,
    rarityRateUr,
    rarityRateSsr,
    pawnCost,
    goldCost,
    imageSource: asString(body.imageSource).trim() || "supabase",
    imageBucket: asString(body.imageBucket).trim() || null,
    imageKey: asString(body.imageKey).trim() || null,
    imageVersion: asNonNegativeInt(body.imageVersion, 1) || 1,
    isActive: asBoolOrDefault(body.isActive, true),
    publishedAt: asIsoOrNull(body.publishedAt),
    unpublishedAt: asIsoOrNull(body.unpublishedAt),
    targetPieces,
  };
}
