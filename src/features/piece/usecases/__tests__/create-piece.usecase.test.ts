import { describe, expect, it } from "bun:test";
import { createCreatePieceUseCase } from "@/features/piece/usecases/create-piece.usecase";

const baseInput = {
  pieceCode: "",
  kanji: "歩",
  name: "歩兵",
  movePatternId: 1,
  moveVectors: [],
  skillId: null,
  skillDraft: null,
  imageSource: "s3" as const,
  imageVersion: 1,
  isActive: true,
  publishedAt: null,
  unpublishedAt: null,
  imageFile: null as File | null,
};

describe("createPieceUseCase", () => {
  it("creates piece without image upload when imageFile is null", async () => {
    let uploadCalled = false;
    let insertArgs: unknown[] = [];

    const usecase = createCreatePieceUseCase({
      generatePieceCode: () => "AUTO001",
      insertMovePatternWithVectors: async () => 88,
      insertSkillWithEffect: async () => 100,
      uploadPieceImage: async () => {
        uploadCalled = true;
        return { imageBucket: "bucket", imageKey: "key" };
      },
      insertPiece: async (...args) => {
        insertArgs = args;
        return { pieceId: 1 } as { pieceId: number };
      },
    });

    const result = await usecase(baseInput);

    expect(result).toEqual({ pieceId: 1 });
    expect(uploadCalled).toBe(false);
    expect(insertArgs[0]).toMatchObject({
      pieceCode: "AUTO001",
      imageSource: "s3",
      imageVersion: 1,
    });
    expect(insertArgs[1]).toBeUndefined();
  });

  it("uploads image and forces supabase source when imageFile exists", async () => {
    let uploaded = false;
    let insertArgs: unknown[] = [];
    const file = new File(["x"], "piece.png", { type: "image/png" });

    const usecase = createCreatePieceUseCase({
      generatePieceCode: () => "AUTO002",
      insertMovePatternWithVectors: async () => 88,
      insertSkillWithEffect: async () => 100,
      uploadPieceImage: async (input) => {
        uploaded = true;
        expect(input.pieceCode).toBe("AUTO002");
        return { imageBucket: "piece-images", imageKey: "pieces/FU-1.png" };
      },
      insertPiece: async (...args) => {
        insertArgs = args;
        return { pieceId: 2 } as { pieceId: number };
      },
    });

    await usecase({
      ...baseInput,
      imageFile: file,
      imageSource: "s3",
      imageVersion: 0,
    });

    expect(uploaded).toBe(true);
    expect(insertArgs[0]).toMatchObject({
      imageSource: "supabase",
      imageVersion: 1,
    });
    expect(insertArgs[1]).toEqual({
      imageBucket: "piece-images",
      imageKey: "pieces/FU-1.png",
    });
  });

  it("throws when insert result is empty", async () => {
    const usecase = createCreatePieceUseCase({
      generatePieceCode: () => "AUTO003",
      insertMovePatternWithVectors: async () => 88,
      insertSkillWithEffect: async () => 100,
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      insertPiece: async () => null,
    });

    await expect(usecase(baseInput)).rejects.toThrow("Failed to create piece");
  });

  it("creates m_skill and m_skill_effect from draft", async () => {
    let draftCalled = false;
    let insertArg: unknown;

    const usecase = createCreatePieceUseCase({
      generatePieceCode: () => "AUTO004",
      insertMovePatternWithVectors: async () => 88,
      insertSkillWithEffect: async (draft) => {
        draftCalled = true;
        expect(draft.effectType).toBe("forced_move");
        return 777;
      },
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      insertPiece: async (input) => {
        insertArg = input;
        return { pieceId: 9 } as { pieceId: number };
      },
    });

    await usecase({
      ...baseInput,
      skillDraft: {
        skillDesc: "周囲を押し出す",
        effectType: "forced_move",
        targetRule: "adjacent_area",
        triggerTiming: "passive",
        valueText: "押し出す",
        valueNum: null,
        procChance: null,
        durationTurns: null,
        radius: 1,
        paramsJson: null,
      },
    });

    expect(draftCalled).toBe(true);
    expect(insertArg).toMatchObject({ skillId: 777, skillDraft: null });
  });

  it("creates custom move pattern when move vectors are provided", async () => {
    let createMovePatternCalled = false;
    let insertArg: unknown;

    const usecase = createCreatePieceUseCase({
      generatePieceCode: () => "AUTO005",
      insertMovePatternWithVectors: async (vectors) => {
        createMovePatternCalled = true;
        expect(vectors).toHaveLength(1);
        return 555;
      },
      insertSkillWithEffect: async () => 100,
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      insertPiece: async (input) => {
        insertArg = input;
        return { pieceId: 10 } as { pieceId: number };
      },
    });

    await usecase({
      ...baseInput,
      movePatternId: null,
      moveVectors: [{ dx: 0, dy: -1, maxStep: 1 }],
    });

    expect(createMovePatternCalled).toBe(true);
    expect(insertArg).toMatchObject({
      movePatternId: 555,
      moveVectors: [],
    });
  });
});
