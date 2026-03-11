import { describe, expect, it } from "bun:test";

import { parseGachaFormBody } from "@/utils/gacha-form-parser";

function createBaseBody(): Record<string, unknown> {
  return {
    gachaCode: "hihen",
    gachaName: "ひへんガチャ",
    description: "説明",
    rarityRateN: 0,
    rarityRateR: 0.5,
    rarityRateSr: 0.3333,
    rarityRateUr: 0.1667,
    rarityRateSsr: 0,
    pawnCost: 30,
    goldCost: 0,
    imageSource: "supabase",
    imageBucket: "gacha-images",
    imageKey: "assets/gacha/hihen.png",
    imageVersion: 1,
    isActive: true,
    publishedAt: "2026-03-11T00:00:00+09:00",
    unpublishedAt: "2026-04-01T23:59:59+09:00",
    targetPieces: [
      { pieceId: 1, weight: 3, isActive: true },
      { pieceId: 2, weight: 1, isActive: true },
    ],
  };
}

describe("parseGachaFormBody", () => {
  it("parses valid gacha body", () => {
    const parsed = parseGachaFormBody(createBaseBody());

    expect(parsed.gachaCode).toBe("hihen");
    expect(parsed.gachaName).toBe("ひへんガチャ");
    expect(parsed.rarityRateR).toBe(0.5);
    expect(parsed.rarityRateSr).toBe(0.3333);
    expect(parsed.rarityRateUr).toBe(0.1667);
    expect(parsed.pawnCost).toBe(30);
    expect(parsed.goldCost).toBe(0);
    expect(parsed.targetPieces).toEqual([
      { pieceId: 1, weight: 3, isActive: true },
      { pieceId: 2, weight: 1, isActive: true },
    ]);
    expect(parsed.publishedAt).toBe("2026-03-10T15:00:00.000Z");
    expect(parsed.unpublishedAt).toBe("2026-04-01T14:59:59.000Z");
  });

  it("throws when rarity rates total is not 1", () => {
    const body = createBaseBody();
    body.rarityRateUr = 0.1;

    expect(() => parseGachaFormBody(body)).toThrow(
      "rarity rates total must be 1",
    );
  });

  it("throws when all costs are zero", () => {
    const body = createBaseBody();
    body.pawnCost = 0;
    body.goldCost = 0;

    expect(() => parseGachaFormBody(body)).toThrow(
      "pawnCost + goldCost must be greater than 0",
    );
  });

  it("throws when imageSource is not supabase", () => {
    const body = createBaseBody();
    body.imageSource = "s3";

    expect(() => parseGachaFormBody(body)).toThrow(
      "imageSource must be supabase",
    );
  });

  it("throws when targetPieces has duplicated pieceId", () => {
    const body = createBaseBody();
    body.targetPieces = [
      { pieceId: 10, weight: 1, isActive: true },
      { pieceId: 10, weight: 2, isActive: true },
    ];

    expect(() => parseGachaFormBody(body)).toThrow(
      "targetPieces contains duplicated pieceId",
    );
  });

  it("throws when targetPieces is empty", () => {
    const body = createBaseBody();
    body.targetPieces = [];

    expect(() => parseGachaFormBody(body)).toThrow("targetPieces is required");
  });
});
