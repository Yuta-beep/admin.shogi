import { describe, expect, it } from "bun:test";
import { createPieceSearchUseCase } from "@/features/piece/usecases/piece-search.usecase";

describe("pieceSearchUseCase", () => {
  it("filters by kanji", async () => {
    const usecase = createPieceSearchUseCase({
      listPiecesUseCase: async () => ({
        pieces: [
          {
            pieceId: 1,
            pieceCode: "AUTO001",
            kanji: "歩",
            name: "歩兵",
            movePatternId: 1,
            movePatternName: "歩",
            skillId: null,
            skillDesc: null,
            imageSource: "supabase",
            imageBucket: null,
            imageKey: null,
            imageVersion: 1,
            isActive: true,
            publishedAt: null,
            unpublishedAt: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
          {
            pieceId: 2,
            pieceCode: "AUTO002",
            kanji: "角",
            name: "角行",
            movePatternId: 2,
            movePatternName: "角",
            skillId: null,
            skillDesc: null,
            imageSource: "supabase",
            imageBucket: null,
            imageKey: null,
            imageVersion: 1,
            isActive: true,
            publishedAt: null,
            unpublishedAt: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        movePatterns: [],
        skills: [],
        skillDraftOptions: {
          effectTypes: [],
          targetRules: [],
          triggerTimings: [],
        },
      }),
    });

    const result = await usecase("歩");
    expect(result.pieces.map((piece) => piece.pieceId)).toEqual([1]);
  });

  it("filters by skill description", async () => {
    const usecase = createPieceSearchUseCase({
      listPiecesUseCase: async () => ({
        pieces: [
          {
            pieceId: 1,
            pieceCode: "AUTO001",
            kanji: "龍",
            name: "龍王",
            movePatternId: 1,
            movePatternName: "飛",
            skillId: 10,
            skillDesc: "周囲の敵を押し出す",
            imageSource: "supabase",
            imageBucket: null,
            imageKey: null,
            imageVersion: 1,
            isActive: true,
            publishedAt: null,
            unpublishedAt: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        movePatterns: [],
        skills: [],
        skillDraftOptions: {
          effectTypes: [],
          targetRules: [],
          triggerTimings: [],
        },
      }),
    });

    const result = await usecase("押し出す");
    expect(result.pieces).toHaveLength(1);
    expect(result.pieces[0]?.pieceId).toBe(1);
  });
});
