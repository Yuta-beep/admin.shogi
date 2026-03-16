import { describe, expect, it } from "bun:test";

import {
  getPieceDetailUseCase,
  listPiecesUseCase,
} from "@/api/useCase/piece.useCase";

describe("piece.useCase v2", () => {
  it("returns skill registry in listPiecesUseCase", async () => {
    const result = await listPiecesUseCase("歩", {
      listPieces: async () => [
        {
          pieceId: 1,
          pieceCode: "p001",
          kanji: "歩",
          name: "歩兵",
          rarity: "N",
          moveDescriptionJa: null,
          movePatternId: 10,
          movePatternName: "歩",
          skillId: 65,
          skillDesc: "移動時に押し出す",
          imageSource: "supabase",
          imageBucket: null,
          imageKey: null,
          imageVersion: 1,
          isActive: true,
          publishedAt: null,
          unpublishedAt: null,
          createdAt: "2026-03-16T00:00:00.000Z",
          updatedAt: "2026-03-16T00:00:00.000Z",
        },
      ],
      listMovePatterns: async () => [],
      listSkills: async () => [],
      listSkillRegistry: async () => ({
        version: "skill-registry-v2-db",
        updatedAt: "2026-03-16T00:00:00.000Z",
        implementationKinds: [
          {
            code: "primitive",
            name: "Primitive",
            description: "common executor",
          },
        ],
        registries: {
          trigger: { groups: [] },
          target: { groups: [] },
          effect: { groups: [] },
          condition: { groups: [] },
          param: { groups: [] },
        },
      }),
      getPieceById: async () => null,
      getSkillDefinitionBySkillId: async () => null,
      listMoveVectorsByMovePatternId: async () => [],
      getMovePatternDetailById: async () => null,
      createSignedImageUrl: async () => null,
      insertSkillDefinitionV2: async () => 1,
      insertMovePatternWithVectors: async () => 1,
      updateMovePatternSpecialConfig: async () => undefined,
      uploadPieceImage: async () => ({ imageBucket: "x", imageKey: "y" }),
      insertPiece: async () => {
        throw new Error("unused");
      },
      updatePiece: async () => {
        throw new Error("unused");
      },
      deletePieceImage: async () => undefined,
      deletePiece: async () => undefined,
    });

    expect(result.pieces).toHaveLength(1);
    expect(result.skillRegistry.version).toBe("skill-registry-v2-db");
    expect(result.pieces[0]?.kanji).toBe("歩");
  });

  it("returns v2 skillDefinition in getPieceDetailUseCase", async () => {
    const detail = await getPieceDetailUseCase(1, {
      listPieces: async () => [],
      listMovePatterns: async () => [],
      listSkills: async () => [],
      listSkillRegistry: async () => {
        throw new Error("unused");
      },
      getPieceById: async () => ({
        pieceId: 1,
        pieceCode: "p001",
        kanji: "歩",
        name: "歩兵",
        rarity: "N",
        moveDescriptionJa: null,
        movePatternId: 10,
        movePatternName: "歩",
        skillId: 65,
        skillDesc: "移動時に押し出す",
        imageSource: "supabase",
        imageBucket: null,
        imageKey: null,
        imageVersion: 1,
        isActive: true,
        publishedAt: null,
        unpublishedAt: null,
        createdAt: "2026-03-16T00:00:00.000Z",
        updatedAt: "2026-03-16T00:00:00.000Z",
      }),
      getSkillDefinitionBySkillId: async () => ({
        skillId: 65,
        skillCode: "skill_65",
        skillDesc: "移動時に押し出す",
        version: "v2",
        implementationKind: "primitive",
        implementationKindName: "Primitive",
        trigger: {
          group: "event_move",
          type: "after_move",
          groupName: "移動イベント",
          typeName: "移動後",
        },
        source: { kind: "manual", file: null, functionName: null },
        tags: ["move_trigger"],
        scriptHook: null,
        conditions: [],
        effects: [],
        legacyEffects: [],
      }),
      listMoveVectorsByMovePatternId: async () => [{ dx: 0, dy: -1, maxStep: 1 }],
      getMovePatternDetailById: async () => null,
      createSignedImageUrl: async () => null,
      insertSkillDefinitionV2: async () => 1,
      insertMovePatternWithVectors: async () => 1,
      updateMovePatternSpecialConfig: async () => undefined,
      uploadPieceImage: async () => ({ imageBucket: "x", imageKey: "y" }),
      insertPiece: async () => {
        throw new Error("unused");
      },
      updatePiece: async () => {
        throw new Error("unused");
      },
      deletePieceImage: async () => undefined,
      deletePiece: async () => undefined,
    });

    expect(detail).not.toBeNull();
    expect(detail?.skillDefinition?.version).toBe("v2");
    expect(detail?.skillDefinition?.trigger.type).toBe("after_move");
  });
});
